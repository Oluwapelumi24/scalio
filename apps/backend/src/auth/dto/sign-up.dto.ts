import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  // Minimal on purpose — length is the only bar, no complexity rules to fight.
  @IsString()
  @MinLength(8)
  password!: string;

  /** Optional so older app builds keep working. The website asks for it before a booking. */
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone?: string;
}
