/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain integration harness. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '..', request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { applyWalletEvent, projectOverview } = require('../app/lib/wallet/engine.ts');
const { commitWallet, readWallet } = require('../app/lib/wallet/store.ts');
const { DEMO_OFFER_CATALOG } = require('../app/lib/offers/catalog.ts');
const { rewardsSeed } = require('../app/lib/offers/seed.ts');
const { applyOfferCommand, availablePoints, projectOffers, cashReward, rewardHistory, totalCashback } = require('../app/lib/offers/engine.ts');
const { parseOffersSnapshot } = require('../app/lib/offers/response.ts');
const { createOffersRepository } = require('../app/lib/offers/repository.ts');
const { offersReport } = require('../app/lib/offers/report.ts');
const now = '2026-10-23T12:00:00.000Z';
const context = () => ({ catalog: structuredClone(DEMO_OFFER_CATALOG), membership: { plan: 'METAL', active: true, source: 'demo', subscription_id: null }, cards: [{ id: 'card-usd', label: 'Virtual · •••• 4242', currency: 'USD', eligible: true }] });
const command = (state, action, fields = {}) => ({ action, expected_version: state.version, catalog_version: 1, ...fields });
const apply = (state, action, fields = {}, at = now, ctx = context()) => applyOfferCommand(state, ctx, command(state, action, fields), `request-${state.version}`, at).rewards;
function browser() { const storage = new Map(), events = []; global.window = { dispatchEvent: event => events.push(event.type) }; global.localStorage = { getItem: key => storage.get(`local:${key}`) ?? null, setItem: (key,value) => storage.set(`local:${key}`,value) }; global.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value), key: i => [...storage.keys()][i], get length() { return storage.size; } }; return { storage, events, close() { delete global.window; delete global.localStorage; delete global.sessionStorage; } }; }

test('points cash redemption posts once to the canonical USD wallet and Overview, isolated by customer', () => {
  const env = browser(); try {
    const initial = readWallet('rewards-user').state;
    assert.equal(availablePoints(initial.rewards, now), 345200);
    const event = { kind: 'rewards', key: 'redeem-cash-001', at: now, command: command(initial.rewards, 'redeem_cash', { points: 10000 }), context: context() };
    const next = commitWallet('rewards-user', event);
    assert.equal(next.transfers.accounts.find(a => a.id === 'account-USD').available, '142450.80');
    assert.equal(availablePoints(next.rewards, now), 335200);
    const overview = projectOverview(next, now);
    assert.equal(overview.summary.liquidity, '142450.80');
    assert.equal(overview.transactions.find(t => t.id === event.key).direction, 'incoming');
    assert.equal(commitWallet('rewards-user', event).rewards.version, 1);
    assert.throws(() => commitWallet('rewards-user', { ...event, command: { ...event.command, points: 20000 } }), /already used/);
    assert.equal(readWallet('different-user').state.rewards.version, 0);
    assert.ok(env.events.includes('mbank:wallet-updated'));
    assert.equal(totalCashback(next.rewards), '512.00');
  } finally { env.close(); }
});

test('invalid amounts, stale rate/version and failed persistence leave points and cash unchanged', () => {
  const env = browser(); try {
    const initial = readWallet('rewards-rollback').state;
    for (const points of [-1, 0, 1000.5, NaN, 999, 1000000]) assert.throws(() => applyWalletEvent(initial, { kind: 'rewards', key: 'invalid', at: now, context: context(), command: command(initial.rewards, 'redeem_cash', { points }) }));
    assert.throws(() => applyOfferCommand(initial.rewards, context(), { ...command(initial.rewards, 'redeem_cash', { points: 1000 }), expected_version: 99 }, 'stale', now), /changed/);
    assert.throws(() => applyOfferCommand(initial.rewards, context(), { ...command(initial.rewards, 'redeem_cash', { points: 1000 }), catalog_version: 99 }, 'rate', now), /rate changed/);
    const write = global.sessionStorage.setItem; global.sessionStorage.setItem = () => { throw new Error('quota'); };
    assert.throws(() => commitWallet('rewards-rollback', { kind: 'rewards', key: 'quota-test', at: now, context: context(), command: command(initial.rewards, 'redeem_cash', { points: 1000 }) }), /quota/);
    global.sessionStorage.setItem = write;
    const restored = readWallet('rewards-rollback').state;
    assert.equal(restored.rewards.version, 0); assert.equal(availablePoints(restored.rewards, now), 345200); assert.equal(restored.transfers.accounts[0].available, initial.transfers.accounts[0].available);
  } finally { env.close(); }
});

