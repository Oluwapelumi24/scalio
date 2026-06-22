import { IsEmail } from 'class-validator';

export class RequestAdminInviteDto {
  @IsEmail() email!: string;
}
