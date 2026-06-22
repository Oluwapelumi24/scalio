import { IsEmail } from 'class-validator';

export class ForgotVendorPasswordDto {
  @IsEmail()
  email!: string;
}
