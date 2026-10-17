import { allowedAmounts, buildBusinessContext, buildReplyPrompt, type BusinessContext } from './reply-writer';

const ctx: BusinessContext = {
  businessName: 'Glow Studio', category: 'Salon', description: null, address: '12 Allen Ave, Ikeja',
  services: [
    { name: 'Wash and set', priceKobo: 500_000, durationMinutes: 60 },
    { name: 'Knotless braids', priceKobo: 1_500_000, durationMinutes: 240 },
  ],
  hours: [{ dayOfWeek: 6, opensAtMinutes: 9 * 60, closesAtMinutes: 18 * 60 + 30 }],
  bookingLink: 'https://scalio.ng/book/glow',
  faq: [
    { question: 'Do you do home service?', answer: 'Yes, for ₦5,000 extra within Ikeja.' },
    { question: 'Cancellation policy?', answer: '[Your cancellation policy]' },
  ],
};

describe('buildBusinessContext', () => {
  it('lists services sorted, prices in naira and hours by day', () => {
    const text = buildBusinessContext(ctx);
    expect(text.indexOf('Knotless braids: ₦15,000')).toBeLessThan(text.indexOf('Wash and set: ₦5,000'));
    expect(text).toContain('Saturday: 9am–6:30pm');
    expect(text).toContain('Monday: closed');
    expect(text).toContain('Booking link: https://scalio.ng/book/glow');
  });

  it('leaves out FAQ answers that are still placeholders', () => {
    const text = buildBusinessContext(ctx);
    expect(text).toContain('Do you do home service?');
    expect(text).not.toContain('Cancellation policy?');
  });

  it('is byte-identical for the same data, whatever the input order (so the prompt prefix caches)', () => {
    const shuffled = { ...ctx, services: [...ctx.services].reverse() };
    expect(buildBusinessContext(shuffled)).toBe(buildBusinessContext(ctx));
  });
});

describe('allowedAmounts', () => {
  it('includes service prices and amounts the vendor wrote in the FAQ', () => {
    expect(allowedAmounts(ctx).sort()).toEqual([1_500_000, 500_000, 500_000].sort());
  });
});

describe('buildReplyPrompt', () => {
  it('wraps the chat in a transcript with the ad it came from', () => {
    const p = buildReplyPrompt('instagram', 'Ada', [{ from: 'customer', text: 'hi' }, { from: 'business', text: 'Hello Ada!' }], 'Braids promo');
    expect(p).toContain('Channel: Instagram');
    expect(p).toContain('from the ad "Braids promo"');
    expect(p).toContain('<transcript>\nCustomer: hi\nBusiness: Hello Ada!\n</transcript>');
  });
});
