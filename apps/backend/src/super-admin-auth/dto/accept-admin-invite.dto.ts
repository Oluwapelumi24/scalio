import { IsString, MinLength } from 'class-validator';

export class AcceptAdminInviteDto {
  @IsString() token!: string;
  @IsString() @MinLength(8) password!: string;
}
