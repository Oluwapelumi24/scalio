import { UnauthorizedException } from '@nestjs/common';
import { PaystackWebhookController } from './paystack-webhook.controller';

function makePaystack(verified = true) {
  return { verifyWebhookSignature: jest.fn().mockReturnValue(verified) };
}

function makeBookingService() {
  return {
    confirmPaymentByReference: jest.fn().mockResolvedValue(undefined),
    failPaymentByReference: jest.fn().mockResolvedValue(undefined),
  };
}

function makeRequest(payload: unknown): { rawBody: Buffer } {
  return { rawBody: Buffer.from(JSON.stringify(payload)) };
}

describe('PaystackWebhookController', () => {
  it('rejects requests with a missing or invalid signature', async () => {
    const paystack = makePaystack(false);
    const bookingService = makeBookingService();
    const controller = new PaystackWebhookController(
      paystack as any,
      bookingService as any,
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
