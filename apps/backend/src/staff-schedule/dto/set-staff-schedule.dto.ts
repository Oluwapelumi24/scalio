import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';

export class StaffDayDto {
  // 0 = Sunday … 6 = Saturday (matches `Date#getDay()`)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsInt()
  @Min(0)
  @Max(24 * 60)
  startsAtMinutes!: number;

  @IsInt()
  @Min(0)
  @Max(24 * 60)
  endsAtMinutes!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(24 * 60)
  breakStartsAtMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(24 * 60)
  breakEndsAtMinutes?: number;
}

export class SetStaffScheduleDto {
  // Replaces the whole week. An empty list means "works whenever the business is open".
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => StaffDayDto)
  days!: StaffDayDto[];
}
