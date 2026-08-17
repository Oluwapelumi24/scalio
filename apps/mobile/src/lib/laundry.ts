export const SELF_SERVICE_PRICE_KOBO = 250_000; // ₦2,500 flat, self-service wash
export const DROPOFF_PRICE_KOBO = 350_000;      // ₦3,500 flat, drop-off & collect
export const DUVET_PRICE_KOBO = 300_000;        // ₦3,000 per duvet, either service type

export type ServiceType = 'self_service' | 'drop_off';

export const SELF_SERVICE_SERVICE_NAME = 'Self-service wash';
export const DROPOFF_SERVICE_NAME = 'Drop-off';
export const DUVET_SERVICE_NAME = 'Duvet Laundry';

export function washServiceName(serviceType: ServiceType): string {
  return serviceType === 'drop_off' ? DROPOFF_SERVICE_NAME : SELF_SERVICE_SERVICE_NAME;
}

export function washPriceKobo(serviceType: ServiceType): number {
  return serviceType === 'drop_off' ? DROPOFF_PRICE_KOBO : SELF_SERVICE_PRICE_KOBO;
}

export function calcLaundryOrder(duvets: number, serviceType: ServiceType) {
  const washSubtotalKobo = washPriceKobo(serviceType);
  const duvetSubtotalKobo = duvets * DUVET_PRICE_KOBO;
  return {
    washSubtotalKobo,
    duvetSubtotalKobo,
    totalKobo: washSubtotalKobo + duvetSubtotalKobo,
  };
}

export function laundryDurationMinutes(duvets: number): number {
  return duvets > 0 ? 240 : 120;
}

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}
