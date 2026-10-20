/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '..', request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { applyCustomerCardCommand, applyCardCommand, customerCardActions } = require('../app/lib/admin/card-issuing.ts');
const { MOCK_CARD_ISSUING_STATE: seed, MOCK_CARD_CUSTOMERS: customers, MOCK_ISSUING_POLICY: policy } = require('../app/lib/mock/admin/card-issuing.ts');
const { CARD_ACTIVITY, cardAnalytics, cardBudgetSeries } = require('../app/lib/cards/activity.ts');
const { createCardsRepository, parseCardsSnapshot } = require('../app/lib/cards/repository.ts');
const email = customers[0].email;
const run = (state, command, customer = email) => applyCustomerCardCommand(state, customers, command, customer, policy, '2026-10-20T12:00:00Z', prefix => prefix + '-test');
const command = (action, card = seed.cards[0]) => ({ action, card_id: card.id, expected_version: card.version });
const issue = { action: 'ISSUE', type: 'VIRTUAL', network: 'VISA', currency: 'EUR' };
const admin = { name: 'Operations', email: 'ops@example.com', role: 'admin' };
const adminRun = (state, action, card, extra = {}) => applyCardCommand(state, customers, { action, cardId: card.id, expectedVersion: card.version, reason: 'Verified operations card security review.', ...extra }, admin, policy, '2026-10-20T12:01:00Z', p => p + '-ops');

