// A stand-in for Stripe (Checkout + Subscriptions + webhooks) for trying Pro end to end on localhost.
// It speaks the endpoints PostStreak uses, and sends PostStreak's webhook the same signed events Stripe
// would, in the order Stripe sends them:
//
//   POST /v1/checkout/sessions          a checkout page for a monthly subscription → { id, url }
//   GET  /pay/:session                  that page ("Pay" or "Cancel"; plainly marked as a local stand-in)
//   POST /pay/:session                  pays: checkout.session.completed, then invoice.paid, then back to success_url
//   POST /v1/subscriptions/:id          cancel_at_period_end=true|false → customer.subscription.updated
//
// and, to try what happens later in a subscription's life without waiting a month:
//   POST /_control/renew/:sub           another month paid (invoice.paid)
//   POST /_control/fail/:sub            a renewal failed (customer.subscription.updated, past_due)
//   POST /_control/end/:sub             the subscription ended (customer.subscription.deleted)
//   POST /_control/replay/:sub          sends the last event again (it must change nothing)
//
// Where the events go and the secret they are signed with: STRIPE_STANDIN_WEBHOOK_URL and
// STRIPE_STANDIN_WEBHOOK_SECRET (npm run local sets both, and gives the API the same secret).
import { createHmac, randomBytes } from 'node:crypto';
import { json, readForm, redirect, text } from './http.mjs';

const sessions = new Map(); // id → { amount, name, email, success, cancel, metadata, subMeta, subscription? }
const subscriptions = new Map(); // id → { metadata, status, cancelAtPeriodEnd, periodEnd (s), amount, lastEvent }

const rand = (n = 14) => randomBytes(n).toString('base64url').replace(/[-_]/g, 'x');
const now = () => Math.floor(Date.now() / 1000);
const MONTH = 30 * 24 * 60 * 60;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Stripe's form encoding: metadata[user_id]=… → { metadata: { user_id } } (only the keys used here). */
function bracketed(form, prefix) {
  const out = {};
  for (const [k, v] of Object.entries(form)) {
    if (k.startsWith(`${prefix}[`) && k.endsWith(']')) out[k.slice(prefix.length + 1, -1)] = v;
  }
  return out;
}

async function send(event) {
  const url = process.env.STRIPE_STANDIN_WEBHOOK_URL;
  const secret = process.env.STRIPE_STANDIN_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.error('[stripe] STRIPE_STANDIN_WEBHOOK_URL / _SECRET not set: event not sent', event.type);
    return { status: 0 };
  }
  const body = JSON.stringify(event);
  const t = now();
  const sig = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=${sig}` }, body });
    console.log(`[stripe] ${event.type} ${event.id} → ${res.status}`);
    return { status: res.status };
  } catch (err) {
    console.error(`[stripe] ${event.type} not delivered:`, err.message);
    return { status: 0 };
  }
}

/**
 * The subscription with this id. The seed script gives the Pro test accounts subscriptions this stand-in has
 * never seen (sub_local_<handle>); real Stripe would know them, so they are taken on the first time they're
 * used. Their period end is the database's: it isn't known here, so it isn't sent.
 */
function find(id) {
  if (!subscriptions.has(id) && id.startsWith('sub_local_')) {
    subscriptions.set(id, { metadata: {}, status: 'active', cancelAtPeriodEnd: false, periodEnd: null, amount: 999 });
  }
  return subscriptions.get(id);
}

function subscriptionObject(id) {
  const s = subscriptions.get(id);
  return {
    id,
    object: 'subscription',
    status: s.status,
    cancel_at_period_end: s.cancelAtPeriodEnd,
    ...(s.periodEnd ? { current_period_end: s.periodEnd, items: { data: [{ current_period_end: s.periodEnd }] } } : {}),
    metadata: s.metadata,
  };
}

async function emit(subId, type, object) {
  const event = { id: `evt_${rand()}`, object: 'event', type, created: now(), data: { object } };
  const s = subscriptions.get(subId);
  if (s) s.lastEvent = event;
  return send(event);
}

function invoice(subId) {
  const s = subscriptions.get(subId);
  return {
    id: `in_${rand()}`,
    object: 'invoice',
    subscription: subId,
    amount_paid: s.amount,
    subscription_details: { metadata: s.metadata },
    lines: { data: [{ period: { start: s.periodEnd - MONTH, end: s.periodEnd } }] },
  };
}

function payPage(res, id, s, origin) {
  const price = `$${(s.amount / 100).toFixed(2)}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Stripe Checkout (local stand-in)</title>
