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
  /**
   * The vendor's Paystack subaccount. Paystack settles the payment straight to
   * the vendor's bank account (less any platform commission on the subaccount),
   * so Scalio never holds customer money.
   */
  subaccountCode?: string;
}

export interface PaystackBank {
  name: string;
  code: string;
}

export interface SubaccountInput {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  /** Scalio's commission on each payment, in percent. 0 = the vendor gets it all. */
  percentageCharge: number;
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
          ...(input.subaccountCode
            ? { subaccount: input.subaccountCode, bearer: 'subaccount' }
            : {}),
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

  /** Calls the Paystack API and unwraps `data`, turning failures into a readable error. */
  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string>),
      },
    });
    const body = (await response.json()) as { status: boolean; message: string; data?: T };
    if (!response.ok || !body.status || body.data === undefined) {
      throw new InternalServerErrorException(`Paystack: ${body.message ?? response.statusText}`);
    }
    return body.data;
  }

  /** Nigerian banks Paystack can settle to, for the bank picker. */
  async listBanks(): Promise<PaystackBank[]> {
    const banks = await this.call<{ name: string; code: string; active: boolean }[]>('/bank?country=nigeria&perPage=100');
    return banks.filter((b) => b.active !== false).map((b) => ({ name: b.name, code: b.code }));
  }

  /** The account holder's name for a bank account, so owners can confirm it before saving. */
  async resolveAccountName(accountNumber: string, bankCode: string): Promise<string> {
    const data = await this.call<{ account_name: string }>(
      `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    );
    return data.account_name;
  }

  async createSubaccount(input: SubaccountInput): Promise<string> {
    const data = await this.call<{ subaccount_code: string }>('/subaccount', {
      method: 'POST',
      body: JSON.stringify({
        business_name: input.businessName,
        settlement_bank: input.bankCode,
        account_number: input.accountNumber,
        percentage_charge: input.percentageCharge,
      }),
    });
    return data.subaccount_code;
  }

  async updateSubaccount(code: string, input: SubaccountInput): Promise<void> {
    await this.call(`/subaccount/${encodeURIComponent(code)}`, {
      method: 'PUT',
      body: JSON.stringify({
        business_name: input.businessName,
        settlement_bank: input.bankCode,
        account_number: input.accountNumber,
        percentage_charge: input.percentageCharge,
      }),
    });
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
