// The Ads Manager "Connect your accounts" checklist (ADS_MANAGER_PLAN.md §2a).
// Pure, so the wording and the rules are tested without Meta or a database.

export type StepState = 'done' | 'todo' | 'attention' | 'waiting' | 'coming_soon';
export type StepKey = 'facebook' | 'instagram' | 'ad_access' | 'ad_account' | 'payment_method' | 'whatsapp';

/** What the app should do when the step's button is tapped. */
export type StepAction =
  | { kind: 'connect' } // Facebook login (connect or reconnect)
  | { kind: 'choose_ad_account' }
  | { kind: 'open_url'; url: string; label: string };

export interface SetupStep {
  key: StepKey;
  title: string;
  state: StepState;
  /** One plain sentence: what's connected, or what to do and why. */
  detail: string;
  optional: boolean;
  action: StepAction | null;
}

export interface SetupInput {
  now: Date;
  facebook: { status: 'active' | 'needs_reconnect'; displayName: string } | null;
  instagram: { status: 'active' | 'needs_reconnect'; displayName: string } | null;
  access: { grantedScopes: string[]; expiresAt: Date | null } | null;
  adAccount: {
    id: string;
    name: string;
    currency: string;
    metaStatus: number;
    status: 'active' | 'needs_reconnect';
    ownedBy: 'vendor' | 'scalio';
    hasPaymentMethod: boolean;
    paymentMethodLabel: string | null;
  } | null;
}

export interface Setup {
  steps: SetupStep[];
  /** True once the business can create ads: Page connected and ad access granted. */
  ready: boolean;
}

/**
 * Meta's Payment settings page for one ad account, so a vendor adds a card there
 * without hunting through Meta. Opened in the browser where they're already
 * signed in from connecting. Confirm the link format against a live account
 * before launch; if Meta changes it, only this function changes.
 */
export function metaBillingUrl(adAccountId: string): string {
  return `https://business.facebook.com/billing_hub/payment_settings/?asset_id=${encodeURIComponent(adAccountId.replace(/^act_/, ''))}`;
}

/** Plain-language reason an ad account can't run ads, from Meta's account_status. Null when it can. */
export function adAccountProblem(metaStatus: number): string | null {
  switch (metaStatus) {
    case 1: return null;
    case 2: return 'Meta has disabled this ad account. Check Account Quality in Meta, or choose another ad account.';
    case 3: return 'This ad account has an unpaid Meta bill. Pay it in Meta, then tap Check again.';
    case 7: return 'Meta is reviewing this ad account. This usually takes a day; tap Check again later.';
    case 8: return 'This ad account is waiting for a payment to settle in Meta.';
    case 9: return 'This ad account is in a grace period because a Meta payment failed. Update the card in Meta.';
    case 100: return 'This ad account is being closed in Meta. Choose another ad account.';
    case 101: return 'This ad account is closed. Choose another ad account.';
    default: return 'Meta says this ad account can’t run ads right now. Check it in Meta, or choose another ad account.';
  }
}

const AD_SCOPES = ['ads_management', 'ads_read', 'pages_manage_ads'];

