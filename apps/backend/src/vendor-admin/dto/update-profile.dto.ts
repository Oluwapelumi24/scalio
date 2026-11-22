import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { BUSINESS_CATEGORIES } from '../categories';

export class UpdateVendorProfileDto {
  @IsIn(BUSINESS_CATEGORIES)
  category!: (typeof BUSINESS_CATEGORIES)[number];

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  address!: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  /** Studio media id — becomes the permanent marketplace photo URL. */
  @IsOptional()
  @IsUUID()
  logoMediaId?: string;

  @IsOptional()
  @IsBoolean()
  clearLogo?: boolean;
}
