import { createHmac } from 'node:crypto';
import { toAdAccount, verifyWebhookSignature } from '../social/meta-graph';
import { adAccountProblem, buildSetup, metaBillingUrl, type SetupInput } from './ads-setup';

const now = new Date('2026-10-17T12:00:00Z');
const ALL = ['ads_management', 'ads_read', 'pages_manage_ads'];
const page = { status: 'active' as const, displayName: "Amaka's Hair Studio" };
const account: NonNullable<SetupInput['adAccount']> = {
  id: 'act_123', name: 'Amaka Ads', currency: 'NGN', metaStatus: 1, status: 'active', ownedBy: 'vendor', hasPaymentMethod: false, paymentMethodLabel: null,
};
const base: SetupInput = { now, facebook: null, instagram: null, access: null, adAccount: null };
const step = (i: SetupInput, key: string) => buildSetup(i).steps.find((s) => s.key === key);

describe('ads setup checklist', () => {
  it('starts with connecting the Facebook Page; later steps wait', () => {
    const s = buildSetup(base);
    expect(s.ready).toBe(false);
    expect(s.steps[0]).toMatchObject({ key: 'facebook', state: 'todo', action: { kind: 'connect' } });
    expect(step(base, 'ad_access')?.state).toBe('waiting');
    expect(step(base, 'ad_account')?.state).toBe('waiting');
    expect(step(base, 'payment_method')).toBeUndefined();
    expect(step(base, 'whatsapp')?.state).toBe('coming_soon');
  });

  it('asks Page-only vendors (connected before ads existed) to reconnect for ad access', () => {
    expect(step({ ...base, facebook: page }, 'ad_access')).toMatchObject({ state: 'todo', action: { kind: 'connect' } });
  });

  it('is ready with a Page and ad permissions — an ad account is optional (pay with Scalio)', () => {
    const i = { ...base, facebook: page, access: { grantedScopes: ALL, expiresAt: null } };
    expect(buildSetup(i).ready).toBe(true);
    expect(step(i, 'ad_account')).toMatchObject({ state: 'todo', optional: true, action: { kind: 'choose_ad_account' } });
  });

  it('flags unticked permissions and expired logins', () => {
    expect(step({ ...base, facebook: page, access: { grantedScopes: ['ads_read'], expiresAt: null } }, 'ad_access')?.state).toBe('attention');
    const expired = { ...base, facebook: page, access: { grantedScopes: ALL, expiresAt: new Date('2026-10-01') } };
    expect(step(expired, 'ad_access')?.detail).toMatch(/expired/);
    expect(buildSetup(expired).ready).toBe(false);
  });

  it('links straight to Meta payment settings when the own ad account has no card', () => {
    const i = { ...base, facebook: page, access: { grantedScopes: ALL, expiresAt: null }, adAccount: account };
    expect(step(i, 'payment_method')).toMatchObject({
      state: 'todo', action: { kind: 'open_url', url: 'https://business.facebook.com/billing_hub/payment_settings/?asset_id=123' },
    });
    const withCard = { ...i, adAccount: { ...account, hasPaymentMethod: true, paymentMethodLabel: 'Visa *4242' } };
    expect(step(withCard, 'payment_method')?.state).toBe('done');
    expect(step(withCard, 'payment_method')?.detail).toContain('Visa *4242');
  });

  it('explains a disabled ad account and hides the card step', () => {
    const i = { ...base, facebook: page, access: { grantedScopes: ALL, expiresAt: null }, adAccount: { ...account, metaStatus: 2 } };
    expect(step(i, 'ad_account')?.state).toBe('attention');
    expect(step(i, 'ad_account')?.detail).toContain('disabled');
    expect(step(i, 'payment_method')).toBeUndefined();
  });

  it('hides the card step while ad access needs fixing', () => {
    const i = { ...base, facebook: page, access: { grantedScopes: ALL, expiresAt: new Date('2026-10-01') }, adAccount: account };
    expect(step(i, 'ad_account')?.state).toBe('waiting');
    expect(step(i, 'payment_method')).toBeUndefined();
  });

  it('never asks Scalio-owned ad accounts for a card', () => {
    const i = { ...base, facebook: page, access: { grantedScopes: ALL, expiresAt: null }, adAccount: { ...account, ownedBy: 'scalio' as const } };
    expect(step(i, 'payment_method')).toBeUndefined();
  });

  it('maps account statuses to plain reasons', () => {
    expect(adAccountProblem(1)).toBeNull();
    expect(adAccountProblem(3)).toMatch(/unpaid/);
    expect(adAccountProblem(999)).toBeTruthy();
    expect(metaBillingUrl('act_42')).toContain('asset_id=42');
  });
});

describe('toAdAccount', () => {
  it('reads the payment method from funding_source_details', () => {
    expect(toAdAccount({ id: 'act_1', name: 'A', account_status: 1, currency: 'NGN', funding_source_details: { id: '9', display_string: 'Visa *1111' } }))
      .toMatchObject({ hasPaymentMethod: true, paymentMethodLabel: 'Visa *1111', timezone: null, businessName: null });
    expect(toAdAccount({ id: 'act_2', account_status: 1, currency: 'USD' })).toMatchObject({ name: 'act_2', hasPaymentMethod: false });
  });
});

describe('verifyWebhookSignature', () => {
  const secret = 'app-secret';
  const body = Buffer.from('{"object":"page","entry":[]}');
  const sig = (b: Buffer, k = secret) => `sha256=${createHmac('sha256', k).update(b).digest('hex')}`;

  it('accepts Meta’s signature over the exact bytes', () => {
    expect(verifyWebhookSignature(body, sig(body), secret)).toBe(true);
  });

  it('rejects a wrong secret, a changed body, or a missing/malformed header', () => {
    expect(verifyWebhookSignature(body, sig(body, 'other'), secret)).toBe(false);
    expect(verifyWebhookSignature(Buffer.from('{"object":"page"}'), sig(body), secret)).toBe(false);
    expect(verifyWebhookSignature(body, undefined, secret)).toBe(false);
    expect(verifyWebhookSignature(body, 'sha1=abc', secret)).toBe(false);
  });
});
