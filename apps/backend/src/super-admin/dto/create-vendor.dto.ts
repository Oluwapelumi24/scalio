import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateVendorDto {
  @IsString() @MinLength(1) slug!: string;
  @IsString() @MinLength(1) businessName!: string;
  @IsString() @MinLength(1) category!: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsString() @IsOptional() themeColor?: string;
  @IsString() @IsOptional() address?: string;
  @IsInt() @Min(1) @IsOptional() averageDaysBetweenVisits?: number;
  @IsBoolean() @IsOptional() featured?: boolean;
}
