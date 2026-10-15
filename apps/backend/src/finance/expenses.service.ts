import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { expenses } from '../db/schema';
import { AuditService } from './audit.service';
import type { CreateExpenseDto } from './dto/finance.dto';
import { LedgerService } from './ledger.service';

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly ledger: LedgerService,
    private readonly audit: AuditService,
  ) {}

  list(vendorId: string, from: string, to: string) {
    return this.db
      .select({ id: expenses.id, amountKobo: expenses.amountKobo, category: expenses.category, spentOn: expenses.spentOn, note: expenses.note })
      .from(expenses)
      .where(and(eq(expenses.vendorId, vendorId), isNull(expenses.voidedAt), gte(expenses.spentOn, from.slice(0, 10)), lte(expenses.spentOn, to.slice(0, 10))))
      .orderBy(desc(expenses.spentOn));
  }

  async create(vendorId: string, actorStaffId: string, dto: CreateExpenseDto) {
    const spentOn = dto.spentOn.slice(0, 10);
    const [row] = await this.db
      .insert(expenses)
      .values({ vendorId, amountKobo: dto.amountKobo, category: dto.category, spentOn, note: dto.note ?? null, createdById: actorStaffId })
      .returning();
    await this.ledger.record({
      vendorId, kind: 'expense', direction: 'out', amountKobo: row.amountKobo,
      occurredAt: new Date(`${spentOn}T12:00:00Z`), description: `${row.category}${row.note ? ` · ${row.note}` : ''}`,
      dedupeKey: `expense:${row.id}`, expenseId: row.id, createdById: actorStaffId,
    });
    await this.audit.record({ vendorId, actorStaffId, action: 'expense.added', entityType: 'expense', entityId: row.id, details: { amountKobo: row.amountKobo, category: row.category } });
    return row;
  }

  /** Expenses aren't deleted: voiding hides them and adds a reversing ledger entry. */
  async void(vendorId: string, actorStaffId: string, id: string) {
    const [row] = await this.db
      .update(expenses)
      .set({ voidedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.vendorId, vendorId), isNull(expenses.voidedAt)))
      .returning();
    if (!row) throw new NotFoundException('Expense not found');
    await this.ledger.record({
      vendorId, kind: 'expense', direction: 'in', amountKobo: row.amountKobo, occurredAt: new Date(`${row.spentOn}T12:00:00Z`),
      description: `Removed: ${row.category}`, dedupeKey: `expense-void:${row.id}`, expenseId: row.id, createdById: actorStaffId,
    });
    await this.audit.record({ vendorId, actorStaffId, action: 'expense.voided', entityType: 'expense', entityId: row.id, details: { amountKobo: row.amountKobo } });
  }
}
