/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness installs the TypeScript loader before loading domain modules. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '..', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { applyCardCommand, availableCardActions, validateCardLimits } = require('../app/lib/admin/card-issuing.ts');
const { cardRegistryCsv } = require('../app/lib/admin/card-issuing-export.ts');
const { MOCK_CARD_ISSUING_STATE: seed, MOCK_CARD_CUSTOMERS: customers, MOCK_ISSUING_POLICY: policy } = require('../app/lib/mock/admin/card-issuing.ts');
const actor = { name: 'Admin', email: 'operator@example.test', role: 'admin' };
let sequence = 0;
const reason = 'Customer request verified by operations.';
const run = (state, command, operator = actor) => applyCardCommand(state, customers, { reason, ...command }, operator, policy, '2026-10-08T10:00:00Z', prefix => `${prefix}-test-${++sequence}`);
const act = (state, id, action, extra = {}) => run(state, { action, cardId: id, expectedVersion: state.cards.find(c => c.id === id).version, ...extra });
const issue = { action: 'ISSUE', userId: 'USR-1204', type: 'VIRTUAL', network: 'VISA', currency: 'EUR', limits: { daily: 1000, monthly: 5000, atmDaily: 0 } };

test('admin authorization, reason and customer eligibility are enforced', () => {
  assert.throws(() => run(seed, issue, { ...actor, role: 'client' }), /administrator/);
  assert.throws(() => run(seed, { ...issue, reason: 'short' }), /operational reason/);
  for (const userId of ['USR-3426', 'USR-0883']) assert.throws(() => run(seed, { ...issue, userId }), /active account and verified KYC/);
  assert.throws(() => run(seed, { ...issue, userId: 'missing' }), /not found/);
});
test('virtual issuance is pending, masked, immutable and audited', () => {
  const original = structuredClone(seed);
  const next = run(seed, issue);
  assert.deepEqual(seed, original);
  assert.equal(next.cards.length, seed.cards.length + 1);
  const card = next.cards[0];
  assert.equal(card.status, 'PENDING'); assert.equal(card.delivery, 'NOT_REQUIRED');
  assert.equal(card.channels.atm, false); assert.equal(card.channels.contactless, false);
  assert.match(card.last4, /^\d{4}$/); assert.equal(card.pan, undefined); assert.equal(card.cvv, undefined);
  assert.equal(next.audit[0].actor, actor.email); assert.equal(next.audit[0].after.id, card.id);
  assert.equal(act(next, card.id, 'ACTIVATE').cards[0].status, 'ACTIVE');
});
test('physical card must be dispatched and delivered before activation', () => {
  let state = run(seed, { ...issue, type: 'PHYSICAL', limits: policy.defaultLimits });
  const id = state.cards[0].id;
  assert.throws(() => act(state, id, 'ACTIVATE'), /not allowed/);
  assert.throws(() => act(state, id, 'DISPATCH', { trackingReference: 'x' }), /tracking/);
  state = act(state, id, 'DISPATCH', { trackingReference: 'TRACK-12345' });
  assert.throws(() => act(state, id, 'ACTIVATE'), /not allowed/);
  state = act(state, id, 'DELIVER'); state = act(state, id, 'ACTIVATE');
  assert.equal(state.cards[0].status, 'ACTIVE'); assert.equal(state.cards[0].trackingReference, 'TRACK-12345');
});
test('freeze is reversible; permanent block and closure cannot be reversed', () => {
  let state = act(seed, 'CRD-1001', 'FREEZE');
  state = act(state, 'CRD-1001', 'UNFREEZE');
  state = act(state, 'CRD-1001', 'BLOCK');
  assert.throws(() => act(state, 'CRD-1001', 'ACTIVATE'), /not allowed/);
  assert.throws(() => act(state, 'CRD-1001', 'UNFREEZE'), /not allowed/);
  state = act(state, 'CRD-1001', 'TERMINATE');
  assert.deepEqual(availableCardActions(state.cards.find(c => c.id === 'CRD-1001'), customers[0]), []);
  assert.throws(() => act(state, 'CRD-1001', 'REPLACE'), /not allowed/);
});
test('stale dialog versions cannot overwrite newer operations', () => {
  const state = act(seed, 'CRD-1001', 'FREEZE');
  assert.throws(() => run(state, { action: 'BLOCK', cardId: 'CRD-1001', expectedVersion: 1 }), /another operation/);
});
test('replacement atomically closes source and preserves restrictions with linked audit', () => {
  const source = { ...seed.cards[0], channels: { online: false, atm: false, contactless: true, international: false } };
  const state = { ...seed, cards: seed.cards.map(c => c.id === source.id ? source : c) };
  const next = act(state, source.id, 'REPLACE'); const replacement = next.cards[0];
  const old = next.cards.find(c => c.id === source.id);
  assert.equal(old.status, 'TERMINATED'); assert.equal(old.replacedByCardId, replacement.id);
  assert.equal(replacement.replacesCardId, old.id); assert.equal(replacement.status, 'PENDING');
  assert.deepEqual(replacement.channels, source.channels); assert.deepEqual(replacement.limits, source.limits);
  assert.equal(next.audit[0].before.status, 'ACTIVE'); assert.equal(next.audit[0].after.replacedByCardId, replacement.id);
});
test('open-card maximum blocks issuance while allowing one-for-one replacement', () => {
  const source = seed.cards[0];
  const state = { ...seed, cards: Array.from({ length: 5 }, (_, i) => ({ ...source, id: `limit-${i}` })) };
  assert.throws(() => run(state, issue), /5 open cards/);
  const next = act(state, 'limit-0', 'REPLACE');
  assert.equal(next.cards.filter(c => c.status !== 'TERMINATED').length, 5);
});
test('limits reject nonfinite amounts, excess precision, ATM misuse and amounts below spent', () => {
  for (const daily of [NaN, Infinity, -1, 0, 1000.001, 6000]) assert.throws(() => validateCardLimits({ ...issue.limits, daily }, 'VIRTUAL', policy));
  assert.throws(() => validateCardLimits({ ...issue.limits, atmDaily: 1 }, 'VIRTUAL', policy), /ATM/);
  assert.throws(() => validateCardLimits({ daily: 100, monthly: 5000, atmDaily: 0 }, 'PHYSICAL', policy, seed.cards[0]), /already spent/);
  assert.throws(() => act(seed, 'CRD-1002', 'UPDATE_CONTROLS', { limits: issue.limits, channels: { online: true, atm: true, contactless: false, international: true } }), /Virtual cards/);
});
test('blocked customer can only have existing blocked card closed', () => {
  const card = seed.cards.find(c => c.id === 'CRD-1005');
  assert.deepEqual(availableCardActions(card, customers.find(c => c.id === card.userId)), ['TERMINATE']);
});
test('CSV exports only supplied rows, masks cards and escapes spreadsheet formulas', () => {
  const csv = cardRegistryCsv([seed.cards[0]], [{ ...customers.find(c => c.id === seed.cards[0].userId), name: '=HYPERLINK("bad")' }]);
  assert.match(csv, /\*\*\*\* 4821/); assert.ok(!csv.includes('9073')); assert.ok(csv.includes("'=HYPERLINK")); assert.ok(csv.includes('""bad""'));
});
test('mock store persists atomically and rejects corrupted or unavailable storage', () => {
  const { executeMockCardCommand, getCardStorageWarning } = require('../app/lib/admin/mock-card-issuing-store.ts');
  let saved = null;
  global.localStorage = { getItem: () => saved, setItem: (_, value) => { saved = value; } };
  const next = executeMockCardCommand({ ...issue, reason }, actor);
  assert.equal(JSON.parse(saved).cards[0].id, next.cards[0].id);
  const previous = saved;
  global.localStorage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => executeMockCardCommand({ action: 'ACTIVATE', cardId: next.cards[0].id, expectedVersion: 1, reason }, actor), /no changes were applied/);
  assert.equal(saved, previous);
  saved = '{broken';
  assert.throws(() => executeMockCardCommand({ ...issue, reason }, actor), /could not be restored/);
  assert.match(getCardStorageWarning(), /could not be restored/);
  saved = JSON.stringify({ ...seed, audit: [{ ...seed.audit[0], timestamp: 'invalid' }] });
  assert.throws(() => executeMockCardCommand({ ...issue, reason }, actor), /could not be restored/);
});
