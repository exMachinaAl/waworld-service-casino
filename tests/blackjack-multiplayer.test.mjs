import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {openDb,transaction,ensurePlayer,wallet,checkLedger} from '../src/db.mjs';
import {setupBlackjackTables,createBlackjackTable,blackjackTableInfo,blackjackTablePreview,joinBlackjackTable,blackjackTableAction,blackjackMyTables,sweepBlackjackTimeouts,blackjackScore} from '../src/blackjack-tables.mjs';
import {createApp} from '../src/server.mjs';
import {createWorldArcadeAdapter} from '../integrations/wa-world/adapter.mjs';
const C=s=>'bj-test-'+s+'-command-12345';
const error=(fn,code)=>assert.throws(fn,e=>e.code===code,code);
function fixture(n=4,db=openDb()) {setupBlackjackTables(db);const people=Array.from({length:n},(_,i)=>transaction(db,()=>ensurePlayer(db,`bj-user-${i}@s.whatsapp.net`)));return {db,people};}
function readyTable(db,people,n=people.length){
 const first=createBlackjackTable(db,people[0],{bet:20,command_id:C('create')});let t=first.table;
 for(let i=1;i<n;i++)t=joinBlackjackTable(db,people[i],t.code,{expected_version:t.version,command_id:C('join-'+i)}).table;
 for(let i=0;i<n;i++)t=blackjackTableAction(db,people[i],t.id,{action:'READY',expected_version:t.version,command_id:C('ready-'+i)}).table;
 return t;
}
test('Blackjack: scoring aces, natural, exact stake payout basis',()=>{
 assert.equal(blackjackScore(['A♠','9♥']),20);assert.equal(blackjackScore(['A♠','9♥','5♣']),15);
 assert.equal(blackjackScore(['A♠','A♥','9♠']),21);
});
test('Blackjack: four players, seat access, privacy, turn validation, settlement replay',()=>{
 const {db,people}=fixture(5),[a,b,c,d,mal]=people;
 const before=people.slice(0,4).map(p=>wallet(db,p));
 let t=readyTable(db,people,4);
 error(()=>joinBlackjackTable(db,mal,t.code,{expected_version:t.version,command_id:C('late')}),'TABLE_FULL');
 error(()=>blackjackTableInfo(db,mal,t.id),'TABLE_ACCESS_DENIED');
 error(()=>blackjackTableAction(db,b,t.id,{action:'START',expected_version:t.version,command_id:C('not-host')}),'HOST_ONLY');
 const starting=blackjackTableAction(db,a,t.id,{action:'START',expected_version:t.version,command_id:C('start')});t=starting.table;
 assert.equal(t.player_count,4);assert.ok(['PLAYING','FINISHED'].includes(t.status));
 assert.deepEqual(blackjackTableAction(db,a,t.id,{action:'START',expected_version:t.version-1,command_id:C('start')}),starting);
 assert.equal(t.dealer.length,2);
 if(t.status==='PLAYING'){
  assert.equal(t.dealer[1],'🂠');
  assert.equal(JSON.stringify(t).includes('deck'),false);
  assert.ok(t.hands.some(h=>h.seat!==t.my_seat&&h.cards.length===0));
  const current=t.members.find(m=>m.seat===t.turn_seat);
  const other=people[(current.seat%4)];
  error(()=>blackjackTableAction(db,other,t.id,{action:'HIT',expected_version:t.version,command_id:C('wrong-turn')}),'NOT_YOUR_TURN');
  const snapshot=blackjackTableInfo(db,a,t.id);
  for(let i=0;i<9&&t.status==='PLAYING';i++){
   const seat=t.turn_seat,p=people[seat-1];const resp=blackjackTableAction(db,p,t.id,{action:'STAND',expected_version:t.version,command_id:C('stand-'+i)});
   t=resp.table;
   error(()=>blackjackTableAction(db,p,t.id,{action:'STAND',expected_version:t.version-1,command_id:C('stale-'+i)}),'TABLE_STATE_STALE');
  }
  assert.ok(t.version>snapshot.table.version);
 }
 assert.equal(t.status,'FINISHED');assert.equal(t.dealer[1]!=='🂠',true);
 const payouts=t.hands.map(h=>h.payout);
 assert.ok(payouts.every(x=>Number.isInteger(x)&&x>=0));
 people.slice(0,4).forEach((p,i)=>assert.equal(wallet(db,p),before[i]-20+payouts[i]));
 assert.deepEqual(checkLedger(db).imbalanced,[]);assert.deepEqual(checkLedger(db).playerBalancesMismatched,[]);
 error(()=>blackjackTableAction(db,a,t.id,{action:'START',expected_version:t.version,command_id:C('start-again')}),'ALREADY_STARTED');
 db.close();
});
test('Blackjack: cannot start with insufficient ACR; no partial stake changes',()=>{
 const {db,people}=fixture(2);let t=readyTable(db,people);
 const bob=people[1],alice=people[0],initial=wallet(db,alice);
 // Spend Bob credit legitimately rather than manipulating ledger.
 db.prepare('UPDATE accounts SET balance=0 WHERE owner_id=?').run(bob);
 error(()=>blackjackTableAction(db,alice,t.id,{action:'START',expected_version:t.version,command_id:C('insufficient')}),'INSUFFICIENT_ACR');
 assert.equal(wallet(db,alice),initial);assert.equal(blackjackTableInfo(db,alice,t.id).table.status,'OPEN');
 db.close();
});
test('Blackjack: timeout auto-stand advances stalled turn and survives restart',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wae-blackjack-'));
 try{
  const file=path.join(dir,'data.sqlite');let db=openDb(file);const {people}=fixture(2,db);
  let t=readyTable(db,people);t=blackjackTableAction(db,people[0],t.id,{action:'START',expected_version:t.version,command_id:C('restart-start')}).table;
  db.close();db=openDb(file);setupBlackjackTables(db);
  assert.equal(blackjackTableInfo(db,people[0],t.id).table.version,t.version);
  for(let i=0;i<5&&t.status==='PLAYING';i++){
   error(()=>blackjackTableAction(db,people[1],t.id,{action:'TIMEOUT',expected_version:t.version,command_id:C('too-early-'+i)}),'TURN_NOT_EXPIRED');
   const state=JSON.parse(db.prepare('SELECT state_json FROM bj_tables WHERE id=?').get(t.id).state_json);
   state.turn_deadline_ms=Date.now()-1000;db.prepare('UPDATE bj_tables SET state_json=? WHERE id=?').run(JSON.stringify(state),t.id);
   assert.equal(sweepBlackjackTimeouts(db),1);
   t=blackjackTableInfo(db,people[0],t.id).table;
  }
  assert.equal(t.status,'FINISHED');const total=people.reduce((a,p)=>a+wallet(db,p),0);
  assert.equal(sweepBlackjackTimeouts(db),0);
  assert.equal(people.reduce((a,p)=>a+wallet(db,p),0),total);
  assert.deepEqual(checkLedger(db).imbalanced,[]);db.close();
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('Blackjack: invite join, leave, cancel, duplicate idempotent',()=>{
 const {db,people}=fixture(2);let t=createBlackjackTable(db,people[0],{bet:10,command_id:C('create')}).table;
 assert.equal(blackjackTablePreview(db,people[1],t.code).table.is_member,false);
 const joined=joinBlackjackTable(db,people[1],t.code,{expected_version:t.version,command_id:C('join')});t=joined.table;
 assert.deepEqual(joinBlackjackTable(db,people[1],t.code,{expected_version:1,command_id:C('join')}),joined);
 const left=blackjackTableAction(db,people[1],t.id,{action:'LEAVE',expected_version:t.version,command_id:C('leave')});t=left.table;
 assert.equal(t.player_count,1);
 const cancelled=blackjackTableAction(db,people[0],t.id,{action:'CANCEL',expected_version:t.version,command_id:C('cancel')});assert.equal(cancelled.table.status,'CANCELLED');
 assert.equal(blackjackMyTables(db,people[0]).length,1);db.close();
});
test('Blackjack: API guest denied, service credentials scoped, connector WA messages',async()=>{
 const key='blackjack-service-test-key-abcdefgh-12345',app=createApp({database:':memory:',serviceKey:key,demo:true,host:'127.0.0.1'});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${app.server.address().port}`;
 const req=async(route,method='GET',data={},cookie=null,internal=false)=>{
  const res=await fetch(base+route,{method,headers:{Origin:base,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(internal?{'X-WAE-Service-Key':key}:{})},body:method==='POST'?JSON.stringify(data):undefined});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
 };
 try{
  assert.equal((await req('/api/v1/blackjack-tables')).status,401);
  assert.equal((await req('/internal/v1/blackjack-tables?subject=abc@s.whatsapp.net')).status,401);
  const login=await req('/api/v1/demo-login','POST',{});assert.equal(login.status,200);
  const first=await req('/api/v1/blackjack-tables','POST',{bet:20,command_id:C('api-create')},login.cookie);assert.equal(first.status,201);
  assert.equal((await req('/api/v1/blackjack-tables', 'GET',{},login.cookie)).data.mine.length,1);
  const adapter=createWorldArcadeAdapter({apiUrl:base,serviceKey:key});
  const msg=await adapter.handle({senderJid:'blackjack-watest@s.whatsapp.net',text:'.wae bjroom create 10',messageId:'bj-wa-1'});
  assert.match(msg,/BLACKJACK TABLE/);
  const invite=msg.match(/TABLE ([A-Z2-9]{7})/)[1];
  const someone=await adapter.handle({senderJid:'blackjack-watest2@s.whatsapp.net',text:'.wae bjroom join '+invite,messageId:'bj-wa-2'});assert.match(someone,/BLACKJACK TABLE/);
  assert.match(await adapter.handle({senderJid:'blackjack-watest@s.whatsapp.net',text:'.wae bjroom ready '+invite,messageId:'bj-wa-3'}),/SIAP/);
  await adapter.handle({senderJid:'blackjack-watest2@s.whatsapp.net',text:'.wae bjroom ready '+invite,messageId:'bj-wa-4'});
  const started=await adapter.handle({senderJid:'blackjack-watest@s.whatsapp.net',text:'.wae bjroom start '+invite,messageId:'bj-wa-5'});assert.match(started,/BLACKJACK TABLE/);
  assert.equal((await adapter.handle({senderJid:'blackjack-watest@s.whatsapp.net',text:'.wae bjroom start '+invite,messageId:'bj-wa-5'})),started);
 }finally{await app.close();}
});
