// End-to-end check of Pro, on your machine: the real API, the real database, and the stand-in Stripe that
// `npm run local` starts (checkout page, subscriptions, and webhooks signed the way Stripe signs them).
// A new creator buys Pro, the webhook makes them Pro, the same event delivered again changes nothing,
// they cancel and change their mind (at "Stripe" first), a renewal fails and then succeeds, the
// subscription ends, and a subscription whose paid month is over stops being Pro.
//
//   1. npm run local              (from the repository root; wait for "PostStreak is running")
//   2. cd backend && node scripts/e2e-billing.mjs
//
// It only runs against a database on this machine. The creators it makes are deleted at the end.
// Exits 1 if any check fails.
import { API, MOCKS, api, asCreatorDirect, asService, check, deleteCreators, env, finish, section, signIn, sleep } from './e2e-lib.mjs';

const stamp = Date.now();
const STRIPE = `${MOCKS}/stripe`;

/** Polls until `fn` returns something truthy (webhooks arrive a moment after the click). */
async function until(fn, ms = 15_000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v || Date.now() > end) return v;
    await sleep(300);
  }
}

section('the stack');
{
  const res = await fetch(`${STRIPE}/_control/session/cs_test_none`).catch(() => null);
  check('the stand-in Stripe is running', res?.status === 404, res?.status);
}

section('two new creators (real emailed codes)');
const ada = await signIn(`billing-ada+${stamp}@example.com`);
const lapsed = await signIn(`billing-lapsed+${stamp}@example.com`);
const A = api(ada.token);
const plan = async (who = A) => (await who('GET', '/api/v1/me/bootstrap')).body?.plan ?? null;
const subs = async (userId) => (await asService('GET', `subscriptions?user_id=eq.${userId}&select=*&order=created_at.asc`)).body;

section('what is on sale');
const offer = await A('GET', '/api/v1/billing/offer');
check('the offer has the plan\'s own price', offer.status === 200 && offer.body?.plan?.priceUsdCents === 999, JSON.stringify(offer.body?.plan));
check('a payment can be taken here (the stand-in)', JSON.stringify(offer.body?.processors) === '["stripe"]', offer.body?.processors);
check('the free plan\'s limits are the enforced ones', offer.body?.limits?.free?.aiWritesPerDay === 3 && offer.body?.limits?.free?.repurposesPerWeek === 1);
check('Pro has no write limit', offer.body?.limits?.pro?.aiWritesPerDay === null);

section('buying Pro');
check('Ada starts free', (await plan()) === null);
const checkout = await A('POST', '/api/v1/billing/checkout', {});
const url = checkout.body?.checkoutUrl ?? '';
check('checkout gives a payment page', checkout.status === 200 && url.startsWith(`${STRIPE}/pay/cs_test_`), `${checkout.status} ${url}`);
check('opening the page alone changes nothing', (await plan()) === null);
const page = await fetch(url);
check('the payment page says it is a local stand-in', page.ok && (await page.text()).includes('Local test page'));
const paid = await fetch(url, { method: 'POST', redirect: 'manual' });
const back = paid.headers.get('location') ?? '';
check('paying sends the creator back to the app, saying it worked', paid.status === 302 && back.endsWith('/?payment=success') && !back.includes(':3000'), back);
const nowPro = await until(plan);
check('the webhook made Ada Pro', nowPro?.status === 'active' && nowPro?.cancelAtPeriodEnd === false, JSON.stringify(nowPro));
let rows = await subs(ada.userId);
check('one subscription, Stripe\'s id on it', rows.length === 1 && rows[0].processor === 'stripe' && rows[0].processor_subscription_id?.startsWith('sub_'), rows.length);
const subId = rows[0]?.processor_subscription_id;
const daysLeft = (Date.parse(rows[0]?.current_period_end) - Date.now()) / 86_400_000;
check('paid to the end of the invoice\'s month', daysLeft > 29 && daysLeft < 31, daysLeft.toFixed(2));
const txs = (await asService('GET', `payment_transactions?user_id=eq.${ada.userId}&select=amount,currency`)).body;
check('the payment is recorded', txs.length >= 1 && txs.every((t) => t.amount === 999 && t.currency === 'USD'), JSON.stringify(txs));
const hooks = await A('POST', '/api/v1/studio/hooks', { idea: 'Why I stopped posting every day' });
check('a Pro tool now answers', hooks.status === 200, hooks.status);

