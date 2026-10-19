/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript domain test harness. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '..', request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { socialSeed } = require('../app/lib/social/seed.ts');
const { splitShares, socialTotals, applySocialCommand: apply } = require('../app/lib/social/engine.ts');
const { parseSocialSnapshot: parse } = require('../app/lib/social/response.ts');
const { createDemoSocialRepository, createHttpSocialRepository } = require('../app/lib/social/repository.ts');
const at = '2026-10-19T10:00:00.000Z';
const fid = 'USR-901';

test('seed validates and summaries are derived from open requests with exact cents', () => {
  const seed = socialSeed();
  assert.deepEqual(parse(JSON.parse(JSON.stringify(seed))), seed);
  assert.deepEqual(socialTotals(seed), { receivable: '465.50', payable: '1576.05' });
  const next = apply(seed, { type: 'request', friend_id: fid, amount: '0.10', note: 'Lunch' }, 'request-100', at);
  assert.equal(socialTotals(next).receivable, '465.60');
  assert.equal(socialTotals(seed).receivable, '465.50');
});
test('split conserves every cent, includes payer and creates only friend shares', () => {
  assert.deepEqual(splitShares('10.00', 3), ['3.34', '3.33', '3.33']);
  assert.deepEqual(splitShares('0.05', 3), ['0.02', '0.02', '0.01']);
  const next = apply(socialSeed(), { type: 'split', friend_ids: [fid, 'USR-902'], amount: '10.00', note: 'Dinner' }, 'split-100', at);
  const rows = next.money_requests.filter(r => r.group_id === 'split-100');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(r => r.amount), ['3.33', '3.33']);
  for (const amount of ['-1', '0', '0.001', '1e3', 'NaN', '1000000000']) assert.throws(() => splitShares(amount, 3));
  assert.throws(() => splitShares('0.01', 3));
  assert.throws(() => apply(socialSeed(), { type: 'split', friend_ids: [fid, fid], amount: '10', note: '' }, 'split-200', at));
});
test('invitation lifecycle rejects duplicates, invalid actions and stale requests', () => {
  const seed = socialSeed();
  assert.throws(() => apply(seed, { type: 'invite', username: '@ALExp' }, 'invite-100', at), /already/);
  assert.throws(() => apply(seed, { type: 'invite', username: '@x<script>' }, 'invite-100', at));
  const invited = apply(seed, { type: 'invite', username: 'New_Friend' }, 'invite-100', at);
  assert.equal(invited.connections[0].username, '@new_friend');
  assert.throws(() => apply(invited, { type: 'connection', request_id: 'invite-100', action: 'accept' }, 'accept-100', at));
  const next = apply(seed, { type: 'connection', request_id: 'REQ-301', action: 'accept' }, 'accept-100', at);
  assert.equal(next.friends.length, seed.friends.length + 1);
  assert.equal(next.friends[0].phone, ''); // Never invent a payment destination.
  assert.throws(() => apply(next, { type: 'connection', request_id: 'REQ-301', action: 'accept' }, 'accept-200', at));
  assert.deepEqual(parse(next), next);
});
test('money request ownership, pending removal guard and retained financial history', () => {
  const seed = socialSeed();
  assert.throws(() => apply(seed, { type: 'remove', friend_id: fid }, 'remove-100', at), /Resolve/);
  assert.throws(() => apply(seed, { type: 'cancel_request', request_id: 'money-USR-902' }, 'cancel-100', at));
  const cancelled = apply(seed, { type: 'cancel_request', request_id: `money-${fid}` }, 'cancel-100', at);
  const removed = apply(cancelled, { type: 'remove', friend_id: fid }, 'remove-100', at);
  assert.ok(!removed.friends.some(f => f.id === fid));
  assert.equal(removed.money_requests.find(r => r.friend_id === fid).status, 'cancelled');
  assert.deepEqual(parse(removed), removed);
  const declined = apply(seed, { type: 'decline_request', request_id: 'money-USR-902' }, 'decline-100', at);
  assert.equal(socialTotals(declined).payable, '1510.80');
});
test('untrusted API data rejects malformed money, phone, dates, IDs and dangling open requests', () => {
  for (const mutate of [s => s.friends[0].phone = 'invalid', s => s.money_requests[0].amount = 0.1, s => s.money_requests[0].amount = '0.00', s => s.money_requests[0].friend_id = 'missing', s => s.connections.push(s.connections[0]), s => s.as_of = 'bad']) {
    const seed = socialSeed(); mutate(seed); assert.throws(() => parse(seed), /Invalid/);
  }
});
test('demo is customer-scoped, persists, retries exactly once and preserves corrupted data', async () => {
  const storage = new Map();
  global.window = { dispatchEvent() {} };
  global.sessionStorage = { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) };
  try {
    const command = { type: 'request', friend_id: fid, amount: '0.10', note: '' };
    const repo = createDemoSocialRepository('social-test-a');
    await repo.execute(command, 'request-100');
    await createDemoSocialRepository('social-test-a').execute(command, 'request-100');
    const next = await repo.getSnapshot();
    assert.equal(socialTotals(next).receivable, '465.60');
    next.friends.length = 0;
    assert.equal((await repo.getSnapshot()).friends.length, 8);
    assert.equal(socialTotals(await createDemoSocialRepository('social-test-b').getSnapshot()).receivable, '465.50');
    await assert.rejects(repo.execute({ ...command, amount: '1' }, 'request-100'), /already used/);
    storage.set('mbank_social_v1:broken', '{broken');
    await assert.rejects(createDemoSocialRepository('broken').getSnapshot(), /preserved/);
    assert.equal(storage.get('mbank_social_v1:broken'), '{broken');
    sessionStorage.setItem = () => { throw new Error('Storage unavailable'); };
    await assert.rejects(repo.execute(command, 'request-200'), /Storage unavailable/);
    assert.equal(socialTotals(await repo.getSnapshot()).receivable, '465.60');
  } finally { delete global.window; delete global.sessionStorage; }
});
test('Go HTTP adapter sends authenticated commands, stable keys and abort signals; fails closed', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => socialSeed() }; };
  try {
    const repository = createHttpSocialRepository('https://api.example.test/');
    const controller = new AbortController();
    await repository.getSnapshot(controller.signal);
    const command = { type: 'mute', friend_id: fid, muted: true };
    await repository.execute(command, 'command-100');
    assert.equal(calls[0].url, 'https://api.example.test/v1/me/social');
    assert.equal(calls[0].options.signal, controller.signal);
    assert.equal(calls[1].options.credentials, 'include');
    assert.equal(calls[1].options.headers['Idempotency-Key'], 'command-100');
    assert.deepEqual(JSON.parse(calls[1].options.body), command);
    global.fetch = async () => ({ ok: true, json: async () => ({}) });
    await assert.rejects(repository.getSnapshot(), /Invalid/);
    global.fetch = async () => ({ ok: false, status: 409, json: async () => ({ error: { message: 'Request already resolved' } }) });
    await assert.rejects(repository.execute(command, 'command-100'), /already resolved/);
  } finally { global.fetch = original; }
});

