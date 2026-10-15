import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { decryptPii, encryptPii, last4 } from '../common/crypto';
import { DB, type Database } from '../db/db.module';
import { payrollSchedules, salaryPayouts, salaryRuns, staff, staffPay, vendors } from '../db/schema';
import { businessToday } from '../staff-schedule/period';
import { AuditService } from './audit.service';
import type { PayrollScheduleDto, StaffPayDto } from './dto/finance.dto';
import { LedgerService } from './ledger.service';
import { PayoutAccountService } from './payout-account.service';
import { salaryWindow } from './payroll-window';

/**
 * Payroll without Scalio touching the money: Scalio works out who to pay and how
 * much while the window is open, the owner pays from their own bank, then marks
 * each payout paid. Every step is recorded in the ledger and the audit log.
 */
@Injectable()
export class PayrollService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly accounts: PayoutAccountService,
    private readonly ledger: LedgerService,
    private readonly audit: AuditService,
  ) {}

  private async today(vendorId: string) {
    const [v] = await this.db.select({ tz: vendors.timezone }).from(vendors).where(eq(vendors.id, vendorId));
    if (!v) throw new NotFoundException('Business not found');
    return businessToday(new Date(), v.tz);
  }

  private async schedule(vendorId: string) {
    const [s] = await this.db.select().from(payrollSchedules).where(eq(payrollSchedules.vendorId, vendorId));
    return s ?? null;
  }

  async window(vendorId: string) {
    return salaryWindow(await this.schedule(vendorId), await this.today(vendorId));
  }

  /** Everything the payroll screen needs. Account numbers are masked. */
  async overview(vendorId: string) {
    const [schedule, window, team] = await Promise.all([
      this.schedule(vendorId),
      this.window(vendorId),
      this.db
        .select({
          staffId: staff.id, name: staff.name, role: staff.role,
          monthlySalaryKobo: staffPay.monthlySalaryKobo, bankName: staffPay.bankName,
          accountLast4: staffPay.accountLast4, accountName: staffPay.accountName, verifiedAt: staffPay.verifiedAt,
        })
        .from(staff)
        .leftJoin(staffPay, eq(staffPay.staffId, staff.id))
        .where(eq(staff.vendorId, vendorId))
        .orderBy(asc(staff.name)),
    ]);
    const missingAccount = team.filter((m) => (m.monthlySalaryKobo ?? 0) > 0 && !m.verifiedAt).map((m) => m.name);
    const payable = team.filter((m) => (m.monthlySalaryKobo ?? 0) > 0 && m.verifiedAt);
    const run = window.period ? await this.runForPeriod(vendorId, window.period) : null;

    let canStart = window.state === 'open' && !run && payable.length > 0 && missingAccount.length === 0;
    let blockedReason: string | null = null;
    if (window.state !== 'open') blockedReason = window.reason;
    else if (run) blockedReason = null;
    else if (missingAccount.length) blockedReason = `Add a verified bank account for ${missingAccount.join(', ')} first.`;
    else if (!payable.length) blockedReason = 'Set a monthly salary for at least one person first.';
    if (blockedReason) canStart = false;

    return {
      schedule,
      window,
      team,
      totals: { monthlyKobo: payable.reduce((s, m) => s + (m.monthlySalaryKobo ?? 0), 0), people: payable.length },
      canStart,
      blockedReason,
      currentRun: run ? await this.runDetail(vendorId, run.id, false) : null,
    };
  }

  async setSchedule(vendorId: string, actorStaffId: string, dto: PayrollScheduleDto) {
    const values = {
      payDay: dto.payDay,
      opensDaysBefore: dto.opensDaysBefore ?? 3,
      closesDaysAfter: dto.closesDaysAfter ?? 5,
      paused: dto.paused ?? false,
      updatedAt: new Date(),
    };
    await this.db.insert(payrollSchedules).values({ vendorId, ...values }).onConflictDoUpdate({ target: payrollSchedules.vendorId, set: values });
    await this.audit.record({ vendorId, actorStaffId, action: 'payroll.schedule_changed', entityType: 'payroll_schedule', entityId: vendorId, details: values });
    return this.overview(vendorId);
  }

  async setStaffPay(vendorId: string, actorStaffId: string, staffId: string, dto: StaffPayDto) {
    const [member] = await this.db.select({ id: staff.id }).from(staff).where(and(eq(staff.id, staffId), eq(staff.vendorId, vendorId)));
    if (!member) throw new NotFoundException('Staff member not found');
    const [existing] = await this.db.select().from(staffPay).where(eq(staffPay.staffId, staffId));

    const values: Partial<typeof staffPay.$inferInsert> = { updatedAt: new Date() };
    if (dto.monthlySalaryKobo !== undefined) values.monthlySalaryKobo = dto.monthlySalaryKobo;
    let accountChanged = false;
    if (dto.bankCode && dto.accountNumber) {
      // New or changed accounts are verified with the bank before they're saved.
      const { accountName } = await this.accounts.resolve(dto.bankCode, dto.accountNumber);
      Object.assign(values, {
        bankCode: dto.bankCode,
        bankName: await this.accounts.bankName(dto.bankCode),
        accountNumberEnc: encryptPii(dto.accountNumber),
        accountLast4: last4(dto.accountNumber),
        accountName,
        verifiedAt: new Date(),
      });
      accountChanged = true;
    }
    await this.db.insert(staffPay).values({ staffId, vendorId, ...values }).onConflictDoUpdate({ target: staffPay.staffId, set: values });
    await this.audit.record({
      vendorId, actorStaffId, action: accountChanged ? 'staff_pay.account_changed' : 'staff_pay.salary_changed',
      entityType: 'staff_pay', entityId: staffId,
      details: {
        monthlySalaryKobo: values.monthlySalaryKobo ?? existing?.monthlySalaryKobo ?? null,
        ...(accountChanged ? { accountLast4: values.accountLast4, previousLast4: existing?.accountLast4 ?? null } : {}),
      },
    });
    return this.overview(vendorId);
  }

  private async runForPeriod(vendorId: string, period: string) {
    const [run] = await this.db.select().from(salaryRuns).where(and(eq(salaryRuns.vendorId, vendorId), eq(salaryRuns.period, period)));
    return run ?? null;
  }

  /**
   * Starts this window's payroll. Only while the window is open and everyone
   * with a salary has a verified account. Starting twice returns the same run.
   */
  async startRun(vendorId: string, actorStaffId: string) {
    const o = await this.overview(vendorId);
    if (o.currentRun) return o.currentRun;
    if (!o.canStart || !o.window.period) throw new ConflictException(o.blockedReason ?? 'Payroll is not open.');

    const payable = await this.db
      .select({ staffId: staff.id, name: staff.name, pay: staffPay })
      .from(staff)
      .innerJoin(staffPay, eq(staffPay.staffId, staff.id))
      .where(and(eq(staff.vendorId, vendorId), sql`${staffPay.monthlySalaryKobo} > 0`, sql`${staffPay.verifiedAt} is not null`));

    const runId = await this.db.transaction(async (tx) => {
      const [run] = await tx
        .insert(salaryRuns)
        .values({ vendorId, period: o.window.period!, createdById: actorStaffId })
        .onConflictDoNothing({ target: [salaryRuns.vendorId, salaryRuns.period] })
        .returning({ id: salaryRuns.id });
      if (!run) return null; // someone else started it a moment ago
      await tx.insert(salaryPayouts).values(
        payable.map((p) => ({
          runId: run.id, vendorId, staffId: p.staffId, staffName: p.name,
          amountKobo: p.pay.monthlySalaryKobo!, bankName: p.pay.bankName!, accountNumberEnc: p.pay.accountNumberEnc!,
          accountLast4: p.pay.accountLast4!, accountName: p.pay.accountName!,
        })),
      );
      return run.id;
    });
    const run = runId ? { id: runId } : await this.runForPeriod(vendorId, o.window.period);
    await this.audit.record({ vendorId, actorStaffId, action: 'payroll.run_started', entityType: 'salary_run', entityId: run!.id, details: { period: o.window.period, people: payable.length } });
    return this.runDetail(vendorId, run!.id, false);
  }

  /** `reveal` shows full account numbers — for the owner's transfer list only. */
  async runDetail(vendorId: string, runId: string, reveal: boolean) {
    const [run] = await this.db.select().from(salaryRuns).where(and(eq(salaryRuns.id, runId), eq(salaryRuns.vendorId, vendorId)));
    if (!run) throw new NotFoundException('Payroll not found');
    const items = await this.db.select().from(salaryPayouts).where(eq(salaryPayouts.runId, runId)).orderBy(asc(salaryPayouts.staffName));
    return {
      id: run.id,
      period: run.period,
      status: run.status,
      createdAt: run.createdAt,
      totalKobo: items.reduce((s, i) => s + i.amountKobo, 0),
      paidKobo: items.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amountKobo, 0),
      payouts: items.map((i) => ({
        id: i.id, staffId: i.staffId, staffName: i.staffName, amountKobo: i.amountKobo, bankName: i.bankName,
        accountLast4: i.accountLast4, accountName: i.accountName, status: i.status, reference: i.reference, paidAt: i.paidAt,
        ...(reveal ? { accountNumber: decryptPii(i.accountNumberEnc) } : {}),
      })),
    };
  }

  async runs(vendorId: string) {
    return this.db
      .select({
        id: salaryRuns.id, period: salaryRuns.period, status: salaryRuns.status, createdAt: salaryRuns.createdAt,
        totalKobo: sql<number>`coalesce(sum(${salaryPayouts.amountKobo}), 0)`.mapWith(Number),
        paidKobo: sql<number>`coalesce(sum(${salaryPayouts.amountKobo}) filter (where ${salaryPayouts.status} = 'paid'), 0)`.mapWith(Number),
        people: sql<number>`count(${salaryPayouts.id})`.mapWith(Number),
      })
      .from(salaryRuns)
      .leftJoin(salaryPayouts, eq(salaryPayouts.runId, salaryRuns.id))
      .where(eq(salaryRuns.vendorId, vendorId))
      .groupBy(salaryRuns.id)
      .orderBy(desc(salaryRuns.period));
  }

  /** Records a salary the owner has paid from their bank. Safe to tap twice. */
  async markPaid(vendorId: string, actorStaffId: string, payoutId: string, reference?: string) {
    const [p] = await this.db
      .update(salaryPayouts)
      .set({ status: 'paid', paidAt: new Date(), reference: reference ?? null, recordedById: actorStaffId })
      .where(and(eq(salaryPayouts.id, payoutId), eq(salaryPayouts.vendorId, vendorId), eq(salaryPayouts.status, 'pending')))
      .returning();
    const payout = p ?? (await this.payout(vendorId, payoutId));
    if (p) {
      await this.ledger.record({
        vendorId, kind: 'salary', direction: 'out', amountKobo: p.amountKobo, occurredAt: p.paidAt!,
        description: `Salary · ${p.staffName}`, dedupeKey: `salary:${p.id}`, salaryPayoutId: p.id, createdById: actorStaffId,
      });
      await this.audit.record({ vendorId, actorStaffId, action: 'payroll.payout_marked_paid', entityType: 'salary_payout', entityId: p.id, details: { amountKobo: p.amountKobo, accountLast4: p.accountLast4, reference: reference ?? null } });
      await this.completeIfDone(payout.runId);
    }
    return this.runDetail(vendorId, payout.runId, false);
  }

  async skip(vendorId: string, actorStaffId: string, payoutId: string) {
    const [p] = await this.db
      .update(salaryPayouts)
      .set({ status: 'skipped', recordedById: actorStaffId })
      .where(and(eq(salaryPayouts.id, payoutId), eq(salaryPayouts.vendorId, vendorId), eq(salaryPayouts.status, 'pending')))
      .returning();
    const payout = p ?? (await this.payout(vendorId, payoutId));
    if (p) {
      await this.audit.record({ vendorId, actorStaffId, action: 'payroll.payout_skipped', entityType: 'salary_payout', entityId: p.id, details: { amountKobo: p.amountKobo } });
      await this.completeIfDone(payout.runId);
    }
    return this.runDetail(vendorId, payout.runId, false);
  }

  private async payout(vendorId: string, payoutId: string) {
    const [p] = await this.db.select().from(salaryPayouts).where(and(eq(salaryPayouts.id, payoutId), eq(salaryPayouts.vendorId, vendorId)));
    if (!p) throw new NotFoundException('Payout not found');
    return p;
  }

  private async completeIfDone(runId: string) {
    const [left] = await this.db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(salaryPayouts)
      .where(and(eq(salaryPayouts.runId, runId), eq(salaryPayouts.status, 'pending')));
    if ((left?.n ?? 0) === 0) {
      await this.db.update(salaryRuns).set({ status: 'completed', completedAt: new Date() }).where(and(eq(salaryRuns.id, runId), eq(salaryRuns.status, 'open')));
    }
  }
}
