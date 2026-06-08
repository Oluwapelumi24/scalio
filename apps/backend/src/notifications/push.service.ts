import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { customers, users } from '../db/schema';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * Looks up the app user behind a vendor's CRM customer record (PRD §6.1)
   * and pushes to their registered device. A no-op if they never granted
   * notification permission (no token on file) or never booked through the app.
   */
  async notifyCustomer(
    customerId: string,
    message: PushMessage,
  ): Promise<void> {
    const [row] = await this.db
      .select({ expoPushToken: users.expoPushToken })
      .from(customers)
      .innerJoin(users, eq(users.id, customers.userId))
      .where(eq(customers.id, customerId));

    if (row?.expoPushToken) {
      await this.send(row.expoPushToken, message);
    }
  }

  private async send(token: string, message: PushMessage): Promise<void> {
    try {
      await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          to: token,
          title: message.title,
          body: message.body,
          data: message.data,
        }),
      });
    } catch (err) {
      // Best-effort delivery — a flaky push provider should never break the booking flow.
      this.logger.warn(
        `Failed to deliver push notification: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
