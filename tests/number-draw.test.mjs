import test from 'node:test';
import assert from 'node:assert/strict';
import {openDb,transaction,ensurePlayer,wallet,checkLedger} from '../src/db.mjs';
import {setupDraw,evaluateNumberDraw,drawQuota} from '../src/number-draw.mjs';
import {createGame,act,games} from '../src/games.mjs';
import {economyOverview} from '../src/economy-overview.mjs';
const setup=()=>{const db=openDb();setupDraw(db);const p=transaction(db,()=>ensurePlayer(db,'test.numberdraw','demo'));return {db,p};};
const command=(n,digits='1234')=>({command_id:`test-number-action-${n}`,action:'SPIN',expected_version:n,digits});
test('categories separate Slot, Arcade, Multiplayer, Number Draw',()=>{
 const catalog=games();assert.equal(catalog.filter(g=>g.category==='slot').length,5);
 assert.ok(catalog.some(g=>g.code==='L1'&&g.category==='lottery'));
 assert.ok(catalog.some(g=>g.code==='T0'&&g.category==='multiplayer'));
 assert.ok(catalog.some(g=>g.code==='B2'&&g.category==='arcade'));
});
test('consecutive prefix matching, zero padded numbers, 1.5x incremental reward',()=>{
 assert.deepEqual(evaluateNumberDraw('000012','000097'),{matched_prefix:4,reward:10});
 assert.deepEqual(evaluateNumberDraw('123456','123459'),{matched_prefix:5,reward:15});
 assert.deepEqual(evaluateNumberDraw('123456','123456'),{matched_prefix:6,reward:23});
 assert.equal(evaluateNumberDraw('9988','0099').reward,0);
 assert.throws(()=>evaluateNumberDraw('1234567890123','1234567890123'),{status:400});
});
test('legacy instant create is explicitly retired without wallet mutation',()=>{
 const {db,p}=setup();const start=wallet(db,p);
 assert.throws(()=>createGame(db,p,'L1'),{code:'LOTTERY_USE_ROUNDS_API'});
 assert.equal(wallet(db,p),start);assert.deepEqual(checkLedger(db).imbalanced,[]);db.close();
});
test('economy overview is read-only and conversion is disabled',()=>{
 const {db}=setup();try{const before=db.prepare('SELECT COUNT(*) c FROM transfers').get().c;const r=economyOverview(db);
 assert.equal(r.mode,'READ_ONLY');assert.equal(r.llm_applied,false);assert.equal(r.vcur_bridge_enabled,false);
 assert.equal(r.supply.total,r.supply.faucet+r.supply.treasury+r.supply.admin_test_pool+r.supply.players);
 assert.equal(before,db.prepare('SELECT COUNT(*) c FROM transfers').get().c);
 }finally{db.close();}
});
