import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetVendorPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
