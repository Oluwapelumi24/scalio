import { UnauthorizedException } from '@nestjs/common';
import { PaystackWebhookController } from './paystack-webhook.controller';

function makePaystack(verified = true) {
  return { verifyWebhookSignature: jest.fn().mockReturnValue(verified) };
}

function makeBookingService() {
  return {
    confirmPaymentByReference: jest.fn().mockResolvedValue({ id: 'booking-1', vendorId: 'vendor-1' }),
    failPaymentByReference: jest.fn().mockResolvedValue(undefined),
  };
}

function makeRequest(payload: unknown): { rawBody: Buffer } {
  return { rawBody: Buffer.from(JSON.stringify(payload)) };
}

const ledger = { record: jest.fn().mockResolvedValue(true) };
const adCampaigns = { markPaid: jest.fn().mockResolvedValue(undefined), markFailed: jest.fn().mockResolvedValue(undefined) };

describe('PaystackWebhookController', () => {
  beforeEach(() => {
    ledger.record.mockClear();
    adCampaigns.markPaid.mockClear();
  });

  it('sends ad payments to the Ads Manager, not bookings', async () => {
    const bookingService = makeBookingService();
    const controller = new PaystackWebhookController(makePaystack(true) as any, bookingService as any, ledger as any, adCampaigns as any);
    await controller.handleWebhook(makeRequest({ event: 'charge.success', data: { reference: 'ads_123', amount: 4_112_500 } }) as any, 'sig');
    expect(adCampaigns.markPaid).toHaveBeenCalledWith('ads_123', 4_112_500);
    expect(bookingService.confirmPaymentByReference).not.toHaveBeenCalled();
    expect(ledger.record).not.toHaveBeenCalled();
  });

  it('rejects requests with a missing or invalid signature', async () => {
    const paystack = makePaystack(false);
    const bookingService = makeBookingService();
    const controller = new PaystackWebhookController(
      paystack as any,
      bookingService as any,
      ledger as any,
      adCampaigns as any,
    );

    await expect(
      controller.handleWebhook(
        makeRequest({
          event: 'charge.success',
          data: { reference: 'ref-1', amount: 5000 },
        }) as any,
        'sig',
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(bookingService.confirmPaymentByReference).not.toHaveBeenCalled();
  });

  it('confirms the booking on charge.success', async () => {
    const paystack = makePaystack(true);
    const bookingService = makeBookingService();
    const controller = new PaystackWebhookController(
      paystack as any,
      bookingService as any,
      ledger as any,
      adCampaigns as any,
    );

    const result = await controller.handleWebhook(
      makeRequest({
        event: 'charge.success',
        data: { reference: 'ref-1', amount: 5000 },
      }) as any,
      'valid-sig',
    );

    expect(bookingService.confirmPaymentByReference).toHaveBeenCalledWith(
      'ref-1',
      5000,
    );
    expect(result).toEqual({ received: true });
  });

  it('fails the booking on charge.failed', async () => {
    const paystack = makePaystack(true);
    const bookingService = makeBookingService();
    const controller = new PaystackWebhookController(
      paystack as any,
      bookingService as any,
      ledger as any,
      adCampaigns as any,
    );

    await controller.handleWebhook(
      makeRequest({
        event: 'charge.failed',
        data: { reference: 'ref-1', amount: 5000 },
      }) as any,
      'valid-sig',
    );

    expect(bookingService.failPaymentByReference).toHaveBeenCalledWith('ref-1');
  });

  it('acknowledges, but takes no booking action, for events that do not affect bookings', async () => {
    const paystack = makePaystack(true);
    const bookingService = makeBookingService();
    const controller = new PaystackWebhookController(
      paystack as any,
      bookingService as any,
      ledger as any,
      adCampaigns as any,
    );

    const result = await controller.handleWebhook(
      makeRequest({
        event: 'transfer.success',
        data: { reference: 'ref-1', amount: 5000 },
      }) as any,
      'valid-sig',
    );

    expect(bookingService.confirmPaymentByReference).not.toHaveBeenCalled();
    expect(bookingService.failPaymentByReference).not.toHaveBeenCalled();
    expect(result).toEqual({ received: true });
  });
});

describe('PaystackWebhookController ledger', () => {
  it('records each successful payment in the vendor ledger, keyed by the Paystack reference', async () => {
    const controller = new PaystackWebhookController(makePaystack(true) as any, makeBookingService() as any, ledger as any, adCampaigns as any);
    await controller.handleWebhook(makeRequest({ event: 'charge.success', data: { reference: 'ref-9', amount: 250000 } }) as any, 'sig');
    expect(ledger.record).toHaveBeenCalledWith(expect.objectContaining({
      vendorId: 'vendor-1', kind: 'booking_payment', direction: 'in', amountKobo: 250000, dedupeKey: 'paystack:ref-9', bookingId: 'booking-1',
    }));
  });
});