test('ownership, enrollment and KYC restrict customer commands', () => {
  assert.throws(() => run(seed, command('FREEZE', seed.cards[2])), /restricted/);
  assert.throws(() => run(seed, issue, 'unknown@example.com'), /enrollment/);
  assert.throws(() => run(seed, issue, customers.find(c => c.kycStatus === 'IN_REVIEW').email), /verified KYC/);
  assert.throws(() => run(seed, issue, customers.find(c => c.accountStatus === 'BLOCKED').email), /verified KYC/);
});
test('own freeze is reversible, operations freezes and permanent restrictions are not', () => {
  const frozen = run(seed, command('FREEZE'));
  assert.equal(frozen.cards[0].status, 'FROZEN');
  assert.equal(frozen.audit[0].actor, email);
  const unfrozen = run(frozen, command('UNFREEZE', frozen.cards[0]));
  assert.equal(unfrozen.cards[0].status, 'ACTIVE');
  const ops = adminRun(seed, 'FREEZE', seed.cards[0]);
  assert.throws(() => run(ops, command('UNFREEZE', ops.cards[0])), /restricted/);
  assert.throws(() => run(seed, command('ACTIVATE', seed.cards[5])), /restricted/);
  assert.throws(() => run(frozen, command('UNFREEZE')), /another operation/);
});
test('customer controls preserve approved ceilings, channels and spent minimum', () => {
  const card = seed.cards[0], limits = { daily: 500, monthly: 3000, atmDaily: 100 }, channels = { ...card.channels, online: false };
  const reduced = run(seed, { ...command('UPDATE_CONTROLS'), limits, channels });
  assert.equal(reduced.cards[0].channels.online, false);
  const restored = run(reduced, { ...command('UPDATE_CONTROLS', reduced.cards[0]), limits: card.limits, channels: card.channels });
  assert.deepEqual(restored.cards[0].limits, card.limits);
  assert.throws(() => run(seed, { ...command('UPDATE_CONTROLS'), limits: { ...card.limits, monthly: 20000 }, channels: card.channels }), /approved/);
  assert.throws(() => run(seed, { ...command('UPDATE_CONTROLS'), limits: { ...card.limits, monthly: 1500 }, channels: card.channels }), /limit|spent/);
  const restricted = adminRun(seed, 'UPDATE_CONTROLS', card, { limits, channels });
  assert.throws(() => run(restricted, { ...command('UPDATE_CONTROLS', restricted.cards[0]), limits: card.limits, channels: card.channels }), /approved/);
});
test('issue and activation use shared registry and physical delivery lifecycle', () => {
  const next = run(seed, issue), card = next.cards[0];
  assert.equal(card.userId, customers[0].id); assert.equal(card.status, 'PENDING'); assert.equal(card.cvv, undefined);
  assert.equal(run(next, command('ACTIVATE', card)).cards[0].status, 'ACTIVE');
  const physical = run(seed, { ...issue, type: 'PHYSICAL' });
  assert.throws(() => run(physical, command('ACTIVATE', physical.cards[0])), /restricted/);
  assert.deepEqual(customerCardActions(seed, seed.cards[2], customers[1]), ["TERMINATE"]);
});
test('chart points and categories reconcile to the selected ledger and respect dates/status', () => {
  const tx = CARD_ACTIVITY.filter(t => t.card_id === 'CRD-1001');
  const data = cardAnalytics(tx, '2026-10-20T12:00:00Z', 30);
  assert.equal(data.points.length, 30); assert.equal(data.total, 1840); assert.equal(data.count, 4);
  assert.equal(data.categories.reduce((sum, c) => sum + c.value, 0), data.total);
  assert.equal(data.points.reduce((sum, p) => sum + p.spent, 0), data.total);
  assert.equal(cardAnalytics(tx, '2026-10-20T12:00:00Z', 7).total, 0);
  assert.equal(cardAnalytics([...tx, { ...tx[0], status: 'PENDING' }, { ...tx[0], occurred_at: '2027-01-01T00:00:00Z' }], '2026-10-20T12:00:00Z', 30).total, 1840);
});
test('repository shares admin persistence, rejects corrupt state and deduplicates retries', async () => {
  let raw = null;
  global.localStorage = { getItem: key => key === "mbank_admin_card_issuing_v1" ? raw : null, setItem: (_, value) => { raw = value; } };
  const repository = createCardsRepository(email);
  const initial = await repository.getSnapshot();
  assert.equal(initial.cards.length, 4); assert.ok(initial.cards.some(c => c.id.startsWith("CRD-DEMO-"))); assert.ok(initial.cards.every(c => c.userId === customers[0].id));
  assert.ok(initial.activity.every(t => initial.cards.some(c => c.id === t.card_id)));
  let updated = await repository.execute(issue, 'test-issue-key');
  const count = updated.cards.length;
  updated = await repository.execute(issue, 'test-issue-key'); assert.equal(updated.cards.length, count);
  assert.throws(() => parseCardsSnapshot({ ...initial, cards: [{ ...initial.cards[0], userId: 'other' }] }), /Invalid/);
  assert.equal(parseCardsSnapshot(initial).schema_version, 1);
  const { executeMockCardCommand } = require('../app/lib/admin/mock-card-issuing-store.ts');
  const current = updated.cards.find(c => c.id === 'CRD-1001');
  executeMockCardCommand({ action: 'FREEZE', cardId: current.id, expectedVersion: current.version, reason: 'Operations requested security review.' }, admin);
  updated = await repository.getSnapshot();
  assert.equal(updated.cards.find(c => c.id === current.id).status, 'FROZEN');
  assert.ok(!updated.permissions[current.id].includes('UNFREEZE'));
  raw = '{broken'; await assert.rejects(repository.getSnapshot(), /could not be restored/);
  delete global.localStorage;
});

test('every signed-in customer can open Cards Vault and order, including accounts outside demo seeds', async () => {
  let raw = null;
  global.localStorage = { getItem: key => key === 'mbank_admin_card_issuing_v1' ? raw : null, setItem: (_, value) => { raw = value; } };
  const email = 'any.logged.in.customer@example.com';
  const repository = createCardsRepository(email, 'Any Customer');
  let state = await repository.getSnapshot();
  assert.equal(state.customer.email, email); assert.equal(state.customer.name, 'Any Customer');
  assert.equal(state.customer.accountStatus, 'ACTIVE'); assert.equal(state.cards.length, 1); assert.match(state.cards[0].id, /^CRD-DEMO-/); assert.equal(state.activity.length, 12);
  const id = state.customer.id;
  assert.equal((await repository.getSnapshot()).customer.id, id);
  state = await repository.execute(issue, 'new-customer-first-card');
  assert.equal(state.cards.length, 2); assert.equal(state.cards[0].userId, id);
  const { readCardIssuingState, cardCustomers, executeMockCardCommand } = require('../app/lib/admin/mock-card-issuing-store.ts');
  assert.ok(cardCustomers(readCardIssuingState()).some(c => c.id === id));
  executeMockCardCommand({ action: 'ACTIVATE', cardId: state.cards[0].id, expectedVersion: 1, reason: 'Verified new customer card activation.' }, admin);
  state = await repository.getSnapshot(); assert.equal(state.cards[0].status, 'ACTIVE');
  const another = await createCardsRepository('another.customer@example.com').getSnapshot();
  assert.equal(another.cards.length, 1); assert.equal(another.cards[0].userId, another.customer.id); assert.notEqual(another.customer.id, id);
  delete global.localStorage;
});

