import { LIMITS, buildAdCopyPrompt, tidyAdCopy } from './ad-copy';
import { guessCity } from './ad-campaigns.service';

const req = {
  businessName: "Amaka's Hair Studio", category: 'Hair salon', description: null, address: '12 Allen Ave, Ikeja, Lagos',
  services: [{ name: 'Knotless braids', priceKobo: 2_500_000 }, { name: 'Silk press', priceKobo: 1_500_000 }],
  objective: 'engagement' as const, destination: 'whatsapp' as const, brief: 'Push weekend braids',
};

describe('ad copy prompt', () => {
  it('gives the facts, the goal and the brief, fenced', () => {
    const p = buildAdCopyPrompt(req);
    expect(p).toContain('- Knotless braids: ₦25,000');
    expect(p).toContain('Get more chats');
    expect(p).toContain('<owner_brief>\nPush weekend braids\n</owner_brief>');
    expect(p).toMatch(/iceBreakers: 3 short questions/);
  });

  it('asks for no chat extras when the ad goes to a website', () => {
    expect(buildAdCopyPrompt({ ...req, objective: 'traffic', destination: 'website', brief: null })).toMatch(/welcomeMessage: empty string/);
  });
});

describe('tidyAdCopy', () => {
  it('trims to Meta’s lengths and keeps at most 3 variants and 3 questions', () => {
    const long = 'x'.repeat(500);
    const out = tidyAdCopy({
      variants: Array.from({ length: 4 }, () => ({ angle: 'Weekend', primaryText: long, headline: long, description: long })),
      welcomeMessage: 'Hi! 👋', iceBreakers: ['Prices?', 'Saturday?', 'Where?', 'Extra?'],
    }, 'whatsapp');
    expect(out.variants).toHaveLength(3);
    expect(out.variants[0].primaryText.length).toBe(LIMITS.primaryText);
    expect(out.variants[0].headline.endsWith('…')).toBe(true);
    expect(out.iceBreakers).toEqual(['Prices?', 'Saturday?', 'Where?']);
  });

  it('drops chat extras for website ads and empty variants', () => {
    const out = tidyAdCopy({ variants: [{ angle: 'a', primaryText: ' ', headline: 'h', description: '' }], welcomeMessage: 'Hi', iceBreakers: ['x'] }, 'website');
    expect(out).toEqual({ variants: [], welcomeMessage: '', iceBreakers: [] });
  });
});

describe('guessCity', () => {
  it('takes the last part of a Nigerian address, defaulting to Lagos', () => {
    expect(guessCity('12 Allen Ave, Ikeja, Lagos')).toBe('Lagos');
    expect(guessCity('Plot 5, Wuse 2, Abuja, Nigeria')).toBe('Abuja');
    expect(guessCity(null)).toBe('Lagos');
  });
});
