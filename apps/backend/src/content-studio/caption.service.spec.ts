import Anthropic from '@anthropic-ai/sdk';
import { HttpException } from '@nestjs/common';
import { buildCaptionPrompt, type CaptionContext } from './caption-writer';
import { CAPTION_MODEL, CaptionService } from './caption.service';

const ctx: CaptionContext = {
  businessName: 'Glow Studio',
  category: 'Nails',
  description: 'Gel and acrylic nails in Lekki',
  address: 'Lekki Phase 1, Lagos',
  services: [{ name: 'Gel manicure', priceKobo: 1_500_000 }],
  bookingLink: 'http://localhost:3003/book/glow-studio',
  brief: 'New autumn colours are in',
  tone: 'friendly',
  platforms: ['instagram', 'whatsapp'],
  hasImage: false,
};

function makeRedis(start = 0) {
  let n = start;
  return {
    incr: jest.fn(() => Promise.resolve(++n)),
    decr: jest.fn(() => Promise.resolve(--n)),
    expire: jest.fn(() => Promise.resolve(1)),
    get: jest.fn(() => Promise.resolve(String(n))),
  };
}

const config = (limit?: number) => ({ get: jest.fn(() => limit) });

interface ParseRequest {
  model: string;
  fallbacks: unknown;
  messages: { content: ({ type: string; text?: string } & Record<string, unknown>)[] }[];
}

function makeClient(result: unknown) {
  const parse = jest.fn<Promise<unknown>, [ParseRequest]>(() =>
    typeof result === 'function' ? (result as () => Promise<unknown>)() : Promise.resolve(result),
  );
  return { beta: { messages: { parse } } };
}

const ok = {
  stop_reason: 'end_turn',
  parsed_output: { caption: ' Autumn shades just landed 🍂 ', hashtags: ['#LekkiNails', 'lekkinails', 'gel nails'], callToAction: ' Book your set today ' },
};

describe('buildCaptionPrompt', () => {
  it('includes the business facts, prices in naira, platforms and the brief', () => {
    const text = buildCaptionPrompt(ctx);
    expect(text).toContain('Business: Glow Studio (Nails)');
    expect(text).toContain('- Gel manicure: ₦15,000');
    expect(text).toContain('Posting to: Instagram, WhatsApp Status');
    expect(text).toContain('There is no photo');
    expect(text.trim().endsWith('New autumn colours are in')).toBe(true);
  });

  it('writes from the photo alone when the owner adds no notes', () => {
    const text = buildCaptionPrompt({ ...ctx, brief: '', hasImage: true });
    expect(text).toContain('The owner added no notes: write the post from what the photo shows.');
    expect(text).not.toContain('What the owner says');
  });
});

describe('CaptionService', () => {
  it('is switched off without an API key', async () => {
    const svc = new CaptionService(null, makeRedis() as any, config() as any);
    expect(svc.available).toBe(false);
    await expect(svc.write('v1', ctx, null)).rejects.toThrow("AI captions aren't switched on yet");
  });

  it('calls Claude with the photo first and returns a cleaned draft', async () => {
    const client = makeClient(ok);
    const svc = new CaptionService(client as any, makeRedis() as any, config() as any);
    const draft = await svc.write('v1', ctx, { mimeType: 'image/jpeg', dataBase64: 'AAAA' });

    expect(draft).toEqual({ caption: 'Autumn shades just landed 🍂', hashtags: ['LekkiNails', 'gelnails'], callToAction: 'Book your set today' });
    const [req] = client.beta.messages.parse.mock.calls[0];
    expect(req.model).toBe(CAPTION_MODEL);
    expect(req.fallbacks).toBe('default');
    expect(req.messages[0].content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } });
    expect(req.messages[0].content[1].text).toContain('The photo attached is the one that will be posted.');
  });

  it('stops at the daily limit without calling Claude', async () => {
    const client = makeClient(ok);
    const svc = new CaptionService(client as any, makeRedis(3) as any, config(3) as any);
    await expect(svc.write('v1', ctx, null)).rejects.toBeInstanceOf(HttpException);
    expect(client.beta.messages.parse).not.toHaveBeenCalled();
  });

  it('gives the allowance back when Claude is unavailable', async () => {
    const redis = makeRedis();
    const client = makeClient(() => Promise.reject(new Anthropic.APIConnectionError({ message: 'down' })));
    const svc = new CaptionService(client as any, redis as any, config() as any);
    await expect(svc.write('v1', ctx, null)).rejects.toThrow('The caption writer is busy');
    expect(redis.decr).toHaveBeenCalled();
  });

  it('explains a refusal instead of returning an empty caption', async () => {
    const svc = new CaptionService(makeClient({ stop_reason: 'refusal', parsed_output: null }) as any, makeRedis() as any, config() as any);
    await expect(svc.write('v1', ctx, null)).rejects.toThrow("We couldn't write a caption for this");
  });
});
