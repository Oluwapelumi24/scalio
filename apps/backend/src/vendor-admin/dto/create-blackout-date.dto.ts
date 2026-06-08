import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateBlackoutDateDto {
  @IsDateString()
  date!: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsString()
  reason?: string;
}
