import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class PeriodQueryDto {
  @IsDateString()
  from!: string; // 'YYYY-MM-DD', inclusive, business calendar

  @IsDateString()
  to!: string; // 'YYYY-MM-DD', inclusive

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;
}
