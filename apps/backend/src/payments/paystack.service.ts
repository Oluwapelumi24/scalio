import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface InitializeTransactionInput {
  email: string;
  amountKobo: number;
  reference: string;
  /** Where Paystack redirects the customer after payment (the mobile app's deep link). */
  callbackUrl?: string;
}

export interface InitializeTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

@Injectable()
export class PaystackService {
  constructor(private readonly config: ConfigService) {}

  private get secretKey(): string {
    const key = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) {
      throw new InternalServerErrorException(
        'PAYSTACK_SECRET_KEY is not configured',
      );
    }
    return key;
  }

  /**
   * Starts a Paystack transaction for a `deposit`/`full_prepayment` booking.
   * Amounts are already kobo-denominated throughout this codebase, which is
   * exactly what Paystack's API expects — no conversion needed.
   */
  async initializeTransaction(
    input: InitializeTransactionInput,
  ): Promise<InitializeTransactionResult> {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: input.email,
          amount: input.amountKobo,
          reference: input.reference,
          callback_url: input.callbackUrl,
        }),
      },
    );

    const body = (await response.json()) as {
      status: boolean;
      message: string;
      data?: {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
    };

    if (!response.ok || !body.status || !body.data) {
      throw new InternalServerErrorException(
        `Paystack initialize failed: ${body.message ?? response.statusText}`,
      );
    }

    return {
      authorizationUrl: body.data.authorization_url,
      accessCode: body.data.access_code,
      reference: body.data.reference,
    };
  }

  /**
   * Verifies the `x-paystack-signature` header: HMAC-SHA512 of the raw request
   * body, keyed with the secret key (Paystack docs §Webhooks). Must run against
   * the *raw* body bytes — JSON.stringify-ing a parsed body can reorder/reformat
   * and produce a different signature.
   */
  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string | undefined,
  ): boolean {
    if (!signature) {
      return false;
    }

    const expected = createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');

    return (
      expectedBuf.length === actualBuf.length &&
      timingSafeEqual(expectedBuf, actualBuf)
    );
  }
}