test('merchant activation enforces plan, current eligible card, offer dates and single enrollment; it never awards cashback', () => {
  const original = rewardsSeed(); const ctx = context();
  const next = apply(original, 'activate', { offer_id: 'hotel', card_id: 'card-usd' });
  assert.equal(availablePoints(next, now), availablePoints(original, now)); assert.equal(totalCashback(next), totalCashback(original));
  assert.equal(next.activations.length, 1);
  assert.throws(() => apply(next, 'activate', { offer_id: 'hotel', card_id: 'card-usd' }), /already activated/);
  ctx.cards[0].eligible = false;
  assert.throws(() => apply(original, 'activate', { offer_id: 'hotel', card_id: 'card-usd' }, now, ctx), /eligible USD card/);
  ctx.cards[0].eligible = true; ctx.membership.plan = 'STANDARD';
  assert.throws(() => apply(original, 'activate', { offer_id: 'hotel', card_id: 'card-usd' }, now, ctx), /membership/);
  assert.throws(() => apply(original, 'activate', { offer_id: 'hotel', card_id: 'card-usd' }, '2027-01-01T00:00:00.000Z'), /no longer available/);
  assert.throws(() => apply(original, 'activate', { offer_id: 'hotel', card_id: 'card-usd' }, '2026-12-31T23:59:59.001Z'), /no longer available/);
  assert.equal(apply(original, 'save', { offer_id: 'hotel', saved: true }).saved_offer_ids.length, 1);
});

test('booking reserves points and cancellation refunds exactly once without manufacturing a confirmed booking', () => {
  const initial = rewardsSeed(); const booked = apply(initial, 'book', { experience_id: 'wine' });
  assert.equal(booked.bookings[0].status, 'pending'); assert.equal(availablePoints(booked, now), 295200);
  assert.throws(() => apply(booked, 'book', { experience_id: 'wine' }), /already have/);
  assert.throws(() => apply(initial, 'book', { experience_id: 'design' }), /no longer available/);
  assert.throws(() => apply(booked, 'cancel_booking', { booking_id: booked.bookings[0].id }, '2026-11-18T12:00:00.000Z'), /deadline/);
  const cancelled = apply(booked, 'cancel_booking', { booking_id: booked.bookings[0].id });
  assert.equal(availablePoints(cancelled, now), 345200); assert.equal(cancelled.bookings[0].status, 'cancelled');
  assert.throws(() => apply(cancelled, 'cancel_booking', { booking_id: cancelled.bookings[0].id }), /unavailable/);
});

test('miles transfer requires valid member number, exact ratio and minimum step; pending holds can be cancelled once', () => {
  const initial = rewardsSeed(); const request = { partner_id: 'flying-blue', member_number: '1234567890', points: 10000 };
  for (const member_number of ['', 'letters123', '123456789']) assert.throws(() => apply(initial, 'transfer_miles', { ...request, member_number }), /membership number/);
  assert.throws(() => apply(initial, 'transfer_miles', { ...request, points: 1500 }), /points amount/);
  const next = apply(initial, 'transfer_miles', request);
  assert.equal(next.transfers[0].status, 'pending'); assert.equal(next.transfers[0].miles, 10000); assert.equal(next.transfers[0].member_last4, '7890');
  assert.ok(!JSON.stringify(next.transfers).includes('1234567890'));
  const restored = apply(next, 'cancel_transfer', { transfer_id: next.transfers[0].id });
  assert.equal(availablePoints(restored, now), 345200);
  assert.throws(() => apply(restored, 'cancel_transfer', { transfer_id: next.transfers[0].id }), /can no longer/);
});

