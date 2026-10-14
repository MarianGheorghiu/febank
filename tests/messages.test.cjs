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
const { MOCK_MESSAGES: seed } = require('../app/lib/mock/messages.ts');
const { filterMessages, messageCounts, applyMessageCommand, MAX_REPLY_LENGTH } = require('../app/lib/messages/engine.ts');
const { createMessageRepository, messageStorageKey, isMessagesSnapshot } = require('../app/lib/messages/repository.ts');
const filters = { folder:'inbox', category:'all', query:'', unread_only:false };
const at = '2026-10-14T13:00:00Z';
const apply = (state, command) => applyMessageCommand(state, command, at);
test('fixture is JSON-safe, typed, chronologically consistent and has raw monetary values', () => {
  assert.ok(isMessagesSnapshot(seed));
  assert.deepEqual(JSON.parse(JSON.stringify(seed)),seed);
  const fractional=structuredClone(seed); fractional.messages[0].read_at=fractional.messages[0].created_at.replace('Z','.000Z'); assert.ok(isMessagesSnapshot(fractional));
  for(const m of seed.messages) if(m.amount) assert.match(m.amount.value,/^\d+(\.\d+)?$/);
  assert.ok(messageCounts(seed).inbox>8);
  const bad = structuredClone(seed); bad.messages[0].created_at='Yesterday'; assert.equal(isMessagesSnapshot(bad),false);
  const duplicate = structuredClone(seed); duplicate.messages.push(duplicate.messages[0]); assert.equal(isMessagesSnapshot(duplicate),false);
  const route = structuredClone(seed); route.messages[0].action.target='https://external.example'; assert.equal(isMessagesSnapshot(route),false);
});
test('search, category, folder and unread filters share one scope and search replies', () => {
  assert.deepEqual(filterMessages(seed,{...filters,query:'  DINNER SPLIT  '}).map(m=>m.id),['msg-2']);
  assert.deepEqual(filterMessages(seed,{...filters,query:'September statement',category:'bank'}).map(m=>m.id).sort(),['msg-12','msg-6']);
  assert.ok(filterMessages(seed,{...filters,category:'friend',unread_only:true}).every(m=>m.type==='friend'&&m.read_at===null));
  assert.equal(filterMessages(seed,{...filters,folder:'replied'}).length,messageCounts(seed).replied);
  assert.ok(filterMessages(seed,{...filters,folder:'replied'}).every(m=>m.folder!=='deleted'&&m.replies.length));
  assert.equal(filterMessages(seed,{...filters,query:'no-matching-conversation'}).length,0);
});
test('read state and folder changes are immutable and bulk commands are atomic', () => {
  const read=apply(seed,{kind:'mark_read',ids:['msg-1','msg-1','msg-2']});
  assert.equal(messageCounts(read).unread,messageCounts(seed).unread-2);
  assert.equal(seed.messages.find(m=>m.id==='msg-1').read_at,null);
  assert.equal(apply(read,{kind:'mark_unread',ids:['msg-1']}).messages.find(m=>m.id==='msg-1').read_at,null);
  assert.throws(()=>apply(seed,{kind:'archive',ids:['msg-1','msg-10']}),/Restore/);
  assert.throws(()=>apply(seed,{kind:'trash',ids:['msg-1','missing']}),/available/);
  assert.equal(seed.messages.find(m=>m.id==='msg-1').folder,'inbox');
  const archived=apply(seed,{kind:'archive',ids:['msg-1']});
  assert.equal(archived.messages.find(m=>m.id==='msg-1').folder,'archived');
  assert.equal(apply(archived,{kind:'unarchive',ids:['msg-1']}).messages.find(m=>m.id==='msg-1').folder,'inbox');
});
test('trash is recoverable and restores the previous folder with replies and drafts intact', () => {
  const drafted=apply(seed,{kind:'save_draft',id:'msg-9',body:'Keep this draft.'});
  const trashed=apply(drafted,{kind:'trash',ids:['msg-9']});
  const twice=apply(trashed,{kind:'trash',ids:['msg-9']});
  assert.equal(twice.messages.find(m=>m.id==='msg-9').previous_folder,'archived');
  const flushed=apply(twice,{kind:'save_draft',id:'msg-9',body:'Latest draft edit.'});
  assert.equal(flushed.drafts['msg-9'],'Latest draft edit.');
  const restored=apply(twice,{kind:'restore',ids:['msg-9']});
  assert.equal(restored.messages.find(m=>m.id==='msg-9').folder,'archived');
  assert.equal(restored.messages.find(m=>m.id==='msg-9').replies.length,1);
  assert.equal(restored.drafts['msg-9'],'Keep this draft.');
  assert.ok(isMessagesSnapshot(restored));
});
test('multiple replies append to the thread, keep Inbox and clear the saved draft', () => {
  let state=apply(seed,{kind:'save_draft',id:'msg-2',body:'Thanks!'});
  const command={kind:'reply',id:'msg-2',reply_id:'reply-1',body:'  Thanks!  '};
  state=apply(state,command);
  assert.equal(state.messages.find(m=>m.id==='msg-2').folder,'inbox');
  assert.equal(state.drafts['msg-2'],undefined);
  assert.equal(state.messages.find(m=>m.id==='msg-2').replies[0].body,'Thanks!');
  assert.equal(apply(state,command),state);
  state=apply(state,{...command,reply_id:'reply-2',body:'See you soon.'});
  assert.equal(state.messages.find(m=>m.id==='msg-2').replies.length,2);
  assert.ok(isMessagesSnapshot(state));
  assert.throws(()=>apply(state,{...command,body:'Different content.'}),/already/);
});
test('notifications cannot be replied to; deleted conversations and invalid bodies are rejected', () => {
  const reply={kind:'reply',id:'msg-2',reply_id:'new-reply',body:'Hello'};
  assert.throws(()=>apply(seed,{...reply,id:'msg-1'}),/unavailable/);
  assert.throws(()=>apply(seed,{...reply,id:'msg-11'}),/unavailable/);
  assert.throws(()=>apply(seed,{...reply,body:'   '}),/Write/);
  assert.throws(()=>apply(seed,{...reply,body:'x'.repeat(MAX_REPLY_LENGTH+1)}),/at most/);
});
test('purge only applies to Trash and removes the conversation, replies and draft together', () => {
  assert.throws(()=>apply(seed,{kind:'purge',ids:['msg-2']}),/Only/);
  let state=apply(seed,{kind:'save_draft',id:'msg-9',body:'Draft'});
  state=apply(state,{kind:'trash',ids:['msg-9']});
  state=apply(state,{kind:'purge',ids:['msg-9']});
  assert.ok(!state.messages.some(m=>m.id==='msg-9'));
  assert.equal(state.drafts['msg-9'],undefined);
  assert.ok(isMessagesSnapshot(state));
});
test('repository persists per client, avoids lost concurrent updates, and recovers corrupt data', async () => {
  const values=new Map(); global.window={}; global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  try {
    const repo=createMessageRepository('a');
    const first=await repo.getSnapshot(); first.messages[0].subject='Changed externally';
    assert.notEqual((await repo.getSnapshot()).messages[0].subject,'Changed externally');
    await Promise.all([repo.execute({kind:'mark_read',ids:['msg-1']}),repo.execute({kind:'archive',ids:['msg-2']})]);
    const restored=await createMessageRepository('a').getSnapshot();
    assert.equal(restored.messages.find(m=>m.id==='msg-2').folder,'archived');
    assert.ok(restored.messages.find(m=>m.id==='msg-1').read_at);
    assert.equal((await createMessageRepository('b').getSnapshot()).messages.find(m=>m.id==='msg-1').read_at,null);
    values.set(messageStorageKey('bad'),'broken JSON');
    const bad=createMessageRepository('bad'); assert.deepEqual(await bad.getSnapshot(),seed);
    await bad.execute({kind:'mark_read',ids:['msg-1']}); assert.ok(isMessagesSnapshot(await bad.getSnapshot()));
    global.localStorage.setItem=()=>{throw new Error('quota');};
    await assert.rejects(repo.execute({kind:'trash',ids:['msg-1']}),/Unable to save/);
    assert.equal((await repo.getSnapshot()).messages.find(m=>m.id==='msg-1').folder,'inbox');
  } finally {delete global.window;delete global.localStorage;}
});
