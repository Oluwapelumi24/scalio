import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

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
}
