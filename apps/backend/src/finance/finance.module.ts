import { Module } from '@nestjs/common';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { AuditService } from './audit.service';
import { ExpensesService } from './expenses.service';
import { MoneyController, PaymentsSetupController, PayrollController } from './finance.controller';
import { LedgerService } from './ledger.service';
import { PayoutAccountService } from './payout-account.service';
import { PayrollService } from './payroll.service';

@Module({
  imports: [VendorAuthModule],
  controllers: [PaymentsSetupController, PayrollController, MoneyController],
  providers: [AuditService, LedgerService, PayoutAccountService, PayrollService, ExpensesService],
  exports: [LedgerService, PayrollService],
})
export class FinanceModule {}