test('HTTP adapter uses session endpoints, concurrency fields and idempotency without demo fallback', async () => {
  const previousMode = process.env.NEXT_PUBLIC_CARDS_MODE, previousFetch = global.fetch;
  process.env.NEXT_PUBLIC_CARDS_MODE = 'http';
  const calls = [];
  const payload = { schema_version: 1, as_of: '2026-10-20T12:00:00Z', customer: customers[0], cards: [seed.cards[0]], activity: CARD_ACTIVITY.filter(t => t.card_id === seed.cards[0].id), funding_accounts: [], audit: [], policy, permissions: { 'CRD-1001': ['FREEZE', 'UPDATE_CONTROLS'] } };
  global.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => payload }; };
  try {
    const repository = createCardsRepository(email);
    await repository.getSnapshot(); await repository.execute(command('FREEZE'), 'http-command-key');
    assert.equal(calls[0].url, '/v1/me/cards'); assert.equal(calls[0].options.credentials, 'include');
    assert.equal(calls[1].url, '/v1/me/cards/commands'); assert.equal(calls[1].options.headers['Idempotency-Key'], 'http-command-key');
    assert.equal(JSON.parse(calls[1].options.body).expected_version, 1);
    global.fetch = async () => ({ ok: false, status: 409, json: async () => ({ error: { message: 'Card version changed.' } }) });
    await assert.rejects(repository.execute(command('FREEZE'), 'conflict'), /version changed/);
  } finally { global.fetch = previousFetch; if (previousMode === undefined) delete process.env.NEXT_PUBLIC_CARDS_MODE; else process.env.NEXT_PUBLIC_CARDS_MODE = previousMode; }
});


test('monthly budget is cumulative, reconciles opening usage and never invents future spending', () => {
  const activity = CARD_ACTIVITY.filter(tx => tx.card_id === 'CRD-1001');
  const points = cardBudgetSeries(activity, '2026-10-20T12:00:00Z', 1840);
  assert.equal(points.length, 31);
  assert.equal(points[19].spent, 1840); assert.equal(points[20].spent, null);
  const actual = points.filter(point => point.spent !== null);
  assert.ok(actual.every((point, index) => !index || point.spent >= actual[index - 1].spent));
  assert.equal(cardBudgetSeries([], '2026-10-20T12:00:00Z', 450)[19].spent, 450);
});

test('demo ATM and contactless controls can be enabled, persisted and disabled without overriding operations', async () => {
  let raw = null;
  global.localStorage = { getItem: key => key === 'mbank_admin_card_issuing_v1' ? raw : null, setItem: (_, value) => { raw = value; } };
  try {
    const repository = createCardsRepository('controls.demo@example.com', 'Controls Demo');
    let snapshot = await repository.getSnapshot(), card = snapshot.cards[0];
    assert.equal(card.type, 'PHYSICAL');
    snapshot = await repository.execute({ action: 'UPDATE_CONTROLS', card_id: card.id, expected_version: card.version, limits: card.limits, channels: { ...card.channels, atm: true, contactless: true } }, 'enable-demo-channels');
    card = snapshot.cards[0]; assert.equal(card.channels.atm, true); assert.equal(card.channels.contactless, true);
    const details = await repository.revealDetails(card.id);
    assert.equal(details.pan, '4242 4242 4242 4242'); assert.equal(details.cvv, '123');
    assert.ok(!raw.includes(details.pan)); assert.ok(!raw.includes('"cvv"'));
    await assert.rejects(repository.revealDetails('another-card'), /unavailable/);
    snapshot = await repository.execute({ action: 'UPDATE_CONTROLS', card_id: card.id, expected_version: card.version, limits: card.limits, channels: { ...card.channels, atm: false, contactless: false } }, 'disable-demo-channels');
    assert.equal(snapshot.cards[0].channels.atm, false);
    const { executeMockCardCommand } = require('../app/lib/admin/mock-card-issuing-store.ts');
    card = snapshot.cards[0];
    executeMockCardCommand({ action: 'UPDATE_CONTROLS', cardId: card.id, expectedVersion: card.version, reason: 'Operations restricted demo payment controls.', limits: card.limits, channels: { ...card.channels, contactless: false } }, admin);
    card = (await repository.getSnapshot()).cards[0];
    await assert.rejects(repository.execute({ action: 'UPDATE_CONTROLS', card_id: card.id, expected_version: card.version, limits: card.limits, channels: { ...card.channels, contactless: true } }, 'restricted-demo-channel'), /approved/);
  } finally { delete global.localStorage; }
});

