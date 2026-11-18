import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { BUSINESS_CATEGORIES } from '../../vendor-admin/categories';

export class RegisterVendorDto {
  @IsString() @MinLength(1) ownerName!: string;
  @IsString() @MinLength(1) businessName!: string;
  @IsEmail() email!: string;
  /** Proof returned after the email code is accepted. */
  @IsString() @MinLength(32) @MaxLength(64) proof!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() registrationNumber?: string;
  /** What customers browse by. Omitted listings stay in "Other" until the business sets one. */
  @IsOptional() @IsIn(BUSINESS_CATEGORIES) category?: (typeof BUSINESS_CATEGORIES)[number];
  /** Neighbourhood customers can match, for example "Yaba, Lagos". */
  @IsOptional() @IsString() @MaxLength(200) address?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}
