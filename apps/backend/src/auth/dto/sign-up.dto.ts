import { IsEmail, IsString, MinLength } from 'class-validator';

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
}
