import { parseWebhook, previewOf } from './webhook-parse';

const PAGE = '1111';
const PSID = '2222';
const IG = '17841400000000000';
const IGSID = '9999';

describe('parseWebhook — Messenger', () => {
  it('reads a customer text message', () => {
    const out = parseWebhook('page', {
      object: 'page',
      entry: [{ id: PAGE, time: 1, messaging: [{ sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1792000000000, message: { mid: 'm_1', text: 'How much is braids?' } }] }],
    });
    expect(out).toEqual([{
      channel: 'messenger', businessId: PAGE, customerId: PSID, mid: 'm_1', text: 'How much is braids?', attachments: [],
      sentAt: new Date(1792000000000), fromBusiness: false, referral: null,
    }]);
  });

  it('flips sender and recipient for echoes of the business’s own messages', () => {
    const [m] = parseWebhook('page', {
      entry: [{ messaging: [{ sender: { id: PAGE }, recipient: { id: PSID }, timestamp: 1792000000000, message: { mid: 'm_2', text: 'Hi!', is_echo: true, app_id: 1 } }] }],
    });
    expect(m).toMatchObject({ businessId: PAGE, customerId: PSID, fromBusiness: true });
  });

  it('treats a button tap (postback) as the button title', () => {
    const [m] = parseWebhook('page', {
      entry: [{ messaging: [{ sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1792000000000, postback: { mid: 'm_3', title: 'See prices', payload: 'PRICES' } }] }],
    });
    expect(m).toMatchObject({ mid: 'm_3', text: 'See prices', fromBusiness: false });
  });

  it('keeps the click-to-chat ad referral', () => {
    const [m] = parseWebhook('page', {
      entry: [{ messaging: [{
        sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1792000000000,
        message: { mid: 'm_4', text: 'Is this still available?' },
        referral: { ad_id: '6045', source: 'ADS', type: 'OPEN_THREAD', ads_context_data: { ad_title: 'Knotless braids promo' } },
      }] }],
    });
    expect(m.referral).toEqual({ adId: '6045', adTitle: 'Knotless braids promo', source: 'ADS' });
  });

  it('ignores m.me link referrals that are not ads', () => {
    const [m] = parseWebhook('page', {
      entry: [{ messaging: [{ sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1, message: { mid: 'm_5', text: 'hi' }, referral: { ref: 'flyer', source: 'SHORTLINK' } }] }],
    });
    expect(m.referral).toBeNull();
  });

  it('skips reads, deliveries, reactions and deleted messages', () => {
    const out = parseWebhook('page', {
      entry: [{ messaging: [
        { sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1, read: { watermark: 1 } },
        { sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1, delivery: { mids: ['x'] } },
        { sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1, reaction: { mid: 'x', action: 'react', emoji: '❤️' } },
        { sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1, message: { mid: 'm_6', is_deleted: true } },
      ] }],
    });
    expect(out).toEqual([]);
  });

  it('keeps photo-only messages with their attachment url', () => {
    const [m] = parseWebhook('page', {
      entry: [{ messaging: [{ sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1, message: { mid: 'm_7', attachments: [{ type: 'image', payload: { url: 'https://cdn/x.jpg' } }] } }] }],
    });
    expect(m.attachments).toEqual([{ type: 'image', url: 'https://cdn/x.jpg' }]);
    expect(previewOf(m)).toBe('📷 Photo');
  });

  it('returns messages oldest first across entries, and handles second-based timestamps', () => {
    const out = parseWebhook('page', {
      entry: [
        { messaging: [{ sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1792000005000, message: { mid: 'b', text: 'second' } }] },
        { messaging: [{ sender: { id: PSID }, recipient: { id: PAGE }, timestamp: 1792000000, message: { mid: 'a', text: 'first' } }] },
      ],
    });
    expect(out.map((m) => m.mid)).toEqual(['a', 'b']);
    expect(out[0].sentAt.getTime()).toBe(1792000000000);
  });
});

describe('parseWebhook — Instagram', () => {
  it('reads messaging events', () => {
    const [m] = parseWebhook('instagram', {
      object: 'instagram',
      entry: [{ id: IG, messaging: [{ sender: { id: IGSID }, recipient: { id: IG }, timestamp: 1792000000000, message: { mid: 'ig_1', text: 'Price for lashes?' } }] }],
    });
    expect(m).toMatchObject({ channel: 'instagram', businessId: IG, customerId: IGSID, text: 'Price for lashes?' });
  });

  it('reads the "changes" shape and the referral inside the message', () => {
    const [m] = parseWebhook('instagram', {
      entry: [{ id: IG, changes: [{ field: 'messages', value: {
        sender: { id: IGSID }, recipient: { id: IG }, timestamp: '1792000000000',
        message: { mid: 'ig_2', text: 'Hello', referral: { ad_id: '77', source: 'ADS', ads_context_data: { ad_title: 'Lash sale' } } },
      } }] }],
    });
    expect(m).toMatchObject({ mid: 'ig_2', referral: { adId: '77', adTitle: 'Lash sale', source: 'ADS' } });
  });

  it('ignores unrelated change fields', () => {
    expect(parseWebhook('instagram', { entry: [{ changes: [{ field: 'comments', value: { text: 'nice' } }] }] })).toEqual([]);
  });
});

describe('parseWebhook — other objects and junk', () => {
  it('gives nothing for WhatsApp (until D4) and unknown objects', () => {
    expect(parseWebhook('whatsapp_business_account', { entry: [{ changes: [{ field: 'messages', value: {} }] }] })).toEqual([]);
    expect(parseWebhook('user', {})).toEqual([]);
  });

  it('survives malformed bodies', () => {
    expect(parseWebhook('page', null)).toEqual([]);
    expect(parseWebhook('page', { entry: 'nope' })).toEqual([]);
    expect(parseWebhook('page', { entry: [{ messaging: [null, 1, { sender: {} }] }] })).toEqual([]);
  });
});
