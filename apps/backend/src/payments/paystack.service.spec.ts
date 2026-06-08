import { InternalServerErrorException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { PaystackService } from './paystack.service';

const SECRET = 'sk_test_secret';

function makeConfig(overrides: Record<string, string | undefined> = {}) {
  const values: Record<string, string | undefined> = {
    PAYSTACK_SECRET_KEY: SECRET,
    ...overrides,
  };
  return { get: jest.fn((key: string) => values[key]) };
}

describe('PaystackService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('initializeTransaction', () => {
    it('posts kobo amounts straight through (no conversion) and returns the checkout details', async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        statusText: 'OK',
        json: () =>
          Promise.resolve({
            status: true,
            message: 'Authorization URL created',
            data: {
              authorization_url: 'https://checkout.paystack.com/abc123',
              access_code: 'access-code-1',
              reference: 'ref-1',
            },
          }),
      });
      global.fetch = fetchMock;

      const service = new PaystackService(makeConfig() as any);
      const result = await service.initializeTransaction({
        email: 'jane@example.com',
        amountKobo: 5000,
        reference: 'ref-1',
      });

      expect(result).toEqual({
        authorizationUrl: 'https://checkout.paystack.com/abc123',
        accessCode: 'access-code-1',
        reference: 'ref-1',
      });
      const [url, init] = fetchMock.mock.calls[0] as [
        string,
        { headers: Record<string, string>; body: string },
      ];
      expect(url).toBe('https://api.paystack.co/transaction/initialize');
      expect(init.headers.Authorization).toBe(`Bearer ${SECRET}`);
      expect(JSON.parse(init.body) as unknown).toMatchObject({
        email: 'jane@example.com',
        amount: 5000,
        reference: 'ref-1',
      });
    });

    it('throws when Paystack reports failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        statusText: 'OK',
        json: () =>
          Promise.resolve({ status: false, message: 'Invalid email' }),
      });

      const service = new PaystackService(makeConfig() as any);

      await expect(
        service.initializeTransaction({
          email: 'bad',
          amountKobo: 5000,
          reference: 'ref-1',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('throws when PAYSTACK_SECRET_KEY is not configured', async () => {
      const service = new PaystackService(
        makeConfig({ PAYSTACK_SECRET_KEY: undefined }) as any,
      );

      await expect(
        service.initializeTransaction({
          email: 'jane@example.com',
          amountKobo: 5000,
          reference: 'ref-1',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('accepts a signature that matches the HMAC-SHA512 of the raw body', () => {
      const service = new PaystackService(makeConfig() as any);
      const rawBody = Buffer.from(
        JSON.stringify({
          event: 'charge.success',
          data: { reference: 'ref-1' },
        }),
      );
      const signature = createHmac('sha512', SECRET)
        .update(rawBody)
        .digest('hex');

      expect(service.verifyWebhookSignature(rawBody, signature)).toBe(true);
    });

    it('rejects a signature that does not match', () => {
      const service = new PaystackService(makeConfig() as any);
      const rawBody = Buffer.from(
        JSON.stringify({
          event: 'charge.success',
          data: { reference: 'ref-1' },
        }),
      );

      expect(service.verifyWebhookSignature(rawBody, 'deadbeef')).toBe(false);
    });

    it('rejects when no signature header is present', () => {
      const service = new PaystackService(makeConfig() as any);
      const rawBody = Buffer.from(JSON.stringify({ event: 'charge.success' }));

      expect(service.verifyWebhookSignature(rawBody, undefined)).toBe(false);
    });
  });
});
