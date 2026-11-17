import { IsOptional, IsUUID } from 'class-validator';

/** Kept so older clients can still send it. The server uses the signed-in user, not this value. */
export class ListBookingsQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;
}
