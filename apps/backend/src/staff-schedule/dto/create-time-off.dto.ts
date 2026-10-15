import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTimeOffDto {
  @IsDateString()
  startDate!: string; // 'YYYY-MM-DD', inclusive

  @IsDateString()
  endDate!: string; // 'YYYY-MM-DD', inclusive

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
