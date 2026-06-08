import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { staffRoleValues } from '../../db/schema';

export class CreateStaffDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Staff with an email get an invite link to set their own password and log
  // in (see VendorAuthService.issueInvite) — omit it for e.g. practitioners
  // who don't need dashboard access.
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsIn(staffRoleValues)
  role!: (typeof staffRoleValues)[number];
}
