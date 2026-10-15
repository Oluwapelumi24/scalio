import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { BookingService } from '../booking/booking.service';
import { PaystackService } from './paystack.service';
import { LedgerService } from '../finance/ledger.service';

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
  };
}

@Controller('payments/paystack')
export class PaystackWebhookController {
  constructor(
    private readonly paystack: PaystackService,
    private readonly bookingService: BookingService,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * PRD §9.3 steps 3-4: Paystack notifies us asynchronously when a charge
   * succeeds or fails — this is what actually drives a booking out of
   * `pending_payment`, independent of whether the customer's app is still open.
   *
   * Verification runs against the *raw* body (see PaystackService.verifyWebhookSignature),
   * which is why `rawBody: true` is set in main.ts and we read `req.rawBody` here
   * instead of the parsed `@Body()`.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    if (
      !req.rawBody ||
      !this.paystack.verifyWebhookSignature(req.rawBody, signature)
    ) {
      throw new UnauthorizedException('Invalid Paystack webhook signature');
    }

    const event = JSON.parse(
      req.rawBody.toString('utf8'),
    ) as PaystackWebhookEvent;

    switch (event.event) {
      case 'charge.success': {
        const booking = await this.bookingService.confirmPaymentByReference(
          event.data.reference,
          event.data.amount,
        );
        // Recorded once per Paystack reference, however often the webhook retries.
        await this.ledger.record({
          vendorId: booking.vendorId,
          kind: 'booking_payment',
          direction: 'in',
          amountKobo: event.data.amount,
          occurredAt: new Date(),
          description: 'Online booking payment · settled to your bank by Paystack',
          dedupeKey: `paystack:${event.data.reference}`,
          bookingId: booking.id,
        });
        break;
      }
      case 'charge.failed':
        await this.bookingService.failPaymentByReference(event.data.reference);
        break;
      default:
      // Other event types (transfers, disputes, subscriptions, ...) don't affect bookings.
    }

    return { received: true };
  }
}