test('FIFO consumption honors point expiration; cancellation cannot restore expired points or inflate the balance', () => {
  const initial = rewardsSeed(); initial.lots = [{ id: 'expiring', remaining: 1000, expires_at: '2026-10-24T00:00:00.000Z' }, { id: 'long-lived', remaining: 4000, expires_at: null }]; initial.entries = [];
  const transferred = apply(initial, 'transfer_miles', { partner_id: 'flying-blue', member_number: '1234567890', points: 2000 });
  assert.equal(transferred.transfers[0].allocations[0].lot_id, 'expiring');
  const restored = apply(transferred, 'cancel_transfer', { transfer_id: transferred.transfers[0].id }, '2026-10-25T12:00:00.000Z');
  assert.equal(availablePoints(restored, '2026-10-25T12:00:00.000Z'), 4000);
  assert.equal(restored.entries[0].points, 1000);
  const projected = projectOffers(initial, context(), '0.00', '2026-10-25T12:00:00.000Z');
  assert.equal(projected.available_points, 4000); assert.equal(projected.entries.filter(e => e.kind === 'expired').length, 1);
  assert.equal(projectOffers(projected, context(), '0.00', '2026-10-26T12:00:00.000Z').entries.filter(e => e.kind === 'expired').length, 1);
});

test('lounge quota reserves one visit, prevents parallel passes, releases on cancellation or expiry, and does not invent next-year allowance', () => {
  const initial = rewardsSeed(); assert.equal(projectOffers(initial, context(), '0.00', now).lounge_remaining, 6);
  const reserved = apply(initial, 'lounge_pass', { lounge_id: 'otp' });
  assert.equal(projectOffers(reserved, context(), '0.00', now).lounge_remaining, 5);
  assert.throws(() => apply(reserved, 'lounge_pass', { lounge_id: 'hnd' }), /active lounge pass/);
  assert.equal(projectOffers(reserved, context(), '0.00', '2026-10-23T14:00:00.000Z').lounge_remaining, 6);
  const restored = apply(reserved, 'cancel_pass', { pass_id: reserved.passes[0].id });
  assert.equal(projectOffers(restored, context(), '0.00', now).lounge_remaining, 6);
  assert.equal(projectOffers(restored, context(), '0.00', '2027-01-01T00:00:00.000Z').lounge_remaining, 0);
});

test('concierge/research are tracked requests, never self-granted investment access; inactive benefits reject new spending', () => {
  const initial = rewardsSeed();
  const next = apply(initial, 'request', { kind: 'research', subject: 'Private equity', details: 'Please explain the eligibility requirements.', service_id: 'private-equity' });
  assert.equal(next.requests[0].status, 'submitted'); assert.equal(availablePoints(next, now), availablePoints(initial, now));
  const closed = apply(next, 'cancel_request', { request_id: next.requests[0].id }); assert.equal(closed.requests[0].status, 'cancelled');
  assert.throws(() => apply(initial, 'request', { kind: 'research', subject: 'Unknown product', details: 'Please explain this product.', service_id: 'invented' }), /not available/);
  const ctx = context(); ctx.membership.active = false;
  assert.throws(() => apply(initial, 'redeem_cash', { points: 1000 }, now, ctx), /active membership/);
  assert.throws(() => apply(initial, 'request', { kind: 'concierge', subject: 'Dinner booking', details: 'A table for two on Friday.', service_id: null }, now, ctx), /Concierge/);
});

test('chart aggregation separates merchant cashback from redeemed points; CSV is scoped and safe for spreadsheets', () => {
  const initial = rewardsSeed(); const next = apply(initial, 'redeem_cash', { points: 1000 });
  const history = rewardHistory(next, now, 6);
  assert.equal(history.at(-1).earned, 100200); assert.equal(history.at(-1).used, 1000); assert.equal(history.at(-1).cashback, 129.5);
  assert.equal(cashReward(1000, context().catalog), '10.00');
  const snapshot = projectOffers(next, context(), '10.00', now); snapshot.entries[0].description = '=HYPERLINK("test")';
  const csv = offersReport(snapshot); assert.ok(csv.includes("'=HYPERLINK")); assert.ok(csv.includes('Available points')); assert.ok(!csv.includes('member_number'));
});

