import test from 'node:test';
import assert from 'node:assert/strict';
import {openDb,transaction,ensurePlayer,wallet,checkLedger} from '../src/db.mjs';
import {setupRooms,createRoom,joinRoom,roomInfo,myRooms,publicRooms,roomAction} from '../src/rooms.mjs';
import {createApp} from '../src/server.mjs';
import {mkdtempSync,rmSync} from 'node:fs';import path from 'node:path';import os from 'node:os';
function fixture(){const db=openDb();setupRooms(db);const alice=transaction(db,()=>ensurePlayer(db,'alice@s.whatsapp.net'));const bob=transaction(db,()=>ensurePlayer(db,'bob@s.whatsapp.net'));const mallory=transaction(db,()=>ensurePlayer(db,'mallory@s.whatsapp.net'));return {db,alice,bob,mallory};}
const cid=(suffix)=>'room-test-command-'+suffix+'-000012345';
function raises(fn,code){assert.throws(fn,e=>e.code===code,code)}
test('room: create, join, ready, start, winner payout and zero-sum ledger',()=>{
 const {db,alice,bob,mallory}=fixture();
 const oldA=wallet(db,alice),oldB=wallet(db,bob);
 const a=createRoom(db,alice,{bet:20,command_id:cid('create')});
 assert.equal(a.room.status,'OPEN');assert.equal(a.room.player_count,1);
 assert.deepEqual(createRoom(db,alice,{bet:20,command_id:cid('create')}),a);
 raises(()=>joinRoom(db,alice,a.room.code,{expected_version:1,command_id:cid('self')}),'ALREADY_JOINED');
 raises(()=>roomInfo(db,mallory,a.room.id),'ROOM_ACCESS_DENIED');
 const b=joinRoom(db,bob,a.room.code,{expected_version:1,command_id:cid('join')});
 assert.equal(b.room.player_count,2);assert.equal(b.room.version,2);assert.equal(b.room.is_host,false);
 raises(()=>joinRoom(db,mallory,a.room.code,{expected_version:2,command_id:cid('other')}),'ROOM_FULL');
 raises(()=>roomAction(db,alice,a.room.id,{action:'START',expected_version:2,command_id:cid('early')}),'PLAYERS_NOT_READY');
 const readyA=roomAction(db,alice,a.room.id,{action:'READY',expected_version:2,command_id:cid('ready-a')});
 assert.equal(readyA.room.version,3);
 raises(()=>roomAction(db,bob,a.room.id,{action:'READY',expected_version:2,command_id:cid('stale')}),'ROOM_STATE_STALE');
 const readyB=roomAction(db,bob,a.room.id,{action:'READY',expected_version:3,command_id:cid('ready-b')});
 raises(()=>roomAction(db,bob,a.room.id,{action:'START',expected_version:4,command_id:cid('not-host')}),'HOST_ONLY');
 const finish=roomAction(db,alice,a.room.id,{action:'START',expected_version:4,command_id:cid('start')});
 assert.equal(finish.room.status,'FINISHED');assert.ok(finish.room.result.winning_seat===1||finish.room.result.winning_seat===2);
 assert.notEqual(finish.room.result.dice[0],finish.room.result.dice[1]);
 assert.equal(finish.room.result.payout,40);
 const replay=roomAction(db,alice,a.room.id,{action:'START',expected_version:4,command_id:cid('start')});assert.deepEqual(replay,finish);
 assert.equal(wallet(db,alice)+wallet(db,bob),oldA+oldB);
 assert.equal(finish.room.result.winning_seat===1?wallet(db,alice):wallet(db,bob),finish.room.result.winning_seat===1?oldA+20:oldB+20);
 assert.deepEqual(checkLedger(db).imbalanced,[]);assert.deepEqual(checkLedger(db).playerBalancesMismatched,[]);
 raises(()=>roomAction(db,alice,a.room.id,{action:'START',expected_version:5,command_id:cid('second')}),'ROOM_CLOSED');
 db.close();
});
test('room: cannot start with insufficient ACR; no partial debit, cancel and leave',()=>{
 const {db,alice,bob,mallory}=fixture();
 const a=createRoom(db,alice,{bet:50,command_id:cid('create-2')});
 const b=joinRoom(db,bob,a.room.code,{expected_version:1,command_id:cid('join-2')});
 roomAction(db,alice,a.room.id,{action:'READY',expected_version:2,command_id:cid('ra2')});
 roomAction(db,bob,a.room.id,{action:'READY',expected_version:3,command_id:cid('rb2')});
 db.prepare('UPDATE accounts SET balance=0 WHERE owner_id=?').run(bob);
 const totalBefore=wallet(db,alice);const txBefore=db.prepare('SELECT count(*) n FROM transfers').get().n;
 raises(()=>roomAction(db,alice,a.room.id,{action:'START',expected_version:4,command_id:cid('failcash')}),'INSUFFICIENT_ACR');
 assert.equal(wallet(db,alice),totalBefore);assert.equal(db.prepare('SELECT count(*) n FROM transfers').get().n,txBefore);
 const leave=roomAction(db,bob,a.room.id,{action:'LEAVE',expected_version:4,command_id:cid('leave2')});assert.equal(leave.room.player_count,1);
 assert.deepEqual(roomAction(db,bob,a.room.id,{action:'LEAVE',expected_version:4,command_id:cid('leave2')}),leave);
 const cancelled=roomAction(db,alice,a.room.id,{action:'CANCEL',expected_version:5,command_id:cid('cancel2')});assert.equal(cancelled.room.status,'CANCELLED');
 assert.equal(publicRooms(db,mallory).some(x=>x.code===a.room.code),false);
 db.close();
});
test('room: expiration, room limit, code collision protection',()=>{
 const {db,alice,bob}=fixture();
 const room=createRoom(db,alice,{bet:5,command_id:cid('expiry')});
 db.prepare('UPDATE multiplayer_rooms SET expires_ms=? WHERE id=?').run(Date.now()-1,room.room.id);
 raises(()=>joinRoom(db,bob,room.room.code,{expected_version:1,command_id:cid('expired')}),'ROOM_EXPIRED');
 assert.equal(myRooms(db,alice)[0].status,'EXPIRED');
 for(let i=0;i<3;i++)createRoom(db,alice,{bet:10,command_id:cid('limits'+i)});
 raises(()=>createRoom(db,alice,{bet:10,command_id:cid('limitexceeded')}),'ROOM_LIMIT');
 db.close();
});
test('HTTP: rooms require authenticated player and valid version',async()=>{
 const app=createApp({database:':memory:',serviceKey:'test-rooms-service-secret-12345678',demo:true,host:'127.0.0.1'});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${app.server.address().port}`;
 const request=async(method,route,body,cookie)=>{const r=await fetch(base+route,{method,headers:{Origin:base,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,json:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{
  assert.equal((await request('GET','/api/v1/rooms')).status,401);
  const login=await request('POST','/api/v1/demo-login',{});assert.equal(login.status,200);
  const created=await request('POST','/api/v1/rooms',{bet:10,command_id:cid('http-create')},login.cookie);
  assert.equal(created.status,201);assert.equal(created.json.room.status,'OPEN');
  assert.equal((await request('GET',`/api/v1/rooms/preview/${created.json.room.code}`,null,login.cookie)).status,200);
  assert.equal((await request('GET','/api/v1/rooms',null,login.cookie)).json.mine.length,1);
  assert.equal((await request('GET',`/api/v1/rooms/${created.json.room.id}`,null,login.cookie)).status,200);
  assert.equal((await request('POST',`/api/v1/rooms/${created.json.room.id}/actions`,{action:'START',expected_version:1,command_id:cid('http-start')},login.cookie)).status,409);
 }finally{await app.close()}
});

test('room: persisted SQLite state survives restart and cannot re-settle',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'wae-mp-'));
 try{
  const file=path.join(dir,'arcade.sqlite');let db=openDb(file);setupRooms(db);
  const a=transaction(db,()=>ensurePlayer(db,'persist-alice@s.whatsapp.net'));
  const b=transaction(db,()=>ensurePlayer(db,'persist-bob@s.whatsapp.net'));
  const created=createRoom(db,a,{bet:10,command_id:cid('pc')});
  joinRoom(db,b,created.room.code,{expected_version:1,command_id:cid('pj')});
  db.close();db=openDb(file);setupRooms(db);
  assert.equal(roomInfo(db,a,created.room.id).room.player_count,2);
  roomAction(db,a,created.room.id,{action:'READY',expected_version:2,command_id:cid('pra')});
  roomAction(db,b,created.room.id,{action:'READY',expected_version:3,command_id:cid('prb')});
  const done=roomAction(db,a,created.room.id,{action:'START',expected_version:4,command_id:cid('ps')});
  const total=wallet(db,a)+wallet(db,b);db.close();
  db=openDb(file);setupRooms(db);
  assert.equal(roomInfo(db,b,created.room.id).room.status,'FINISHED');
  assert.deepEqual(roomAction(db,a,created.room.id,{action:'START',expected_version:4,command_id:cid('ps')}),done);
  assert.equal(wallet(db,a)+wallet(db,b),total);
  db.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});
