export interface Vendor {
  id: string;
  slug: string;
  businessName: string;
  category: string;
  logoUrl: string | null;
  themeColor: string | null;
  averageDaysBetweenVisits: number | null;
}

export interface Service {
  id: string;
  vendorId: string;
  name: string;
  durationMinutes: number;
  priceKobo: number;
  paymentMode: 'pay_on_arrival' | 'deposit' | 'full_prepayment';
  depositPercent: number | null;
}

export interface Staff {
  id: string;
  vendorId: string;
  name: string;
  role: 'owner' | 'manager' | 'practitioner' | 'front_desk';
}
