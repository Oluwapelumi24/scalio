import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class BankAccountDto {
  @IsString()
  @Matches(/^\d{3,6}$/, { message: 'Choose a bank from the list.' })
  bankCode!: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: 'Enter the 10-digit account number (NUBAN).' })
  accountNumber!: string;
}

export class PayrollScheduleDto {
  @IsInt() @Min(1) @Max(28)
  payDay!: number;

  @IsOptional() @IsInt() @Min(0) @Max(10)
  opensDaysBefore?: number;

  @IsOptional() @IsInt() @Min(0) @Max(10)
  closesDaysAfter?: number;

  @IsOptional() @IsBoolean()
  paused?: boolean;
}

export class StaffPayDto {
  @IsOptional() @IsInt() @Min(0) @Max(100_000_000_00)
  monthlySalaryKobo?: number;

  @IsOptional() @IsString() @Matches(/^\d{3,6}$/)
  bankCode?: string;

  @IsOptional() @IsString() @Matches(/^\d{10}$/, { message: 'Enter the 10-digit account number (NUBAN).' })
  accountNumber?: string;
}

export class MarkPaidDto {
  @IsOptional() @IsString() @MaxLength(80)
  reference?: string;
}

export const EXPENSE_CATEGORIES = ['Rent', 'Supplies', 'Utilities', 'Transport', 'Marketing', 'Equipment', 'Other'] as const;

export class CreateExpenseDto {
  @IsInt() @Min(1) @Max(100_000_000_00)
  amountKobo!: number;

  @IsIn(EXPENSE_CATEGORIES)
  category!: string;

  @IsDateString()
  spentOn!: string;

  @IsOptional() @IsString() @MaxLength(200)
  note?: string;
}

export class PeriodDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
