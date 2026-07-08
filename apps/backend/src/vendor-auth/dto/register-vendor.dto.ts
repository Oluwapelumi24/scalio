import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterVendorDto {
  @IsString() @MinLength(1) ownerName!: string;
  @IsString() @MinLength(1) businessName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() registrationNumber?: string;
}
