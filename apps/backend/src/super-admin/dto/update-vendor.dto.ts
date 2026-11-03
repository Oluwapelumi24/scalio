import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { SLOT_INTERVAL_OPTIONS } from '../../vendor/availability';

export class UpdateVendorDto {
  @IsString() @MinLength(1) @IsOptional() slug?: string;
  @IsString() @MinLength(1) @IsOptional() businessName?: string;
  @IsString() @MinLength(1) @IsOptional() category?: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsString() @IsOptional() themeColor?: string;
  @IsString() @IsOptional() address?: string;
  @IsInt() @Min(1) @IsOptional() averageDaysBetweenVisits?: number;
  @IsBoolean() @IsOptional() featured?: boolean;
  /** Gap between bookable start times, in minutes. */
  @IsIn(SLOT_INTERVAL_OPTIONS) @IsOptional() slotIntervalMinutes?: number;
}
