import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { eq, type InferSelectModel } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { users } from '../db/schema';

const PASSWORD_HASH_ROUNDS = 10;

export interface UserSession {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async signUp(name: string, email: string, password: string): Promise<UserSession> {
    const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await hash(password, PASSWORD_HASH_ROUNDS);
    const [created] = await this.db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning();
    return this.issueSession(created);
  }

  async signIn(email: string, password: string): Promise<UserSession> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email));
    if (!row?.passwordHash || !(await compare(password, row.passwordHash))) {
      throw new UnauthorizedException('Incorrect email or password.');
    }
    return this.issueSession(row);
  }

  /** Used by the JWT strategy to re-resolve the principal on every request. */
  async findById(userId: string): Promise<InferSelectModel<typeof users> | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, userId));
    return row ?? null;
  }

  /** Stores the Expo push token the mobile app obtained after the user granted notification permission. */
  async registerPushToken(userId: string, token: string): Promise<void> {
    const [updated] = await this.db
      .update(users)
      .set({ expoPushToken: token })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    if (!updated) {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }

  private issueSession(row: InferSelectModel<typeof users>): UserSession {
    const accessToken = this.jwt.sign({ sub: row.id });
    return {
      accessToken,
      user: { id: row.id, name: row.name, email: row.email },
    };
  }
}