<style>
*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#f6f9fc;color:#1a1f36;margin:0;display:grid;place-items:center;min-height:100vh;padding:12px}
main{width:min(420px,100%);background:#fff;border-radius:16px;padding:26px;box-shadow:0 14px 40px rgba(50,50,93,.12)}
.banner{background:#fff4d6;border:1px solid #f1d58a;color:#6b4e00;border-radius:12px;padding:10px 12px;font-size:13px;margin-bottom:16px}
h1{font-size:20px;margin:0 0 4px}.price{font-size:32px;font-weight:800;margin:10px 0 2px}.per{color:#697386;font-size:14px}
p{color:#697386;font-size:14px;line-height:1.5}button{width:100%;height:46px;border:0;border-radius:10px;background:#635bff;color:#fff;font-size:16px;font-weight:700;cursor:pointer;margin-top:14px}
a{display:block;text-align:center;margin-top:16px;color:#697386;font-size:14px}
</style></head><body><main>
<div class="banner"><b>Local test page.</b> This stands in for Stripe on your machine. No card is charged and nothing leaves this computer.</div>
<h1>${esc(s.name)}</h1><div class="price">${price}</div><div class="per">per month</div>
<p>For ${esc(s.email)}</p>
<form method="post" action="${esc(`${origin}/pay/${id}`)}"><button type="submit">Pay ${price}</button></form>
<a href="${esc(s.cancel)}">Cancel and go back</a>
</main></body></html>`;
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
}

export async function handle(req, res, url, origin) {
  const path = url.pathname;
  const auth = req.headers.authorization ?? '';

  if (req.method === 'POST' && path === '/v1/checkout/sessions') {
    if (!/^Bearer \S+/.test(auth)) return json(res, 401, { error: { message: 'No API key provided' } });
    const form = await readForm(req);
    if (form.mode !== 'subscription') return json(res, 400, { error: { message: 'stand-in: only subscription checkouts' } });
    const amount = Number(form['line_items[0][price_data][unit_amount]']);
    if (!Number.isInteger(amount) || amount <= 0) return json(res, 400, { error: { message: 'Invalid unit_amount' } });
    const id = `cs_test_${rand()}`;
    sessions.set(id, {
      amount,
      name: form['line_items[0][price_data][product_data][name]'] ?? 'Subscription',
      email: form.customer_email ?? '',
      success: form.success_url,
      cancel: form.cancel_url,
      metadata: bracketed(form, 'metadata'),
      subMeta: Object.fromEntries(Object.entries(form).filter(([k]) => k.startsWith('subscription_data[metadata][')).map(([k, v]) => [k.slice('subscription_data[metadata]['.length, -1), v])),
    });
    return json(res, 200, { id, object: 'checkout.session', url: `${origin}/pay/${id}` });
  }

  const pay = /^\/pay\/(cs_test_\w+)$/.exec(path);
  if (pay) {
    const s = sessions.get(pay[1]);
    if (!s) return text(res, 404, 'This checkout has expired. Start again from PostStreak.');
    if (req.method === 'GET') return payPage(res, pay[1], s, origin);
    if (req.method === 'POST') {
      if (!s.subscription) {
        const subId = `sub_${rand()}`;
        s.subscription = subId;
        subscriptions.set(subId, { metadata: s.subMeta, status: 'active', cancelAtPeriodEnd: false, periodEnd: now() + MONTH, amount: s.amount });
        await emit(subId, 'checkout.session.completed', {
          id: pay[1],
          object: 'checkout.session',
          mode: 'subscription',
          payment_status: 'paid',
          subscription: subId,
          amount_total: s.amount,
          metadata: s.metadata,
        });
        await emit(subId, 'invoice.paid', invoice(subId));
      }
      return redirect(res, s.success);
    }
  }

  const sub = /^\/v1\/subscriptions\/(sub_\w+)$/.exec(path);
  if (sub && req.method === 'POST') {
    if (!/^Bearer \S+/.test(auth)) return json(res, 401, { error: { message: 'No API key provided' } });
    const s = find(sub[1]);
    if (!s) return json(res, 404, { error: { message: `No such subscription: '${sub[1]}'` } });
    const form = await readForm(req);
    if (form.cancel_at_period_end !== undefined) s.cancelAtPeriodEnd = form.cancel_at_period_end === 'true';
    await emit(sub[1], 'customer.subscription.updated', subscriptionObject(sub[1]));
    return json(res, 200, subscriptionObject(sub[1]));
  }

  const control = /^\/_control\/(renew|fail|end|replay)\/(sub_\w+)$/.exec(path);
  if (control && req.method === 'POST') {
    const [, action, id] = control;
    const s = find(id);
    if (!s) return json(res, 404, { error: 'unknown subscription' });
    let delivered;
    if (action === 'renew') {
      s.periodEnd = (s.periodEnd ?? now()) + MONTH;
      s.status = 'active';
      delivered = await emit(id, 'invoice.paid', invoice(id));
    } else if (action === 'fail') {
      s.status = 'past_due';
      delivered = await emit(id, 'customer.subscription.updated', subscriptionObject(id));
    } else if (action === 'end') {
      s.status = 'canceled';
      delivered = await emit(id, 'customer.subscription.deleted', subscriptionObject(id));
    } else {
      delivered = s.lastEvent ? await send(s.lastEvent) : { status: 0 };
    }
    return json(res, 200, { ok: true, webhookStatus: delivered.status, subscription: subscriptionObject(id) });
  }

  // For tests: which subscription a checkout created
  const look = /^\/_control\/session\/(cs_test_\w+)$/.exec(path);
  if (look && req.method === 'GET') {
    const s = sessions.get(look[1]);
    return s ? json(res, 200, { subscription: s.subscription ?? null }) : json(res, 404, { error: 'unknown session' });
  }

  return text(res, 404, `stand-in Stripe: no ${req.method} ${path}`);
}
