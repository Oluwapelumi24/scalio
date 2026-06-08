import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { paymentModeValues } from '../../db/schema';

export class CreateServiceDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsInt()
  @Min(0)
  priceKobo!: number;

  @IsOptional()
  @IsIn(paymentModeValues)
  paymentMode?: (typeof paymentModeValues)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  depositPercent?: number;
}
