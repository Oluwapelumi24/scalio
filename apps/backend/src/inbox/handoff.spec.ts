import { amountsInKobo, decideReply, detectHandoff } from './handoff';

describe('detectHandoff', () => {
  it.each([
    ['I want a refund', 'refund'],
    ['Abeg return my money', 'refund'],
    ['Please send me my money back', 'refund'],
    ['I want to complain about my hair', 'complaint'],
    ['Very disappointed with the service', 'complaint'],
    ['Your stylist was rude', 'complaint'],
    ['The relaxer burnt my scalp', 'complaint'],
    ['I had an allergic reaction to the glue', 'complaint'],
    ['I am not happy with my nails', 'complaint'],
    ['This is a scam', 'complaint'],
    ['Can I speak to the owner?', 'human_requested'],
    ['I want to talk to a real person', 'human_requested'],
    ['Are you a bot?', 'human_requested'],
  ])('“%s” → %s', (text, reason) => {
    expect(detectHandoff(text)).toBe(reason);
  });

  it.each([
    'How much is knotless braids?',
    'What time do you open on Saturday?',
    'I am so happy with my lashes, thank you!',
    'Can I book for tomorrow?',
    'Where are you located?',
  ])('lets ordinary questions through: “%s”', (text) => {
    expect(detectHandoff(text)).toBeNull();
  });

  it('checks refunds before complaints', () => {
    expect(detectHandoff('Terrible job, I want a refund')).toBe('refund');
  });
});

describe('amountsInKobo', () => {
  it('reads the ways people write naira', () => {
    expect(amountsInKobo('₦15,000')).toEqual([1_500_000]);
    expect(amountsInKobo('N15000')).toEqual([1_500_000]);
    expect(amountsInKobo('NGN 2,500.50')).toEqual([250_050]);
    expect(amountsInKobo('₦15k')).toEqual([1_500_000]);
    expect(amountsInKobo('it is 20,000 naira')).toEqual([2_000_000]);
    expect(amountsInKobo('about 8k naira')).toEqual([800_000]);
  });

  it('ignores numbers that are not money', () => {
    expect(amountsInKobo('We open at 9 and close at 6. Takes 90 minutes. Call 08012345678')).toEqual([]);
  });
});

describe('decideReply', () => {
  const facts = { allowedAmountsKobo: [1_500_000, 800_000] };

  it('sends a grounded reply', () => {
    expect(decideReply({ handoff: false, handoffReason: null, reply: ' Knotless braids are ₦15,000 😊 ' }, facts))
      .toEqual({ action: 'send', text: 'Knotless braids are ₦15,000 😊' });
  });

  it('hands off when the model does', () => {
    expect(decideReply({ handoff: true, handoffReason: 'complaint', reply: '' }, facts)).toEqual({ action: 'handoff', reason: 'complaint' });
    expect(decideReply({ handoff: true, handoffReason: null, reply: '' }, facts)).toEqual({ action: 'handoff', reason: 'unknown' });
  });

  it('hands off on an empty reply', () => {
    expect(decideReply({ handoff: false, handoffReason: null, reply: '  ' }, facts)).toEqual({ action: 'handoff', reason: 'unknown' });
  });

  it('hands off when the reply quotes a price the business never set', () => {
    expect(decideReply({ handoff: false, handoffReason: null, reply: 'Braids are ₦12,000 today only!' }, facts))
      .toEqual({ action: 'handoff', reason: 'unknown' });
    expect(decideReply({ handoff: false, handoffReason: null, reply: 'Lashes are 8k naira, braids ₦15,000' }, facts).action).toBe('send');
  });
});
