import { IsEmail } from 'class-validator';

export class RequestVendorInviteDto {
  @IsEmail()
  email!: string;
}
