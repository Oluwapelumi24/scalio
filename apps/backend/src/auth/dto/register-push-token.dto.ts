import { IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterPushTokenDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MinLength(1)
  token!: string;
}
