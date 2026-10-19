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
const { MOCK_OVERVIEW: report } = require('../app/lib/mock/dashboard.ts');
const { applyOperation, filterTransactions, minorUnits, formatMoney } = require('../app/lib/overview/engine.ts');
const { createOverviewRepository } = require('../app/lib/overview/repository.ts');
const deposit = { id: 'operation-1', type: 'deposit', amount: '0.10' };
test('snapshot is JSON-safe with exact decimals, UTC dates, unique transactions and consistent summaries', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(report)), report);
  assert.equal(report.summary.liquidity, report.accounts.find(a => a.code === 'USD').balance);
  assert.equal(new Set(report.transactions.map(t => t.id)).size, report.transactions.length);
  for (const histories of Object.values(report.histories)) for (const period of Object.values(histories)) {
    assert.equal(period.points.length, 16);
    assert.ok(period.points.every((p, i, all) => /^\d+\.\d+$/.test(p.value) && p.at.endsWith('Z') && p.at <= report.as_of && (!i || p.at > all[i-1].at)));
  }
  assert.equal(Number(report.histories.crypto['1M'].points.at(-1).value), Number(report.summary.crypto_quantity));
  assert.equal(Number(report.histories.stocks['1M'].points.at(-1).value), Number(report.summary.investments));
});
test('exact cent arithmetic, balance update, activity insertion, and duplicate request protection', () => {
  const next = applyOperation(report, deposit, report.as_of);
  assert.equal(next.summary.liquidity, '142350.90');
  assert.equal(next.accounts.find(a => a.code === 'USD').balance, '142350.90');
  assert.equal(next.transactions[0].amount, '0.10');
  assert.equal(applyOperation(next, deposit, report.as_of), next);
  const withdrawn = applyOperation(next, { id: 'op-2', type: 'withdraw', amount: '0.20' }, report.as_of);
  assert.equal(withdrawn.summary.liquidity, '142350.70');
  assert.equal(report.summary.liquidity, '142350.80');
});
test('invalid amounts, overdraw, invalid recipient and IBAN checksum fail without mutation', () => {
  for (const value of ['NaN','Infinity','-1','0.001','1e3','1,000','', '9007199254740993']) assert.throws(() => minorUnits(value));
  assert.throws(() => applyOperation(report, { ...deposit, amount: '0' }, report.as_of));
  assert.throws(() => applyOperation(report, { ...deposit, type: 'withdraw', amount: '142350.81' }, report.as_of), /Insufficient/);
  const transfer = { id:'op-t', type:'transfer', amount:'100', recipient_name:'Demo Recipient', recipient_kind:'iban', recipient:'RO49AAAA1B31007593840000' };
  assert.equal(applyOperation(report, transfer, report.as_of).summary.liquidity, '142250.80');
  assert.throws(() => applyOperation(report, {...transfer, recipient:'RO00AAAA1B31007593840000'}, report.as_of), /checksum/);
  assert.throws(() => applyOperation(report, {...transfer, recipient_kind:'phone', recipient:'0712'}, report.as_of));
  assert.equal(applyOperation(report, {...transfer, recipient_kind:'phone', recipient:'+40712345678'}, report.as_of).transactions[0].type, 'TRANSFER');
});
test('period filters include boundaries, exclude future records, and are nested across ranges', () => {
  const time = Date.parse(report.as_of);
  const seed = report.transactions[0];
  const rows = [{...seed,id:'start',occurred_at:new Date(time-86400000).toISOString()}, {...seed,id:'end',occurred_at:report.as_of}, {...seed,id:'future',occurred_at:new Date(time+1).toISOString()}, {...seed,id:'old',occurred_at:new Date(time-86400001).toISOString()}];
  assert.deepEqual(filterTransactions(rows,'1D',report.as_of).map(r=>r.id), ['end','start']);
  assert.ok(filterTransactions(report.transactions,'1Y',report.as_of).length > filterTransactions(report.transactions,'1M',report.as_of).length);
  assert.match(formatMoney('35000','JPY'), /35,000/);
});
test('repository shares wallet persistence per client and rejects corrupt storage without resetting money', async () => {
  const storage = new Map();
  global.window = {};
  global.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value) };
  try {
    const repo = createOverviewRepository('test-a');
    const first = await repo.getSnapshot(); first.summary.liquidity = '0';
    assert.equal((await repo.getSnapshot()).summary.liquidity, report.summary.liquidity);
    await repo.submitOperation(deposit);
    assert.equal((await createOverviewRepository('test-a').getSnapshot()).summary.liquidity, '142350.90');
    assert.equal((await createOverviewRepository('test-b').getSnapshot()).summary.liquidity, report.summary.liquidity);
    storage.set('mbank_overview_v1:corrupt','{broken');
    const corrupt = createOverviewRepository('corrupt');
    await assert.rejects(corrupt.getSnapshot(), /could not be migrated/);
    await assert.rejects(corrupt.submitOperation(deposit), /could not be migrated/);
    assert.equal(storage.get('mbank_overview_v1:corrupt'), '{broken');
  } finally { delete global.window; delete global.sessionStorage; }
});
