import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { paymentModeValues } from '../../db/schema';

export class CreateBookingDto {
  @IsUUID()
  vendorId!: string;

  @IsUUID()
  userId!: string;

  // PRD §4.1 step 7: email is verified at booking time via a one-time code
  // requested through POST /auth/otp/request.
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  otpCode!: string;

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
