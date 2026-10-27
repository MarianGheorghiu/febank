/* eslint-disable @typescript-eslint/no-require-imports -- Executes the TypeScript credit domain without a test dependency. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(__dirname, '..', request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { createCreditRepository } = require('../app/lib/loans/repository.ts');
const { estimateCredit, amortize, dueDate, applyCredit, projectCredit } = require('../app/lib/loans/engine.ts');
const { creditSeed, demoFunds } = require('../app/lib/loans/seed.ts');
const { readWallet } = require('../app/lib/wallet/store.ts');
const { createOverviewRepository } = require('../app/lib/overview/repository.ts');
const { createDemoTransferRepository } = require('../app/lib/transfers/repository.ts');
const { units } = require('../app/lib/transfers/engine.ts');
const { creditReport } = require('../app/lib/loans/report.ts');
const { validateCreditSnapshot } = require('../app/lib/loans/response.ts');
const personal = 'personal', business = 'business:demo-company';
const command = (snapshot, action, fields = {}, scope = personal) => ({ scope, expected_version: snapshot.version, action, ...fields });
const term = { kind: 'term', product_id: 'personal-PERSONAL', amount: '1000.00', months: 12, purpose: 'Home improvements' };
function browser() {
  const storage = new Map(), events = [];
  global.window = { dispatchEvent: event => events.push(event.type) };
  global.localStorage = { getItem: key => storage.get(`local:${key}`) ?? null, setItem: (key, value) => storage.set(`local:${key}`, value) };
  global.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), key: index => [...storage.keys()][index], get length() { return storage.size; } };
  return { storage, events, close() { delete global.window; delete global.sessionStorage; delete global.localStorage; } };
}

test('draw, repay and loan prepayment settle once against the shared wallet and Overview credit', async () => {
  const env = browser(); try {
    const repository = createCreditRepository('credit-customer'); const overview = createOverviewRepository('credit-customer');
    const start = await repository.getSnapshot();
    const draw = command(start, 'draw', { facility_id: 'buffer', amount: '250.25' });
    const next = await repository.execute(draw, 'credit-draw-0001');
    assert.equal(next.personal_cash, '142601.05'); assert.equal((await overview.getSnapshot()).summary.credit, '12750.25');
    assert.equal((await repository.execute(draw, 'credit-draw-0001')).personal_cash, next.personal_cash);
    await assert.rejects(repository.execute({ ...draw, amount: '250.26' }, 'credit-draw-0001'), /already used/);
    const repaid = await repository.execute(command(next, 'repay_facility', { facility_id: 'buffer', amount: '1500.25' }), 'credit-repay-001');
    assert.equal(repaid.personal_cash, '141100.80'); assert.equal(repaid.facilities[0].drawn, '0.00');
    const paidLoan = await repository.execute(command(repaid, 'repay_loan', { loan_id: 'loan-personal', amount: '11250.00' }), 'credit-close-001');
    assert.equal((await overview.getSnapshot()).summary.credit, '0.00'); assert.equal(paidLoan.loans[0].principal, '0.00');
    const report = await overview.getSnapshot();
    assert.equal(report.summary.liquidity, paidLoan.personal_cash);
    assert.equal(report.transactions.find(row => row.id === 'credit-close-001').direction, 'outgoing');
    assert.ok(env.events.includes('mbank:wallet-updated'));
    assert.equal((await createCreditRepository('credit-customer').getSnapshot()).version, 3);
    assert.equal((await createCreditRepository('another-customer').getSnapshot()).version, 0);
  } finally { env.close(); }
});

test('business draw and repayment never debit personal cash; forged scope and product access fail', async () => {
  const repository = createCreditRepository('business-customer'); const initial = await repository.getSnapshot();
  const drawn = await repository.execute(command(initial, 'draw', { facility_id: 'facility-REVOLVING', amount: '400.01' }, business), 'business-draw-01');
  assert.equal(drawn.businesses[0].cash, '85400.01'); assert.equal(drawn.personal_cash, initial.personal_cash);
  const next = await repository.execute(command(drawn, 'repay_facility', { facility_id: 'facility-REVOLVING', amount: '400.01' }, business), 'business-repay-01');
  assert.equal(next.businesses[0].cash, initial.businesses[0].cash);
  await assert.rejects(repository.execute(command(next, 'draw', { facility_id: 'buffer', amount: '1.00' }, business), 'business-forged1'), /unavailable/);
  await assert.rejects(repository.execute(command(next, 'apply', { draft: term }, business), 'business-forged2'), /unavailable/);
  await assert.rejects(repository.execute(command(next, 'matching', { enabled: true, anonymous: true }, 'business:unknown'), 'business-forged3'), /access/);
  const noBusiness = creditSeed(); noBusiness.businesses = [];
  assert.throws(() => applyCredit(noBusiness, readWallet('test').state.transfers.accounts, command(initial, 'matching', { enabled: true, anonymous: true }, business), 'membership', initial.as_of), /access/);
});

test('failed limits, stale versions, insufficient funds and storage quota cannot partially commit', async () => {
  const env = browser(); try {
    const repository = createCreditRepository('rollback-customer'); const snapshot = await repository.getSnapshot();
    await assert.rejects(repository.execute(command(snapshot, 'draw', { facility_id: 'buffer', amount: '3750.01' }), 'over-limit-0001'), /exceeds/);
    await assert.rejects(repository.execute(command(snapshot, 'buffer_toggle', { enabled: false }), 'bad-toggle-0001'), /Repay/);
    await assert.rejects(repository.execute(command(snapshot, 'draw', { facility_id: 'buffer', amount: 'NaN' }), 'bad-amount-0001'), /decimal/);
    assert.equal((await repository.getSnapshot()).version, 0);
    const saved = global.sessionStorage.setItem;
    global.sessionStorage.setItem = () => { throw new Error('Quota exceeded'); };
    await assert.rejects(repository.execute(command(snapshot, 'draw', { facility_id: 'buffer', amount: '10.00' }), 'quota-test-0001'), /Quota/);
    global.sessionStorage.setItem = saved;
    assert.equal((await repository.getSnapshot()).personal_cash, snapshot.personal_cash);
    const updated = await repository.execute(command(snapshot, 'draw', { facility_id: 'buffer', amount: '1.00' }), 'valid-draw-0001');
    await assert.rejects(repository.execute(command(snapshot, 'draw', { facility_id: 'buffer', amount: '1.00' }), 'stale-draw-0001'), /changed/);
    const before = JSON.stringify(await repository.getSnapshot());
    await assert.rejects(repository.execute(command(updated, 'repay_facility', { facility_id: 'facility-REVOLVING', amount: '140000.00' }, business), 'insufficient-biz'), /Insufficient business/);
    assert.equal((await repository.getSnapshot()).version, updated.version); assert.ok(before.includes(updated.personal_cash));
  } finally { env.close(); }
});

test('applications stay pending without releasing cash, and factoring holds release on cancellation', async () => {
  const repository = createCreditRepository('applications-customer'); let snapshot = await repository.getSnapshot();
  snapshot = await repository.execute(command(snapshot, 'apply', { draft: term }), 'term-apply-0001');
  assert.equal(snapshot.personal_cash, '142350.80'); assert.equal(snapshot.loans.length, 2); assert.equal(snapshot.applications[0].status, 'submitted');
  const factored = await repository.execute(command(snapshot, 'apply', { draft: { kind: 'factoring', invoice_ids: ['inv-01', 'inv-02'] } }, business), 'factor-apply-001');
  assert.equal(factored.applications[0].estimate.currency, 'RON'); assert.equal(factored.applications[0].estimate.amount, '146025.00');
  assert.equal(factored.applications[0].estimate.cost, '2475.00'); assert.equal(factored.invoices[0].status, 'requested');
  assert.equal(factored.businesses[0].cash, '85000.00');
  await assert.rejects(repository.execute(command(factored, 'apply', { draft: { kind: 'factoring', invoice_ids: ['inv-01'] } }, business), 'factor-apply-002'), /eligible/);
  const cancelled = await repository.execute(command(factored, 'cancel', { application_id: factored.applications[0].id }, business), 'factor-cancel-01');
  assert.equal(cancelled.invoices[0].status, 'eligible'); assert.equal(cancelled.applications[0].status, 'cancelled');
  const at = '2027-01-01T12:00:00Z';
  assert.throws(() => estimateCredit(cancelled, cancelled.collateral, business, { kind: 'factoring', invoice_ids: ['inv-01'] }, at), /overdue/);
  assert.throws(() => estimateCredit(cancelled, cancelled.collateral, business, { kind: 'factoring', invoice_ids: ['inv-01', 'inv-01'] }, snapshot.as_of), /distinct/);
});

test('Lombard uses shared available positions and excludes pending selections and ineligible holdings', async () => {
  const env = browser(); try {
  const repository = createCreditRepository('collateral-customer'); const snapshot = await repository.getSnapshot();
  const btc = snapshot.collateral.find(asset => asset.symbol === 'BTC');
  const sol = snapshot.collateral.find(asset => asset.symbol === 'SOL');
  const draft = { kind: 'lombard', asset_ids: [btc.id], amount: '1000.00', months: 12, purpose: 'Fund renovation' };
  const estimate = estimateCredit(snapshot, snapshot.collateral, personal, draft, snapshot.as_of);
  assert.equal(estimate.annual_rate_bps, 395); assert.equal(estimate.cost, '39.50');
  assert.throws(() => estimateCredit(snapshot, snapshot.collateral, personal, { ...draft, asset_ids: [sol.id] }, snapshot.as_of), /eligible/);
  assert.throws(() => estimateCredit(snapshot, snapshot.collateral, personal, { ...draft, amount: '99999999.00' }, snapshot.as_of), /capacity/);
  const applied = await repository.execute(command(snapshot, 'apply', { draft }), 'lombard-apply001');
  await assert.rejects(repository.execute(command(applied, 'apply', { draft }), 'lombard-apply002'), /pending/);
  const transfers = createDemoTransferRepository('collateral-customer');
  const quote = await transfers.quote({ source_account_id: btc.id, route_id: 'route-BTC', amount: '0.10000000', recipient_name: 'Demo recipient', destination: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', reference: 'Collateral availability' });
  await transfers.submit(quote.id, 'collateral-send1');
  const refreshed = await repository.getSnapshot();
  assert.ok(Number(refreshed.collateral.find(asset => asset.id === btc.id).capacity) < Number(btc.capacity));
  } finally { env.close(); }
});

test('one revenue policy excludes disconnected sources, accounts for pending requests and distinguishes factor fee from APR', async () => {
  const repository = createCreditRepository('revenue-customer'); const snapshot = await repository.getSnapshot();
  const draft = { kind: 'revenue', source_ids: ['str-1'], amount: '150000.00', sales_share_bps: 800, purpose: 'Expand business' };
  const estimate = estimateCredit(snapshot, snapshot.collateral, business, draft, snapshot.as_of);
  assert.equal(estimate.annual_rate_bps, null); assert.equal(estimate.cost, '12000.00');
  const faster = estimateCredit(snapshot, snapshot.collateral, business, { ...draft, sales_share_bps: 1100 }, snapshot.as_of);
  assert.equal(faster.cost, '7500.00');
  assert.throws(() => estimateCredit(snapshot, snapshot.collateral, business, { ...draft, source_ids: ['str-3'] }, snapshot.as_of), /connected/);
  const next = await repository.execute(command(snapshot, 'apply', { draft }, business), 'revenue-apply001');
  assert.throws(() => estimateCredit(next, next.collateral, business, draft, snapshot.as_of), /capacity/);
});

test('payment pause requests do not silently change agreements; matching privacy survives repository recreation', async () => {
  let repository = createCreditRepository('flex-customer'); let snapshot = await repository.getSnapshot();
  const due = snapshot.loans[1].next_due;
  snapshot = await repository.execute(command(snapshot, 'apply', { draft: { kind: 'pause', loan_id: 'loan-equipment' } }, business), 'pause-apply-0001');
  assert.equal(snapshot.loans[1].next_due, due);
  await assert.rejects(repository.execute(command(snapshot, 'apply', { draft: { kind: 'pause', loan_id: 'loan-equipment' } }, business), 'pause-apply-0002'), /pending/);
  snapshot = await repository.execute(command(snapshot, 'matching', { enabled: true, anonymous: false }, business), 'matching-000001');
  repository = createCreditRepository('flex-customer');
  assert.deepEqual((await repository.getSnapshot()).matching[0], { enabled: true, anonymous: false, scope: business });
  assert.throws(() => estimateCredit(snapshot, snapshot.collateral, personal, { kind: 'refinance', amount: '5000.00', currency: 'EUR', purpose: 'Refinance debt' }, snapshot.as_of), /business/);
});

test('manually entered loan amounts accept exact cents between limits; slider increments do not restrict applications', async () => {
  const repository = createCreditRepository('typed-amount-customer'); const snapshot = await repository.getSnapshot();
  const draft = { ...term, amount: '1500.25' };
  const applied = await repository.execute(command(snapshot, 'apply', { draft }), 'typed-amount-001');
  assert.equal(applied.applications[0].estimate.amount, '1500.25');
  assert.equal(applied.personal_cash, snapshot.personal_cash);
  assert.throws(() => estimateCredit(snapshot, snapshot.collateral, personal, { ...draft, amount: '60000.01' }, snapshot.as_of), /limits/);
});

test('amortization conserves cents for every product and zero interest, with a settled final balance and safe month ends', () => {
  for (const product of creditSeed().products) {
    for (const amount of [product.min_amount, product.max_amount]) {
      const result = amortize(amount, product.annual_rate_bps, product.max_months);
      assert.equal(result.rows.at(-1).balance, '0.00');
      assert.equal(result.rows.reduce((sum, row) => sum + units(row.principal, 2), 0n), units(amount, 2));
      assert.equal(units(result.total, 2), units(amount, 2) + units(result.cost, 2));
      assert.ok(result.rows.every(row => units(row.principal, 2) > 0n));
    }
  }
  assert.equal(amortize('100.00', 0, 12).total, '100.00');
  assert.equal(dueDate('2028-01-31', 1), '2028-02-29');
  assert.equal(dueDate('2027-01-31', 1), '2027-02-28');
});

test('CSV exports only the selected scope, includes schedules, and neutralizes spreadsheet formulas', async () => {
  const snapshot = await createCreditRepository('export-customer').getSnapshot();
  snapshot.loans[0].name = '=IMPORTDATA("test")';
  const report = creditReport(snapshot, personal);
  assert.ok(report.includes("'=IMPORTDATA")); assert.ok(report.includes('Illustrative schedule')); assert.ok(report.includes('2026-11-15'));
  assert.ok(!report.includes('Equipment finance')); assert.ok(!creditReport(snapshot, business).includes('loan-personal'));
});

test('HTTP adapter uses authenticated endpoints, validates responses and never falls back to local money', async () => {
  const previousFetch = global.fetch; const oldMode = process.env.NEXT_PUBLIC_LOANS_MODE, oldWallet = process.env.NEXT_PUBLIC_TRANSFERS_MODE;
  const local = projectCredit(creditSeed(), readWallet('http-fixture').state.transfers.accounts, '2026-10-23T12:00:00Z', demoFunds); local.mode = 'http';
  try {
    process.env.NEXT_PUBLIC_LOANS_MODE = 'http'; process.env.NEXT_PUBLIC_TRANSFERS_MODE = 'demo';
    assert.throws(() => createCreditRepository('remote'), /same service mode/);
    process.env.NEXT_PUBLIC_TRANSFERS_MODE = 'http';
    const calls = []; global.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => local }; };
    const repository = createCreditRepository('remote'); const snapshot = await repository.getSnapshot();
    const request = command(snapshot, 'apply', { draft: term }); await repository.execute(request, 'http-command001');
    assert.equal(calls[1].url, '/v1/me/credit/commands'); assert.equal(calls[1].options.credentials, 'include'); assert.equal(calls[1].options.cache, 'no-store'); assert.equal(calls[1].options.headers['Idempotency-Key'], 'http-command001');
    assert.equal(JSON.parse(calls[1].options.body).scope, 'personal'); assert.ok(!calls[1].options.body.includes('remote'));
    assert.throws(() => validateCreditSnapshot({ ...local, personal_cash: 'NaN' }), /Invalid/);
    assert.throws(() => validateCreditSnapshot({ ...local, facilities: [] }), /Invalid/);
    global.fetch = async () => ({ ok: false, status: 409, json: async () => ({ error: { message: 'Version conflict' } }) });
    await assert.rejects(repository.getSnapshot(), /Version conflict/);
  } finally { global.fetch = previousFetch; if (oldMode === undefined) delete process.env.NEXT_PUBLIC_LOANS_MODE; else process.env.NEXT_PUBLIC_LOANS_MODE = oldMode; if (oldWallet === undefined) delete process.env.NEXT_PUBLIC_TRANSFERS_MODE; else process.env.NEXT_PUBLIC_TRANSFERS_MODE = oldWallet; }
});
