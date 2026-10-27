import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {openDb,checkLedger} from '../src/db.mjs';import {normalizeRc2GlobalPolicy} from '../src/rc2-policy.mjs';import {policy} from '../src/stake-policy.mjs';

test('RC2 normalizes prior global max 10000 to 3000 without changing player balances',()=>{
 const db=openDb();try{
  const before=db.prepare("SELECT id,balance FROM accounts ORDER BY id").all();
  db.prepare("INSERT INTO stake_policies VALUES('wa-world','*',1,?)").run(JSON.stringify({min:100,max:10000,maxDigits:12,presets:[100,500,3000,10000]}));
  db.prepare("INSERT INTO stake_policies VALUES('wa-world','A1-01',1,?)").run(JSON.stringify({min:100,max:10000,maxDigits:12,presets:[100,500,3000,10000]}));
  const once=normalizeRc2GlobalPolicy(db);assert.equal(once.changed,true);assert.equal(once.oldMax,10000);assert.equal(policy(db,'A1-01').max,3000);assert.equal(policy(db,'L1').min,100);
  assert.deepEqual(db.prepare("SELECT id,balance FROM accounts ORDER BY id").all(),before);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM policy_audit").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM schema_migrations WHERE version='1.0.0-rc.2'").get().n,1);
  assert.equal(normalizeRc2GlobalPolicy(db).alreadyApplied,true);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM policy_audit").get().n,1);
  assert.deepEqual(checkLedger(db).imbalanced,[]);
 }finally{db.close()}
});
test('RC2 does not increase smaller custom limits',()=>{const db=openDb();try{db.prepare("INSERT INTO stake_policies VALUES('wa-world','*',1,?)").run(JSON.stringify({min:20,max:1200,maxDigits:12,presets:[20,100,1200]}));assert.equal(normalizeRc2GlobalPolicy(db).changed,false);assert.equal(policy(db,'B1').max,1200)}finally{db.close()}});
test('RC2 help, lottery empty state and admin tabs exist in UI',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert.match(read('web/src/App.jsx'),/HelpCenter/);assert.match(read('web/src/components/HelpCenter.jsx'),/Buat DRAFT/);
 assert.match(read('web/src/components/RoundLobby.jsx'),/lottery-empty/);
 assert.match(read('web/src/components/RoundAdmin.jsx'),/Math\.max\(f\.price,l1\.min\)/);
 assert.match(read('web/src/components/AdminView.jsx'),/admin-module-tabs/);
});
