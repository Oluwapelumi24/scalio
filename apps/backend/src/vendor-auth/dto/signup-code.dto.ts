import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class SignupCodeDto {
  @IsEmail()
  email!: string;
}

export class VerifySignupCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
