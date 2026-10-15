import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { BankAccountDto, CreateExpenseDto, EXPENSE_CATEGORIES, MarkPaidDto, PayrollScheduleDto, PeriodDto, StaffPayDto } from './dto/finance.dto';
import { ExpensesService } from './expenses.service';
import { LedgerService } from './ledger.service';
import { PayoutAccountService } from './payout-account.service';
import { PayrollService } from './payroll.service';

// Money is owner/manager business. Changing where the business gets paid is owner-only.

@Controller('vendor-admin/payments')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class PaymentsSetupController {
  constructor(private readonly accounts: PayoutAccountService) {}

  @Get('banks')
  banks() {
    return this.accounts.banks();
  }

  @Post('resolve-account')
  @HttpCode(HttpStatus.OK)
  resolve(@Body() dto: BankAccountDto) {
    return this.accounts.resolve(dto.bankCode, dto.accountNumber);
  }

  @Get('account')
  account(@CurrentStaff() me: VendorPrincipal) {
    return this.accounts.get(me.vendorId);
  }

  @Put('account')
  @Roles('owner')
  setAccount(@CurrentStaff() me: VendorPrincipal, @Body() dto: BankAccountDto) {
    return this.accounts.save(me.vendorId, me.staffId, dto.bankCode, dto.accountNumber);
  }
}

@Controller('vendor-admin/payroll')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Get()
  overview(@CurrentStaff() me: VendorPrincipal) {
    return this.payroll.overview(me.vendorId);
  }

  @Put('schedule')
  schedule(@CurrentStaff() me: VendorPrincipal, @Body() dto: PayrollScheduleDto) {
    return this.payroll.setSchedule(me.vendorId, me.staffId, dto);
  }

  @Put('staff/:staffId')
  staffPay(@CurrentStaff() me: VendorPrincipal, @Param('staffId', ParseUUIDPipe) staffId: string, @Body() dto: StaffPayDto) {
    return this.payroll.setStaffPay(me.vendorId, me.staffId, staffId, dto);
  }

  @Get('runs')
  runs(@CurrentStaff() me: VendorPrincipal) {
    return this.payroll.runs(me.vendorId);
  }

  @Post('runs')
  start(@CurrentStaff() me: VendorPrincipal) {
    return this.payroll.startRun(me.vendorId, me.staffId);
  }

  @Get('runs/:id')
  run(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.payroll.runDetail(me.vendorId, id, false);
  }

  /** Full account numbers, so the owner can pay from their bank. Owner/manager only. */
  @Get('runs/:id/transfer-list')
  transferList(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.payroll.runDetail(me.vendorId, id, true);
  }

  @Post('payouts/:id/paid')
  @HttpCode(HttpStatus.OK)
  paid(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MarkPaidDto) {
    return this.payroll.markPaid(me.vendorId, me.staffId, id, dto.reference);
  }

  @Post('payouts/:id/skip')
  @HttpCode(HttpStatus.OK)
  skip(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.payroll.skip(me.vendorId, me.staffId, id);
  }
}

@Controller('vendor-admin/money')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class MoneyController {
  constructor(
    private readonly ledger: LedgerService,
    private readonly expenses: ExpensesService,
  ) {}

  @Get('summary')
  async summary(@CurrentStaff() me: VendorPrincipal, @Query() q: PeriodDto) {
    const r = await this.ledger.period(me.vendorId, q.from, q.to);
    return { from: r.fromDate, to: r.toDate, ...(await this.ledger.summary(me.vendorId, r.start, r.end)) };
  }

  @Get('ledger')
  async entries(@CurrentStaff() me: VendorPrincipal, @Query() q: PeriodDto) {
    const r = await this.ledger.period(me.vendorId, q.from, q.to);
    return this.ledger.list(me.vendorId, r.start, r.end);
  }

  @Get('expense-categories')
  categories() {
    return EXPENSE_CATEGORIES;
  }

  @Get('expenses')
  list(@CurrentStaff() me: VendorPrincipal, @Query() q: PeriodDto) {
    return this.expenses.list(me.vendorId, q.from, q.to);
  }

  @Post('expenses')
  create(@CurrentStaff() me: VendorPrincipal, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(me.vendorId, me.staffId, dto);
  }

  @Post('expenses/:id/void')
  @HttpCode(HttpStatus.NO_CONTENT)
  async voidExpense(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    await this.expenses.void(me.vendorId, me.staffId, id);
  }
}
