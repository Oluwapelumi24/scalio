import { IsOptional, IsUUID } from 'class-validator';

export class ClockDto {
  // Omit to clock yourself in/out; owners and managers may name someone else.
  @IsOptional()
  @IsUUID()
  staffId?: string;
}
