// Customer-facing payment policy copy. `NO_SHOW_FEE_PERCENT` is the seam for
// the backend refund/no-show automation (Plan B) — that work should mirror
// this value via an env var with the same default.
export const NO_SHOW_FEE_PERCENT = 10;

export const NO_SHOW_FEE_NOTICE =
  `If you don't show up for a paid appointment, ${NO_SHOW_FEE_PERCENT}% of your payment may be retained ` +
  'as a no-show fee — the rest is refunded automatically.';

export const PAY_ON_ARRIVAL_CAVEAT =
  "Paying at the venue doesn't guarantee your slot — if you're significantly late or don't show, it may be " +
  'given to a walk-in customer.';