test('10000 payments render only one bounded page inside a scroll region', () => {
  require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
  const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
  const VaultActivity = require('../app/components/ui/cards/VaultActivity.tsx').default;
  const activity = Array.from({ length: 10000 }, (_, index) => ({ ...CARD_ACTIVITY[0], id: `load-${index}`, merchant: `Sample merchant ${index}` }));
  const html = renderToStaticMarkup(React.createElement(VaultActivity, { activity, last4: '4242' }));
  assert.equal((html.match(/Sample merchant /g) ?? []).length, 20);
  assert.match(html, /overflow-y-auto/); assert.match(html, /h-80/); assert.match(html, /10000 payments/);
});


test('customer deletion permanently closes only their card and retains ledger and audit', async () => {
  const closed = run(seed, command('TERMINATE'));
  assert.equal(closed.cards[0].status, 'TERMINATED');
  assert.equal(closed.cards[0].version, seed.cards[0].version + 1);
  assert.equal(closed.cards.length, seed.cards.length);
  assert.equal(closed.audit[0].action, 'TERMINATE'); assert.equal(closed.audit[0].actor, email);
  assert.deepEqual(customerCardActions(closed, closed.cards[0], customers[0]), []);
  assert.throws(() => run(closed, command('ACTIVATE', closed.cards[0])), /restricted/);
  assert.throws(() => run(closed, command('TERMINATE')), /restricted/);
  assert.throws(() => run(seed, command('TERMINATE', seed.cards[2])), /restricted/);
  const frozen = run(seed, command('FREEZE'));
  assert.throws(() => run(frozen, command('TERMINATE')), /another operation/);

  let raw = null;
  global.localStorage = { getItem: key => key === 'mbank_admin_card_issuing_v1' ? raw : null, setItem: (_, value) => { raw = value; } };
  try {
    const repository = createCardsRepository('closure.test@example.com', 'Closure Test');
    const before = await repository.getSnapshot(), card = before.cards[0];
    assert.equal(card.currency, 'USD'); assert.ok(before.activity.every(tx => tx.currency === 'USD'));
    const draft = { action: 'TERMINATE', card_id: card.id, expected_version: card.version };
    const after = await repository.execute(draft, 'close-demo');
    assert.equal(after.cards.length, 0); assert.equal(after.activity.length, 0);
    assert.deepEqual(after.funding_accounts, before.funding_accounts);
    assert.equal((await repository.getSnapshot()).cards.length, 0);
    const { readCardIssuingState } = require('../app/lib/admin/mock-card-issuing-store.ts');
    const persisted = readCardIssuingState(), deleted = persisted.cards.find(item => item.id === card.id);
    assert.equal(deleted.status, 'TERMINATED'); assert.ok(deleted.customerDeletedAt);
    assert.ok(persisted.audit.some(entry => entry.cardId === card.id && entry.action === 'TERMINATE'));
    const retry = await repository.execute(draft, 'close-demo'); assert.equal(retry.cards.length, 0); assert.equal(readCardIssuingState().audit.length, persisted.audit.length);
    await assert.rejects(repository.revealDetails(card.id), /unavailable/);
  } finally { delete global.localStorage; }
});

