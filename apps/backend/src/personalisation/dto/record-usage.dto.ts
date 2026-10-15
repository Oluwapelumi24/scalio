import { IsIn } from 'class-validator';
import { MODULE_IDS } from '../catalog';

export class RecordUsageDto {
  @IsIn(MODULE_IDS)
  moduleId!: string;
}
