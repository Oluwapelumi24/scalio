import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { users } from '../db/schema';

@Injectable()
export class AuthService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * Sign-up only collects name + email (PRD ask: "just email and name").
   * Returning users are recognized by email rather than erroring, since
   * there's no password to check yet — this is an identity stand-in until
   * real auth (OTP/magic-link) lands.
   */
  async signUp(name: string, email: string) {
    const [existing] = await this.db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return existing;
    }

    const [created] = await this.db.insert(users).values({ name, email }).returning();
    return created;
  }
}
