export const ITEMS_PER_BASKET = 20;
export const BASKET_PRICE_KOBO = 250_000;  // ₦2,500
export const DUVET_PRICE_KOBO = 400_000;   // ₦4,000

export const CLOTHING_SERVICE_NAME = 'Clothing Laundry';
export const DUVET_SERVICE_NAME = 'Duvet Laundry';

export function clothingToBaskets(items: number): number {
  return Math.max(1, Math.ceil(items / ITEMS_PER_BASKET));
}

export function calcLaundryOrder(clothingItems: number, duvets: number) {
  const baskets = clothingItems > 0 ? clothingToBaskets(clothingItems) : 0;
  const clothingSubtotalKobo = baskets * BASKET_PRICE_KOBO;
  const duvetSubtotalKobo = duvets * DUVET_PRICE_KOBO;
  return {
    baskets,
    clothingSubtotalKobo,
    duvetSubtotalKobo,
    totalKobo: clothingSubtotalKobo + duvetSubtotalKobo,
  };
}

export function laundryDurationMinutes(clothingItems: number, duvets: number): number {
  if (clothingItems > 0 && duvets > 0) return 240;
  if (duvets > 0) return 240;
  return 120;
}

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}