test('directory indexes 10,000 friends and requests once, with bounded pages and exact totals', () => {
  const { indexSocialDirectory, pageOf } = require('../app/lib/social/directory.ts');
  const snapshot = socialSeed();
  snapshot.friends = Array.from({ length: 10000 }, (_, i) => ({ ...snapshot.friends[0], id: `friend-${i}`, name: `Friend ${i}`, username: `@friend_${i}` }));
  snapshot.money_requests = snapshot.friends.map((friend, i) => ({ id: `request-${i}`, friend_id: friend.id, amount: '0.01', currency: 'USD', direction: i % 2 ? 'incoming' : 'outgoing', status: 'pending', note: '', created_at: at }));
  const index = indexSocialDirectory(snapshot);
  assert.equal(index.friends.size, 10000);
  assert.equal(index.balances.size, 10000);
  assert.equal(index.receivable, '50.00');
  assert.equal(index.payable, '50.00');
  const first = pageOf(snapshot.friends, 1, 10);
  const last = pageOf(snapshot.friends, 1000, 10);
  assert.equal(first.rows.length, 10);
  assert.equal(last.rows.length, 10);
  assert.equal(last.rows.at(-1).id, 'friend-9999');
  assert.equal(pageOf(snapshot.friends, 99999, 50).page, 200);
  assert.equal(pageOf([], 99, 10).page, 1);
  assert.equal(pageOf(snapshot.friends, -10, 5).rows.length, 5);
  assert.equal(pageOf(snapshot.friends, 1, 10000).rows.length, 10);
  const withoutFirstPage = snapshot.friends.slice(10);
  assert.equal(pageOf(withoutFirstPage, 1000, 10).page, 999);
});
test('directory search finds names and usernames regardless of case, accents or surrounding spaces', () => {
  const { matchesSocialSearch } = require('../app/lib/social/directory.ts');
  assert.ok(matchesSocialSearch('Cătălina Radu', '@catar', '  CATALINA '));
  assert.ok(matchesSocialSearch('Ștefan Bălan', '@stefb', 'stefan balan'));
  assert.ok(matchesSocialSearch('Diana Marinescu', '@dianam', '@DIANAM'));
  assert.ok(!matchesSocialSearch('Diana Marinescu', '@dianam', 'Robert'));
});
