import { canSend, replyWindow } from './reply-window';

const H = 3_600_000;
const now = new Date('2026-10-17T12:00:00Z');
const ago = (hours: number) => new Date(now.getTime() - hours * H);

describe('replyWindow', () => {
  it('is open for 24 hours after the customer’s last message, with the closing time', () => {
    expect(replyWindow('instagram', ago(23.9), now)).toEqual({ state: 'open', closesAt: new Date(ago(23.9).getTime() + 24 * H) });
  });

  it('switches to the 7-day human-agent window on Instagram and Messenger', () => {
    expect(replyWindow('messenger', ago(24), now).state).toBe('human_agent');
    expect(replyWindow('instagram', ago(24 * 7 - 1), now).state).toBe('human_agent');
    expect(replyWindow('instagram', ago(24 * 7), now).state).toBe('closed');
  });

  it('needs a template on WhatsApp after 24 hours', () => {
    expect(replyWindow('whatsapp', ago(25), now)).toEqual({ state: 'template', closesAt: null });
  });

  it('has no window until the customer writes', () => {
    expect(replyWindow('instagram', null, now).state).toBe('none');
  });
});

describe('canSend', () => {
  it('lets the AI reply only inside the 24 hours', () => {
    expect(canSend('instagram', 'ai', ago(1), now)).toEqual({ ok: true, humanAgentTag: false });
    expect(canSend('instagram', 'ai', ago(24.01), now).ok).toBe(false);
    expect(canSend('messenger', 'ai', ago(48), now).ok).toBe(false);
    expect(canSend('whatsapp', 'ai', ago(30), now).ok).toBe(false);
    expect(canSend('instagram', 'ai', null, now).ok).toBe(false);
  });

  it('lets a person reply for 7 days on Instagram/Messenger, tagged HUMAN_AGENT after 24 hours', () => {
    expect(canSend('messenger', 'vendor', ago(2), now)).toEqual({ ok: true, humanAgentTag: false });
    expect(canSend('messenger', 'vendor', ago(30), now)).toEqual({ ok: true, humanAgentTag: true });
    expect(canSend('instagram', 'vendor', ago(24 * 8), now).ok).toBe(false);
  });

  it('blocks free-form WhatsApp replies after 24 hours, even from a person', () => {
    const d = canSend('whatsapp', 'vendor', ago(25), now);
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toMatch(/template/);
  });

  it('never lets the business message first', () => {
    expect(canSend('messenger', 'vendor', null, now).ok).toBe(false);
  });
});
