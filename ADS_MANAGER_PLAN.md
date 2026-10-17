# Ads Manager — plan (draft for review, 2026-10-17)

Scalio Ads Manager lets any vendor, technical or not, do four things:

- Connect Facebook, Instagram and WhatsApp.
- Run Meta ads.
- Reply to customers from one Scalio inbox, with AI auto-replies.
- Pay at the end of the flow.

This plan sits alongside `PLATFORM_PLAN.md`, where it fills in the Phase 4 items "Ads (Meta)" and "Unified inbox". Nothing gets built until the decisions in §6 are made.

---

## 1. Can it be done? Yes, with three gates

| Feature | Possible? | How / caveat |
|---|---|---|
| Connect Facebook Page + Instagram | ✅ Already half-built | `social/` uses Facebook Login for Business. New scopes are needed (see §5). |
| Connect WhatsApp | ✅ | WhatsApp Embedded Signup. Scalio must become a Meta **Tech Provider**, or use a BSP (D4, still open). |
| Create campaigns with all 6 objectives | ✅ | Marketing API (Graph `v25.0`): campaign → ad set → creative → ad. |
| Engagement as the default | ✅ | `OUTCOME_ENGAGEMENT`, with the destination set to WhatsApp or Instagram DM and optimised for `CONVERSATIONS`. These are "click-to-chat" ads, the best fit for service vendors. |
| Audience: location, age, gender | ✅ | `targeting.geo_locations` (radius around the shop), `age_min/max` and `genders`. |
| Keyword targeting with suggestions ("hairstyling", "skincare") | ✅ | Targeting Search API (`type=adinterest`) plus interest suggestions. Shows live autocomplete and audience size. |
| AI ad copy | ✅ | Claude writes the primary text, headline and CTA. This reuses `content-studio/caption-writer.ts`. |
| Auto-reply inside the ad | ✅ | Click-to-chat ads carry a **welcome message + quick-reply questions** in the creative. Claude drafts them. |
| Message customers from Scalio (Instagram, Messenger, WhatsApp) | ✅ | Instagram Messaging API, Messenger Send API and WhatsApp Cloud API, all feeding one inbox. **TikTok is not possible** (no public DM API). |
| Auto-replies to customers and prospects | ✅ **only inside the 24-hour window** | Meta only allows replies within 24h of the customer's last message, and does not allow cold messages. After 24h: Instagram/Messenger allow manual replies only (Human Agent tag, 7 days); WhatsApp needs a paid, pre-approved template. |
| Pay for the ad on Scalio | ✅ Two routes (§4) | **Pay with Scalio:** the vendor pays Scalio in naira (card, transfer, USSD) and Scalio funds a Scalio-owned ad account that advertises the vendor's Page. **Own Meta account:** the vendor adds a card through a direct link from Scalio, and Scalio charges only its fee. Meta has no API to add a card or top up, which is why Route 1 needs Scalio-owned ad accounts. |

**The three gates, all outside the code:**

1. **Meta Business Verification** for Scalio's business. Takes a few business days.
2. **App Review for Advanced Access** to `ads_management`, `pages_messaging`, `instagram_manage_messages`, `leads_retrieval`, `pages_manage_ads` and the WhatsApp permissions. Standard access only works on assets Scalio's own team owns, so it is enough to build and test but not to launch. Plan for 2–6 weeks with resubmissions. Meta needs a screencast of each permission in use.
3. **Marketing API "Full" tier** (since May 2026) to avoid low rate limits. It requires 500 API calls in 15 days with an error rate under 15%, which normal beta usage should reach.

---

## 2. User journeys

### 2a. Connect (once)

```
More → Ads & Inbox → "Connect your accounts"
  ├─ Facebook + Instagram  → Meta login (Facebook Login for Business)
  │     → pick Page → Instagram account auto-detected → pick/create ad account
  └─ WhatsApp              → Embedded Signup → verify business number via OTP
→ Checklist screen: ✅ Page  ✅ Instagram  ✅ WhatsApp  ✅ Ad account  ⬜ Payment method (Route 2 only: "Add a card to Meta" opens the ad account's payment settings directly)
```