test('demo repository reads shared subscription entitlements on every command and rejects suspended membership', async () => {
  const env = browser(); try {
    const { MOCK_SUBSCRIPTIONS, SUBSCRIPTION_CUSTOMERS } = require('../app/lib/mock/admin/subscriptions.ts');
    const subscription = MOCK_SUBSCRIPTIONS.subscriptions.find(item => item.plan_id === 'METAL' && item.status === 'ACTIVE');
    const customer = SUBSCRIPTION_CUSTOMERS.find(item => item.id === subscription.customer_id);
    const repository = createOffersRepository(customer.email, customer.name);
    const snapshot = await repository.getSnapshot();
    assert.equal(snapshot.membership.source, 'subscription'); assert.equal(snapshot.membership.plan, 'METAL'); assert.equal(snapshot.membership.active, true);
    const suspended = structuredClone(MOCK_SUBSCRIPTIONS); suspended.subscriptions.find(item => item.id === subscription.id).status = 'SUSPENDED';
    global.localStorage.setItem('mbank_subscriptions_v1', JSON.stringify(suspended));
    assert.equal((await repository.getSnapshot()).membership.active, false);
    await assert.rejects(repository.execute(command(snapshot, 'redeem_cash', { points: 1000 }), 'suspended-reward'), /active membership/);
    assert.equal(readWallet(customer.email).state.rewards.version, 0);
    global.localStorage.setItem('mbank_subscriptions_v1', '{invalid');
    await assert.rejects(repository.getSnapshot(), /storage|corrupt/i);
  } finally { env.close(); }
});

test('HTTP adapter uses authenticated customer endpoints and idempotency, rejects malformed snapshots and mixed wallet modes', async () => {
  const oldFetch = global.fetch, oldOffers = process.env.NEXT_PUBLIC_OFFERS_MODE, oldTransfers = process.env.NEXT_PUBLIC_TRANSFERS_MODE;
  try {
    process.env.NEXT_PUBLIC_OFFERS_MODE = 'http'; process.env.NEXT_PUBLIC_TRANSFERS_MODE = 'demo'; assert.throws(() => createOffersRepository('remote'), /same valid service mode/);
    process.env.NEXT_PUBLIC_TRANSFERS_MODE = 'http';
    const snapshot = projectOffers(rewardsSeed(), context(), '142350.80', now); snapshot.mode = 'http'; snapshot.membership.source = 'subscription';
    const calls = []; global.fetch = async (url, options) => { calls.push({url,options}); return { ok: true, json: async () => snapshot }; };
    const repository = createOffersRepository('remote'); await repository.getSnapshot(); await repository.execute(command(snapshot, 'redeem_cash', { points: 1000 }), 'remote-redeem-01');
    assert.equal(calls[0].url, '/v1/me/offers'); assert.equal(calls[1].url, '/v1/me/offers/commands'); assert.equal(calls[1].options.credentials, 'include'); assert.equal(calls[1].options.headers['Idempotency-Key'], 'remote-redeem-01'); assert.ok(!calls[1].options.body.includes('remote'));
    assert.throws(() => parseOffersSnapshot({ ...snapshot, available_points: -1 }), /Invalid/);
    assert.throws(() => parseOffersSnapshot({ ...snapshot, available_points: 1000 }), /Invalid/);
    assert.throws(() => parseOffersSnapshot({ ...snapshot, catalog: { ...snapshot.catalog, policy: { ...snapshot.catalog.policy, cash_points_per_dollar: 0 } } }), /Invalid/);
    global.fetch = async () => ({ ok: false, status: 409, json: async () => ({ error: { message: 'Version conflict' } }) }); await assert.rejects(repository.getSnapshot(), /Version conflict/);
  } finally { global.fetch = oldFetch; if (oldOffers === undefined) delete process.env.NEXT_PUBLIC_OFFERS_MODE; else process.env.NEXT_PUBLIC_OFFERS_MODE = oldOffers; if (oldTransfers === undefined) delete process.env.NEXT_PUBLIC_TRANSFERS_MODE; else process.env.NEXT_PUBLIC_TRANSFERS_MODE = oldTransfers; }
});