export function buildSetup(i: SetupInput): Setup {
  const steps: SetupStep[] = [];
  const connect: StepAction = { kind: 'connect' };

  // 1. Facebook Page — everything else hangs off it.
  const fb = i.facebook;
  steps.push(
    !fb
      ? { key: 'facebook', title: 'Facebook Page', state: 'todo', optional: false, action: connect, detail: 'Your ads run from your business’s Facebook Page. Log in with Facebook and choose it.' }
      : fb.status === 'needs_reconnect'
        ? { key: 'facebook', title: 'Facebook Page', state: 'attention', optional: false, action: connect, detail: `Facebook stopped Scalio’s access to ${fb.displayName}. Reconnect to keep going.` }
        : { key: 'facebook', title: 'Facebook Page', state: 'done', optional: false, action: null, detail: `Connected: ${fb.displayName}` },
  );

  // 2. Instagram — optional: ads still show on Instagram using the Page.
  const ig = i.instagram;
  steps.push(
    ig?.status === 'active'
      ? { key: 'instagram', title: 'Instagram', state: 'done', optional: true, action: null, detail: `Connected: ${ig.displayName}` }
      : ig
        ? { key: 'instagram', title: 'Instagram', state: 'attention', optional: true, action: connect, detail: `Reconnect so ads and messages use ${ig.displayName}.` }
        : {
            key: 'instagram', title: 'Instagram', state: fb ? 'todo' : 'waiting', optional: true, action: fb ? connect : null,
            detail: 'Optional. To advertise as your Instagram account and get its messages here, switch it to a Business account, link it to your Facebook Page in Instagram’s settings, then reconnect.',
          },
  );

  // 3. Permission to manage ads.
  const access = i.access;
  const expired = !!access?.expiresAt && access.expiresAt.getTime() <= i.now.getTime();
  const missing = access ? AD_SCOPES.filter((s) => !access.grantedScopes.includes(s)) : AD_SCOPES;
  steps.push(
    !fb || fb.status !== 'active'
      ? { key: 'ad_access', title: 'Permission to run ads', state: 'waiting', optional: false, action: null, detail: 'Connect your Facebook Page first.' }
      : !access
        ? { key: 'ad_access', title: 'Permission to run ads', state: 'todo', optional: false, action: connect, detail: 'Reconnect Facebook once more and allow Scalio to manage ads. Your Page stays connected.' }
        : expired
          ? { key: 'ad_access', title: 'Permission to run ads', state: 'attention', optional: false, action: connect, detail: 'Your Facebook login for ads has expired or was removed (Meta asks again every 60 days). Reconnect to keep your ads running.' }
          : missing.length > 0
            ? { key: 'ad_access', title: 'Permission to run ads', state: 'attention', optional: false, action: connect, detail: 'Some ad permissions were switched off during Facebook login. Reconnect and leave them all on.' }
            : { key: 'ad_access', title: 'Permission to run ads', state: 'done', optional: false, action: null, detail: 'Scalio can create and manage ads for your Page.' },
  );
  const accessOk = steps[2].state === 'done';

  // 4. Ad account — optional: without one, the vendor pays with Scalio (route 1).
  const acct = i.adAccount;
  const problem = acct ? adAccountProblem(acct.metaStatus) : null;
  steps.push(
    !accessOk
      ? { key: 'ad_account', title: 'Ad account', state: 'waiting', optional: true, action: null, detail: 'Allow Scalio to manage ads first.' }
      : !acct
        ? {
            key: 'ad_account', title: 'Ad account', state: 'todo', optional: true, action: { kind: 'choose_ad_account' },
            detail: 'Optional. Already advertise on Facebook? Choose your ad account. If not, skip this — you can pay for ads with Scalio.',
          }
        : acct.status === 'needs_reconnect'
          ? { key: 'ad_account', title: 'Ad account', state: 'attention', optional: true, action: connect, detail: `Scalio lost access to ${acct.name}. Reconnect Facebook.` }
          : problem
            ? { key: 'ad_account', title: 'Ad account', state: 'attention', optional: true, action: { kind: 'choose_ad_account' }, detail: problem }
            : { key: 'ad_account', title: 'Ad account', state: 'done', optional: true, action: { kind: 'choose_ad_account' }, detail: `${acct.name} · ${acct.currency}` },
  );

  // 5. Payment method — only for the vendor's own ad account (route 2).
  if (accessOk && acct && acct.ownedBy === 'vendor' && !problem && acct.status === 'active') {
    steps.push(
      acct.hasPaymentMethod
        ? { key: 'payment_method', title: 'Card on Meta', state: 'done', optional: true, action: null, detail: `Meta will charge ${acct.paymentMethodLabel ?? 'your saved payment method'} for ad spend.` }
        : {
            key: 'payment_method', title: 'Card on Meta', state: 'todo', optional: true,
            action: { kind: 'open_url', url: metaBillingUrl(acct.id), label: 'Add a card to Meta' },
            detail: 'Optional. To pay Meta yourself, add a card to this ad account — the button opens the right Meta page. No card Meta accepts? Pay with Scalio instead when you launch an ad.',
          },
    );
  }

  // 6. WhatsApp — waits on the WhatsApp provider decision (D4).
  steps.push({
    key: 'whatsapp', title: 'WhatsApp', state: 'coming_soon', optional: true, action: null,
    detail: 'Coming soon: WhatsApp chats in your Scalio inbox. Ads can already open WhatsApp if your number is linked to your Facebook Page.',
  });

  return { steps, ready: steps[0].state === 'done' && accessOk };
}
