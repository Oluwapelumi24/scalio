import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ExchangeHandoffDto {
  @IsString()
  @MinLength(32)
  @MaxLength(64)
  @Matches(/^[0-9a-fA-F]+$/)
  code!: string;
}
