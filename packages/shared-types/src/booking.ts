export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_vendor'
  | 'no_show';

export type PaymentMode = 'pay_on_arrival' | 'deposit' | 'full_prepayment';

export interface BookingSlot {
  vendorId: string;
  staffId: string | 'any';
  scheduledAt: string; // ISO 8601, minute precision
  durationMinutes: number;
}

export interface Booking {
  id: string;
  vendorId: string;
  customerId: string;
  staffId: string | null;
  serviceIds: string[];
  status: BookingStatus;
  scheduledAt: string;
  durationMinutes: number;
  paymentMode: PaymentMode;
  amountDueKobo: number;
  amountPaidKobo: number;
  createdAt: string;
  updatedAt: string;
}

export interface SlotLockResult {
  acquired: boolean;
  lockKey: string;
  expiresAt: string;
}
