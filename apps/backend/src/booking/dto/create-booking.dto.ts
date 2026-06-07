import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { paymentModeValues } from '../../db/schema';

export class CreateBookingDto {
  @IsUUID()
  vendorId!: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds!: string[];

  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsIn(paymentModeValues)
  paymentMode!: (typeof paymentModeValues)[number];

  @IsInt()
  @Min(0)
  amountDueKobo!: number;
}
