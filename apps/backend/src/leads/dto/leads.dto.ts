import { IsDateString, IsEmail, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { leadSourceValues, leadStatusValues } from '../../db/schema';

const PHONE = /^\+?[\d\s()-]{7,20}$/;

export class CreateLeadDto {
  @IsString() @MinLength(1) @MaxLength(120)
  name!: string;

  @IsOptional() @IsString() @Matches(PHONE, { message: 'Enter a valid phone number.' })
  phone?: string;

  @IsOptional() @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string;

  @IsIn(leadSourceValues)
  source!: string;

  @IsOptional() @IsString() @MaxLength(1000)
  note?: string;

  @IsOptional() @IsUUID()
  assignedStaffId?: string;

  @IsOptional() @IsDateString()
  followUpAt?: string;

  @IsOptional() @IsUUID()
  contentPostId?: string;
}

export class UpdateLeadDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120)
  name?: string;

  @IsOptional() @IsString() @Matches(PHONE, { message: 'Enter a valid phone number.' })
  phone?: string | null;

  @IsOptional() @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string | null;

  @IsOptional() @IsIn(leadSourceValues)
  source?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  note?: string | null;

  /** `won` is set by converting the lead, not here. */
  @IsOptional() @IsIn(['new', 'contacted', 'lost'])
  status?: string;

  /** Null unassigns. */
  @IsOptional() @IsUUID()
  assignedStaffId?: string | null;

  /** Null clears the follow-up. */
  @IsOptional() @IsDateString()
  followUpAt?: string | null;
}

export class ListLeadsDto {
  @IsOptional() @IsIn(leadStatusValues)
  status?: string;

  /** Only leads whose follow-up is due (or new leads left untouched for a day). */
  @IsOptional() @IsIn(['1', 'true'])
  due?: string;
}