test('payments and security pagination reach pages two and three, including partial final pages', () => {
  const { cardPage } = require('../app/lib/cards/pagination.ts');
  const rows = Array.from({ length: 41 }, (_, index) => index);
  const first = cardPage(rows, 0), second = cardPage(rows, 1), third = cardPage(rows, 2);
  assert.equal(first.pages, 3); assert.equal(first.rows.length, 20); assert.equal(first.hasPrevious, false); assert.equal(first.hasNext, true);
  assert.equal(second.page, 1); assert.equal(second.rows[0], 20); assert.equal(second.rows.length, 20); assert.ok(second.hasPrevious && second.hasNext);
  assert.deepEqual(third.rows, [40]); assert.equal(third.hasNext, false); assert.equal(third.hasPrevious, true);
  assert.equal(cardPage(rows, 999).page, 2); assert.equal(cardPage([], 2).page, 0); assert.equal(cardPage(rows.slice(0, 3), 2).pages, 1);
  assert.deepEqual([...first.rows, ...second.rows, ...third.rows], rows);
});

test('both payments table and security modal show three pages when there are 41 records', () => {
  const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
  const VaultActivity = require('../app/components/ui/cards/VaultActivity.tsx').default;
  const activity = Array.from({ length: 41 }, (_, index) => ({ ...CARD_ACTIVITY[0], id: `pages-${index}`, merchant: `Payment row ${index}` }));
  const table = renderToStaticMarkup(React.createElement(VaultActivity, { activity, last4: '4242' }));
  assert.match(table.replace(/<[^>]*>/g, ''), /1 \/ 3/);
  assert.equal((table.match(/Payment row /g) ?? []).length, 20);
  const originalCssLoader = require.extensions['.css'];
  require.extensions['.css'] = module => { module.exports = { default: {} }; };
  try {
    const VaultSecurityDialog = require('../app/components/ui/cards/VaultSecurityDialog.tsx').default;
    const audit = Array.from({ length: 41 }, (_, index) => ({ ...seed.audit[0], id: `audit-pages-${index}`, cardId: seed.cards[0].id, reason: `Security row ${index}` }));
    const modal = renderToStaticMarkup(React.createElement(VaultSecurityDialog, { audit, card: seed.cards[0], email, onClose() {} }));
    assert.match(modal.replace(/<[^>]*>/g, ''), /Page 1 of 3/);
    assert.equal((modal.match(/Security row /g) ?? []).length, 20);
    const { cardMoney } = require('../app/components/ui/cards/VaultAnalytics.tsx');
    assert.equal(cardMoney(1840, 'USD'), '$1,840.00');
  } finally { if (originalCssLoader) require.extensions['.css'] = originalCssLoader; else delete require.extensions['.css']; }
});

test('existing EUR demo migrates to USD without resetting preferences or resurrecting deleted cards', async () => {
  let raw = null;
  global.localStorage = { getItem: key => key === 'mbank_admin_card_issuing_v1' ? raw : null, setItem: (_, value) => { raw = value; } };
  try {
    const repository = createCardsRepository('migration.demo@example.com', 'Migration Demo');
    const first = await repository.getSnapshot(), original = first.cards[0];
    const saved = JSON.parse(raw), card = saved.cards.find(item => item.id === original.id);
    card.currency = 'EUR'; card.channels.contactless = true; card.channels.atm = false; card.limits.atmDaily = 100;
    card.status = 'TERMINATED'; card.customerDeletedAt = '2026-10-20T10:00:00Z';
    raw = JSON.stringify(saved);
    const result = await repository.getSnapshot();
    assert.equal(result.cards.length, 0);
    const migrated = JSON.parse(raw).cards.find(item => item.id === original.id);
    assert.equal(migrated.currency, 'USD'); assert.equal(migrated.channels.contactless, true); assert.equal(migrated.channels.atm, false);
    assert.equal(migrated.limits.atmDaily, 100); assert.equal(migrated.status, 'TERMINATED'); assert.equal(migrated.customerDeletedAt, card.customerDeletedAt);
    const { cardPage } = require('../app/lib/cards/pagination.ts');
    assert.equal(cardPage(Array(21).fill(0), 0).pages, 2);
  } finally { delete global.localStorage; }
});
