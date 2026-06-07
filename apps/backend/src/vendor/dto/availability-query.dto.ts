import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AvailabilityQueryDto {
  @IsDateString()
  date!: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value))
  serviceIds?: string[];

  @IsOptional()
  @IsUUID()
  staffId?: string;
}