If something is missing, the checklist shows a plain-language fix rather than a Meta error code. Example: "Your Instagram must be a Business account — here's how (30 s)".

### 2b. Simple mode, the default ("Get more customers", 4 screens)

```
1. What do you want?      [Get more chats ✓ default]  (= Engagement, click-to-WhatsApp/DM)
                          "More options" link → Advanced mode
2. Who should see it?     Prefilled: 10 km around your shop · Ages 18–45 · All genders
                          · Interests auto-picked from your services (e.g. Hair salon → Hairstyling, Braids)
                          [Edit] opens the same pickers as Advanced, in a sheet
3. Your ad                Claude drafts 3 versions from your services, photos & prices
                          → pick one, swap photo, edit text; preview as IG Feed / Story / FB
                          Auto-reply preview: "Hi! 👋 Thanks for reaching Amaka's Hair Studio…"
                          + 3 quick questions ("Prices?", "Book for Saturday", "Location?")
4. Budget & pay           Slider: ₦2,000–₦20,000/day
                          Runs for: 7 days (default; ends <date>)  [+ Run longer] → 14 / 30 days / pick a date
                          Shows: est. people reached · est. chats · ad spend · 7.5% VAT · Scalio fee · total
                          → Payment wall → "Your ad is in review (usually < 24 h)"
```

### 2c. Advanced mode (same flow with more controls)

