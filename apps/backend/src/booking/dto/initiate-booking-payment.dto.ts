import { IsIn, IsInt, Min } from 'class-validator';

export class InitiateBookingPaymentDto {
  @IsIn(['deposit', 'full_prepayment'])
  paymentMode!: 'deposit' | 'full_prepayment';

  @IsInt()
  @Min(1)
  amountDueKobo!: number;
}
