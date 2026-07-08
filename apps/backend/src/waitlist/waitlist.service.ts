import { Inject, Injectable } from '@nestjs/common';
import { DB, type Database } from '../db/db.module';
import { waitlistSignups } from '../db/schema';

@Injectable()
export class WaitlistService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async join(email: string, audience: 'customer' | 'vendor'): Promise<{ success: true }> {
    await this.db
      .insert(waitlistSignups)
      .values({ email, audience })
      .onConflictDoNothing({ target: waitlistSignups.email });
    return { success: true };
  }
}
