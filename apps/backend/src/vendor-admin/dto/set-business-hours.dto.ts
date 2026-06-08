import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class BusinessHoursEntryDto {
  // 0 = Sunday … 6 = Saturday (matches `Date#getDay()`)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsInt()
  @Min(0)
  @Max(24 * 60)
  opensAtMinutes!: number;

  @IsInt()
  @Min(0)
  @Max(24 * 60)
  closesAtMinutes!: number;
}

export class SetBusinessHoursDto {
  // Replaces the whole week in one call — at most one entry per weekday.
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => BusinessHoursEntryDto)
  days!: BusinessHoursEntryDto[];
}