section('the same event again changes nothing');
const replay = await (await fetch(`${STRIPE}/_control/replay/${subId}`, { method: 'POST' })).json();
check('Stripe\'s retry is accepted', replay.webhookStatus === 200, replay.webhookStatus);
rows = await subs(ada.userId);
const txs2 = (await asService('GET', `payment_transactions?user_id=eq.${ada.userId}&select=id`)).body;
check('still one subscription and no extra payment', rows.length === 1 && txs2.length === txs.length, `${rows.length} / ${txs2.length}`);
const again = await A('POST', '/api/v1/billing/checkout', {});
check('a Pro creator can\'t buy Pro twice', again.status === 400 && /already have Pro/.test(again.body?.message ?? ''), again.body?.message);

section('cancel, then change their mind');
const cancel = await A('POST', '/api/v1/billing/cancel');
check('cancel stops the renewal', cancel.status === 200 && cancel.body?.cancelAtPeriodEnd === true && !!cancel.body?.endsAt, JSON.stringify(cancel.body));
check('Stripe was told (its notice came back)', !!(await until(async () => (await subs(ada.userId))[0]?.cancel_at_period_end === true)));
check('still Pro until the end of the paid month', (await plan())?.status === 'active');
const re = await A('POST', '/api/v1/billing/reactivate');
check('reactivate turns the renewal back on', re.status === 200 && re.body?.cancelAtPeriodEnd === false, JSON.stringify(re.body));
check('Stripe agreed', !!(await until(async () => (await subs(ada.userId))[0]?.cancel_at_period_end === false)));

section('a renewal fails, then goes through');
await fetch(`${STRIPE}/_control/fail/${subId}`, { method: 'POST' });
check('a failed renewal means no Pro', (await until(async () => (await plan()) === null)) === true);
const blocked = await A('POST', '/api/v1/studio/hooks', { idea: 'Why I stopped posting every day' });
check('and Pro tools say so', blocked.status === 403 || blocked.status === 429 || blocked.body?.code === 'UPGRADE_REQUIRED', blocked.status);
const before = Date.parse((await subs(ada.userId))[0].current_period_end);
await fetch(`${STRIPE}/_control/renew/${subId}`, { method: 'POST' });
const renewed = await until(async () => {
  const r = (await subs(ada.userId))[0];
  return r.status === 'active' && Date.parse(r.current_period_end) > before ? r : null;
});
check('the next month paid: Pro again, a month further on', !!renewed && (await plan())?.status === 'active');

section('the subscription ends');
await fetch(`${STRIPE}/_control/end/${subId}`, { method: 'POST' });
check('ended at Stripe: no Pro', (await until(async () => (await plan()) === null)) === true);
const cancelNone = await A('POST', '/api/v1/billing/cancel');
check('nothing left to cancel', cancelNone.status === 404, cancelNone.status);

section('a paid month that is over stops being Pro');
{
  const planRow = (await asService('GET', 'subscription_plans?slug=eq.pro&select=id')).body[0];
  const made = await asService('POST', 'subscriptions', {
    user_id: lapsed.userId,
    plan_id: planRow.id,
    status: 'active',
    processor: 'paystack',
    processor_subscription_id: `ref_e2e_${stamp}`,
    currency: 'NGN',
    current_period_start: new Date(Date.now() - 33 * 86_400_000).toISOString(),
    current_period_end: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    cancel_at_period_end: true,
  });
  check('a month that ended two days ago (still "active" in the table)', made.status < 300, made.status);
  check('is not Pro, straight away', (await plan(api(lapsed.token))) === null);
  const cron = await fetch(`${API}/api/cron/dispatch`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } });
  const out = await cron.json().catch(() => ({}));
  check('the cron ends it', cron.ok && out.subscriptionsEnded >= 1, JSON.stringify(out.subscriptionsEnded));
  check('and the table says so', (await subs(lapsed.userId))[0]?.status === 'cancelled');
}

section('what no one else can do');
{
  const forged = await fetch(`${API}/api/payments/stripe/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}` },
    body: JSON.stringify({ id: 'evt_forged', type: 'checkout.session.completed', data: { object: { mode: 'subscription', subscription: 'sub_forged', metadata: { user_id: lapsed.userId, plan_id: 'x' } } } }),
  });
  check('a webhook with a wrong signature is refused', forged.status === 400, forged.status);
  check('and made nobody Pro', (await plan(api(lapsed.token))) === null);
  const direct = asCreatorDirect(lapsed.token);
  const self = await direct('POST', 'subscriptions', { user_id: lapsed.userId, plan_id: 'x', status: 'active', processor: 'stripe', currency: 'USD', current_period_end: '2099-01-01T00:00:00Z' });
  check('a creator can\'t write their own subscription', self.status >= 400, self.status);
  const events = await direct('GET', 'payment_events?select=*');
  check('a creator can\'t read payment events', events.status >= 400 || (Array.isArray(events.body) && events.body.length === 0), events.status);
}

await deleteCreators([ada.userId, lapsed.userId]);
finish();
