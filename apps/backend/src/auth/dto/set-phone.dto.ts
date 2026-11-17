import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetPhoneDto {
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;
}
