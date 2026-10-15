import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional } from 'class-validator';
import { INTEREST_IDS, MODULE_IDS } from '../catalog';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(INTEREST_IDS.length)
  @IsIn(INTEREST_IDS, { each: true })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MODULE_IDS.length)
  @IsIn(MODULE_IDS, { each: true })
  pinnedModules?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MODULE_IDS.length)
  @IsIn(MODULE_IDS, { each: true })
  hiddenModules?: string[];

  // Set when the owner finishes (or skips) the interest screen, so it isn't shown again.
  @IsOptional()
  @IsBoolean()
  completeInterests?: boolean;
}
