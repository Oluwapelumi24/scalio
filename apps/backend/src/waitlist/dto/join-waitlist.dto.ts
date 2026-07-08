import { IsEmail, IsIn } from 'class-validator';

export class JoinWaitlistDto {
  @IsEmail() email!: string;
  @IsIn(['customer', 'vendor']) audience!: 'customer' | 'vendor';
}
