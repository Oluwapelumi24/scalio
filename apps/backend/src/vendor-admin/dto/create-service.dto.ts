import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { paymentModeValues, serviceTypeValues } from '../../db/schema';

export class CreateServiceDto {
  @IsOptional()
  @IsIn(serviceTypeValues)
  serviceType?: (typeof serviceTypeValues)[number];

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceKobo?: number;

  @IsOptional()
  @IsIn(paymentModeValues)
  paymentMode?: (typeof paymentModeValues)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  depositPercent?: number;
}
