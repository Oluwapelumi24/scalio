import { IsEmail } from 'class-validator';

export class ForgotAdminPasswordDto {
  @IsEmail() email!: string;
}