| Step | Extra controls |
|---|---|
| Objective | All 6 objectives: Awareness, Traffic, Engagement, Leads, App promotion, Sales. Each shows a one-line explanation and "best for…". |
| Conversion location | Depends on the objective: WhatsApp / Messenger / Instagram DM / website / instant form / app / calls. |
| Audience | Multiple locations (city, state, pin + radius), exclude locations, age 13–65+, gender, interests via keyword search with suggestions and audience-size meter, include/exclude interests, languages. Saved audiences for reuse. Custom/lookalike audiences come later (§7, Phase 4). |
| Placements | Advantage+ (recommended), or manual: FB Feed / IG Feed / Stories / Reels / Messenger / Audience Network. |
| Budget & schedule | Daily or lifetime. Start = now, **end date defaults to start + 7 days**; vendor can move it later (no upper limit beyond Meta's) or extend a live ad. Ad scheduling (lifetime only), bid strategy (lowest cost / cost cap). |
| Creative | Single image, video or carousel. Primary text, headline, description, CTA, URL + UTM. Instant form builder for Leads. Pixel / app picker for Sales / App promotion. |
| Auto-reply | Edit welcome message, up to 4 quick questions, and an AI answer for each. |

### 2d. Inbox & auto-replies (after launch)

```
Inbox tab: one list of chats from WhatsApp / Instagram / Messenger (channel icon per chat)
  ├─ Each chat: tagged "From ad: <campaign>" when it started from an ad → auto-creates a Lead (existing `leads` table)
  ├─ AI auto-reply ON/OFF per channel; modes: "Reply for me" | "Suggest, I send"
  ├─ AI uses only: business profile, services & prices, hours, location, FAQ the vendor writes
  ├─ Hand-off rules: complaint/refund/unknown answer → stop AI, notify vendor
  ├─ "Book" button inside chat → existing booking flow; payment link via Paystack
  └─ 24-h timer on each chat; after expiry, composer switches to "Human reply (7 days)" or, on WhatsApp, "Send template (paid)"
```

### 2e. Results

The campaign card shows spend, people reached, chats started, leads, bookings, and cost per chat. Bookings are the Scalio-only part: chat → booking attribution. Actions on the card: Pause / Resume / Boost budget / Duplicate.

---

## 3. Meta required fields → where the vendor provides them

✱ marks fields Scalio fills in automatically in Simple mode.

| Level | Meta field | Required? | Simple mode | Advanced mode |
|---|---|---|---|---|
| Campaign | `name` | Yes | ✱ "Amaka's Hair Studio – Chats – 17 Oct" | Editable |
| | `objective` | Yes (cannot change later) | ✱ `OUTCOME_ENGAGEMENT` | Pick 1 of 6 |
| | `special_ad_categories` | Yes (`[]` if none) | ✱ `[]`, one-tap "Is this about jobs/housing/credit/politics?" | Same |
| | `status` | Yes | ✱ `PAUSED` until payment clears, then `ACTIVE` | Same |
| | `buying_type` | Default `AUCTION` | ✱ | ✱ |
| Ad set | `name` | Yes | ✱ | Editable |
| | `daily_budget` or `lifetime_budget` | Yes (kobo-like minor units) | Slider | Daily / lifetime |
| | `start_time` / `end_time` | End required for lifetime | ✱ now → **+7 days** (default); "Run longer" to extend | Date pickers, end prefilled to +7 days |
| | `billing_event` | Yes | ✱ `IMPRESSIONS` | ✱ |
| | `optimization_goal` | Yes | ✱ `CONVERSATIONS` | Mapped from the objective + conversion location |
| | `bid_strategy` | Default lowest cost | ✱ | Lowest cost / cost cap (+ `bid_amount`) |
| | `destination_type` | For chat/web | ✱ WhatsApp if connected, else IG Direct | Picker |
| | `promoted_object` | Objective-dependent | ✱ `page_id` (+ WhatsApp number) | Pixel + event / app id + store URL / page |
| | `targeting.geo_locations` | Yes | ✱ shop pin + 10 km | Multi-location |
| | `targeting.age_min/max`, `genders` | Optional | ✱ 18–45 / all | Editable |
| | `targeting.flexible_spec.interests` | Optional | ✱ from service categories | Keyword search + suggestions |
| | `publisher_platforms` / positions | Optional | ✱ Advantage+ placements | Manual |
| Creative | `object_story_spec.page_id` | Yes | ✱ | ✱ |
| | `instagram_user_id` | For IG | ✱ | ✱ |
| | image (`image_hash`) / video id | Yes | Service photo or upload | Image / video / carousel |
| | `message` (primary text) | Yes | AI draft | Edit |
| | `name` (headline), `description` | Optional | AI draft | Edit |
| | `call_to_action` | Yes | ✱ `WHATSAPP_MESSAGE` / `MESSAGE_PAGE` | Picker |
| | `link` | Web / app objectives | — | URL + UTM |
| | Welcome message + ice breakers | Chat ads | AI draft | Edit |
| Lead form | `name`, `questions`, `privacy_policy.url`, thank-you screen | Leads only | — | Builder. Privacy URL defaults to the vendor's Scalio page policy. |
| Ad | `name`, `adset_id`, `creative`, `status` | Yes | ✱ | ✱ |

**Payment details are not an API field.** Route 1: Scalio's funding source plus `spend_cap`. Route 2: the vendor's card, added through Scalio's direct link (§4).

---

## 4. Paying for ads (D13): both routes, the vendor picks at the payment screen

Meta only charges the payment method saved on an ad account, and its API can't add a card or top up. So a route depends on **whose ad account the campaign runs on**.

### Route 1 — "Pay with Scalio" (default; works for every vendor)

For vendors without a dollar card or a card Meta accepts.

1. The vendor pays Scalio through Paystack: card, bank transfer or USSD, in naira. The amount is ad spend + 7.5% VAT + Scalio fee.
2. The campaign runs on an **ad account Scalio owns** (one per vendor, created under Scalio's Business Manager via the API). It advertises the **vendor's own Page / Instagram / WhatsApp**: in the connect step the vendor grants Scalio's Business Manager ad access to their Page.
3. Scalio's funding source on Meta pays for it. At first that is a Scalio corporate dollar card (or prepaid funds); later, a Meta credit line / monthly invoicing once Scalio has spend history.
4. Safety caps so Scalio never fronts more than it received:
   - campaign `lifetime_budget` = amount paid;
   - ad-account `spend_cap` (settable through the API) = total paid so far.
5. Unspent budget (ad stopped early, rejected, under-delivered) goes back as **ad credit** on the vendor's Scalio balance for the next campaign, or as a refund on request.
6. Ledger: new `ledgerKindValues` `ad_topup`, `ad_spend`, `ad_refund`, reconciled daily against Meta's reported spend.

### Route 2 — "Use my own Meta ad account"

For vendors who already advertise, or have a card Meta accepts.

- The campaign runs on the vendor's own ad account, picked in the connect step.
- **Adding a card doesn't start the journey from Meta.** Scalio shows "Add a card to Meta" and opens that ad account's **Payment settings page directly** in the in-app browser. That is Meta Billing → Payment settings, with the ad account id in the link; the exact URL format must be confirmed during the build. The vendor is already signed in from the connect step, adds the card, taps Done, and Scalio checks the account (`funding_source_details`) and ticks the checklist.
- Scalio's payment screen then charges **only Scalio's fee** through Paystack. Meta bills the ad spend + VAT to the vendor's card.

### What the vendor sees on the payment screen

```
Ad spend (7 days × ₦5,000)      ₦35,000
VAT 7.5%                         ₦2,625
Scalio fee                       ₦3,500
───────────────────────────────────────
Total                           ₦41,125

How do you want to pay?
 (•) Pay with Scalio — card, bank transfer or USSD     ← default
 ( ) My own Meta ad account — Meta charges my card; I pay Scalio's fee only (₦3,500)
```

### Trade-offs to accept for Route 1

- **Ad account limits:** Meta caps how many ad accounts one Business Manager can create, and raises the cap as spend grows. Early on Scalio may need to ask Meta for a higher limit, or put several small vendors on shared ad accounts (each campaign tagged to its vendor).
- **Policy risk sits with Scalio:** a vendor's rejected or banned ads count against Scalio's Business Manager. This needs ad pre-checks (AI + rules) and fast suspension of repeat offenders.
- **History stays with Scalio:** a vendor who later moves to Route 2 starts a fresh ad account.
- **FX:** if Scalio's Meta funding is in dollars, Scalio carries the naira→dollar spread. Build about 3% into the fee, or set Scalio's ad accounts to NGN where Meta allows.
- **Legal:** this is Scalio holding vendor money. A fintech lawyer must confirm it's fine for prepaid ad spend: Scalio buys a service (ads) on the vendor's behalf, which is not deposit-taking. Keep ad funds in a separate account.

## 5. Cost per vendor

Assumptions:

- ₦1,500 = $1.
- Prices are from public sources in Oct 2026; verify before quoting to vendors.
- Claude runs on `claude-opus-5-5` (the project default), at $4 / $20 per million input/output tokens, with prompt-cache reads at $0.20 per million.

### Costs Scalio pays per vendor

| Item | Unit cost | Typical vendor / month | ₦ / month |
|---|---|---|---|
| AI auto-reply (≈2k cached context + 300 new in, ≈300 out incl. thinking at low effort) | ≈ $0.008 ≈ ₦12 per reply | 300 replies | **≈ ₦3,600** |
| AI ad copy + welcome message (3 variants) | ≈ $0.03 ≈ ₦45 per draft | 5 drafts | ≈ ₦225 |
| Interest suggestions, audience estimates, Meta API calls | Free | — | ₦0 |
| Instagram / Messenger messages | Free | — | ₦0 |
| WhatsApp replies inside the 24h window (service messages) | Free from Meta. Chats started from a click-to-WhatsApp ad get 72h free. | — | ₦0 |
| WhatsApp marketing templates (outside window, only if vendor sends) | ≈ $0.05–0.06 ≈ ₦80 each | 0–100 | ₦0–8,000 (pass through to vendor) |
| WhatsApp BSP fee (only if D4 picks a BSP instead of Tech Provider) | Varies by provider | — | ₦0–15,000 |
| **Scalio's cost, typical** | | | **≈ ₦4,000 per active vendor** |

On the AI cost:

- A cheaper Claude model (Haiku 5.5, about $0.10 / $0.50 per million) would cut the AI line to about ₦100/month.
- That is your call (D15), and it needs a quality check on real chats first.

### What the vendor pays: example one-week "Get more chats" campaign

| Line | Amount |
|---|---|
| Ad spend: ₦5,000/day × 7 | ₦35,000 |
| VAT 7.5% (Meta charges this on Nigerian ad spend) | ₦2,625 |
| Scalio fee (example: 10%, min ₦1,000; see D14) | ₦3,500 |
| **Total the vendor sees** | **₦41,125** |
| Paystack fee, paid by Scalio out of its fee. Route 1 is charged on the full ₦41,125 (1.5% + ₦100, capped at ₦2,000). Route 2 is charged only on the ₦3,500 fee. | ≈ ₦717 (Route 1) / ≈ ₦150 (Route 2) |

Note:

- Meta's practical minimum is about ₦1,600–2,500 a day. Below ₦3,000 a day, results are thin.
- Rough Nigerian benchmark: ₦30–150 per chat started.
- So ₦35,000 is about 250–1,000 chats. That is an estimate, not a promise.

### Pricing suggestion (D14)

- **Free:** inbox plus manual replies.
- **Growth plan, ≈ ₦5,000/month:** AI auto-replies up to 1,000 replies. This covers the ~₦4,000 AI cost.
- **Per campaign:** 10% of ad spend (min ₦1,000).

---

## 6. Decisions needed before building

| # | Decision | Blocks |
|---|---|---|
| **D13** | ✅ **Decided (2026-10-17): offer both routes.** Default is "Pay with Scalio": Scalio receives the money and funds Scalio-owned ad accounts. Vendors with their own Meta account and a working card can use Route 2. Still to do: lawyer sign-off on holding ad funds; choose Scalio's Meta funding source (corporate dollar card first, credit line later). | Phase 3 |
| **D14** | **Scalio pricing:** % of ad spend vs flat per campaign; AI auto-reply as a paid plan? | Phase 3 paywall |
| **D15** | **AI model for auto-replies:** `claude-opus-5-5` (best quality, ≈ ₦12/reply) vs a cheaper Claude model (≈ ₦1/reply) after a quality test. | Phase 2 cost |
| D4 (open) | **WhatsApp:** become a Meta Tech Provider (free, needs app review) vs a BSP (faster, monthly fee). | Phase 2 WhatsApp |
| D10 (you) | Meta Business Verification + App Review for the permissions in §1. Start **now**; it is the longest pole. | Launch |

---

## 7. Phases

Each phase ships behind a feature flag. It is tested with Scalio's own Page and ad account using Standard access, then opened to vendors once App Review passes.

### Phase 1 — Connect & foundations (≈1.5 weeks) — built 2026-10-17, behind `ADS_MANAGER_ENABLED`

- [x] Extend the login permissions with `META_ADS_SCOPES` (only requested when `ADS_MANAGER_ENABLED=true`):
  - `ads_management`, `ads_read`, `pages_manage_ads`, `pages_manage_metadata`
  - `pages_messaging`, `instagram_manage_messages`, `leads_retrieval` (`business_management` was already there)
- [x] `socialPlatformValues` += `whatsapp` (publishing keeps its own `publishPlatformValues`). New tables (migration `0017_ads_manager`):
  - `meta_user_access`: encrypted Meta user token, expiry and granted permissions;
  - `ad_accounts`: `ownedBy` vendor/scalio, Meta status, whether a card is on it;
  - `meta_webhook_events`.
- [x] `GET /vendor-admin/ads/setup` checklist, `GET ad-accounts`, `PUT ad-account`, `POST ad-account/refresh`. One ad account is auto-chosen when the login has exactly one.
- [x] Connect checklist: vendor-mobile (Settings → Ads) and vendor-web (`/dashboard/ads`), with plain-language fixes and the "Add a card to Meta" link (re-checks on return).
- [x] Webhook `/social/meta/webhook`: verify token handshake, `X-Hub-Signature-256` check, events stored for Phase 2.
- [ ] WhatsApp Embedded Signup (after D4).
- [ ] Before launch:
  - confirm the Meta billing link format on a live ad account;
  - subscribe the webhook in the Meta app (`messages`, `leadgen`, `feed`);
  - add the new permissions to the Login for Business configuration if one is used.

### Phase 2 — Inbox & AI auto-replies (≈2.5 weeks)

- [ ] Tables `conversations` and `messages`: channel, external ids, `lastCustomerMessageAt` for the 24h window.
- [ ] Unified inbox UI with channel icons, a 24h timer, and a composer that changes outside the window.
- [ ] `ai-replies` service:
  - Claude with business profile, services, prices, hours and FAQ as cached context.
  - Modes "Reply for me" / "Suggest".
  - Hand-off rules.
  - Never replies outside the 24h window.
- [ ] Each new chat creates or updates a row in `leads` with its source.
- [ ] Vendor FAQ editor with an AI-drafted first version.

### Phase 3 — Campaign builder + paywall, both payment routes (≈4.5 weeks)

- [ ] `ads` module: create campaign → ad set → creative → ad, all as `PAUSED`; activate after payment.
- [ ] Simple mode with Engagement and click-to-chat defaults, and Advanced mode with all 6 objectives (§3 mapping table in code as one config).
- [ ] Interest search and suggestions (cached), location search, audience-size and reach estimate.
- [ ] AI creative: 3 variants, welcome message and ice breakers. Image upload to `adimages`.
- [ ] Paywall with route choice. Route 1: Paystack charge for spend + VAT + fee → set `spend_cap` → activate. Route 2: "Add a card to Meta" direct link + funding check → Paystack charge for fee → activate.
- [ ] Scalio-owned ad accounts: create per vendor under Scalio's Business Manager, request Page ad access from the vendor, attach Scalio's funding source.
- [ ] Ad wallet ledger (`ad_topup` / `ad_spend` / `ad_refund`), daily reconciliation with Meta spend, unspent budget back as ad credit.
- [ ] Meta ad-review status shown to the vendor, with rejection reasons in plain language.

### Phase 4 — Results & growth (≈1.5 weeks)

- [ ] Insights sync (spend, reach, conversations, leads) on a schedule.
- [ ] Chat → booking attribution, with "cost per booking" on the campaign card.
- [ ] Pause, resume, boost, extend end date and duplicate actions. Notify the vendor 1 day before an ad ends, with a one-tap "Extend 7 days". Saved audiences. Custom audience from Scalio customer list (hashed) and lookalikes.
- [ ] Advanced objectives' extras: instant forms (Leads), pixel picker (Sales), app store link (App promotion).

**Total: about 10 weeks of build.** The Meta reviews run in parallel and are usually the real bottleneck.

## 8. Rules for this module

- Every campaign is created `PAUSED` and only goes live after payment.
- Every ad set gets an end date: **7 days after start by default**, never open-ended. The vendor can extend it before launch or while it runs ("Extend" on the campaign card updates `end_time`; under Route 1 the extra days are charged through the paywall first).
- Never send AI or automated messages outside the 24h window. Never use message tags for promotions.
- AI only states facts from the vendor's own data (prices, hours, services). When unsure, it hands off to the vendor.
- Show Meta errors as a plain sentence plus a fix. Log the raw error.
- All money in kobo. Ad budgets are converted to Meta's minor units per ad-account currency.
