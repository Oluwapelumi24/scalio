import { ArrayNotEmpty, IsArray, IsDateString, IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** A booking made by the business: either `customerId`, or the new client's details. */
export class CreateVendorBookingDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  serviceIds!: string[];

  @IsDateString()
  scheduledAt!: string;
}
