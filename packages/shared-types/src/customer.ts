export interface Customer {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  email: string | null;
  visitCount: number;
  lifetimeValueKobo: number;
  lastVisitAt: string | null;
  noShowCount: number;
}
