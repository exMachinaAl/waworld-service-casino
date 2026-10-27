import test from 'node:test';
import assert from 'node:assert/strict';
import {openDb,ensurePlayer,transaction,wallet,checkLedger} from '../src/db.mjs';
import {games,createGame,act,getSession} from '../src/games.mjs';
import {POT,generatePotGrid,evaluatePotGrid,initialPotState,resolvePotSpin,resolvePotChoice,publicPotState,verifyTicket} from '../src/mystery-guci.mjs';
const blank=()=>Array.from({length:3},()=>['🍒','🍋','🔔','⭐','7️⃣']);
const setup=()=>{const db=openDb(':memory:');const pid=transaction(db,()=>ensurePlayer(db,'potplayer@wa'));return {db,pid};};
test('registry and shape for A1-03 + grid validation',()=>{
 assert.ok(games().find(g=>g.code==='A1-03'));
 for(let i=0;i<20;i++){const grid=generatePotGrid();assert.equal(grid.length,3);assert.ok(grid.every(row=>row.length===5));}
 assert.throws(()=>evaluatePotGrid([['x']],10),e=>e.code==='INVALID_POT_GRID');
});
test('matching lines and guci symbols evaluated separately',()=>{
 const grid=blank();grid[0]=['🍋','🍋','🍋','🍋','🍒'];grid[1][1]=POT;grid[2][3]=POT;
 const r=evaluatePotGrid(grid,10);assert.equal(r.symbolCount,2);assert.equal(r.payout,60);assert.equal(r.lines.length,1);
});
test('activity threshold commits sealed choices and does not leak the prizes',()=>{
 let state=initialPotState(10);
 for(let i=0;i<8;i++)state=resolvePotSpin(state,blank(),10);
 assert.equal(state.phase,'POT_CHOICE');assert.equal(state.pot_queue.length,1);
 assert.equal(state.pot_queue[0].source,'activity');assert.ok(verifyTicket(state.pot_queue[0]));
 const projection=publicPotState(state);assert.equal(projection.pot_pending,1);
 assert.ok(!JSON.stringify(projection).includes('options'));
 assert.ok(!JSON.stringify(projection).includes('nonce'));
 assert.throws(()=>resolvePotSpin(state,blank(),10),e=>e.code==='POT_CHOICE_REQUIRED');
 assert.throws(()=>resolvePotChoice(state,3),e=>e.code==='INVALID_POT_CHOICE');
 const selected=resolvePotChoice(state,1);assert.equal(selected.phase,'READY');assert.equal(selected.last_open.payout,10*selected.last_open.multiplier);
 assert.equal(selected.last_open.commit,projection.pot_commit);
 assert.throws(()=>resolvePotChoice(selected,1),e=>e.code==='NO_POT_BONUS');
});
test('symbol and victory meters trigger separate tickets and preserve queue',()=>{
 let state=initialPotState(10);
 const grid=Array.from({length:3},(_,i)=>['🍒','🍒','🍒',i===0?POT:'🍒',i===0?POT:'🍒']);
 for(let i=0;i<3;i++)state=resolvePotSpin(state,grid,10);
 assert.equal(state.phase,'POT_CHOICE');assert.deepEqual(state.pot_queue.map(t=>t.source),['symbols','victory']);
 const first=resolvePotChoice(state,0);assert.equal(first.phase,'POT_CHOICE');assert.equal(first.pot_queue.length,1);
 const second=resolvePotChoice(first,2);assert.equal(second.phase,'READY');assert.equal(second.pot_queue.length,0);
});
test('server roundtrip: idempotent choice, no bet while pending, ledger remains balanced',()=>{
 const {db,pid}=setup();const created=createGame(db,pid,'A1-03',10);
 assert.equal(created.session.phase,'READY');
 let version=created.session.version,session=created.session;
 for(let i=0;i<200&&session.phase!=='POT_CHOICE';i++){
  const cmd={command_id:`guci-paid-spin-${String(i).padStart(4,'0')}`,expected_version:version,action:'SPIN',bet:10};
  const result=act(db,pid,session.id,cmd);session=result.session;version=session.version;
 }
 assert.equal(session.phase,'POT_CHOICE');assert.ok(session.pot_pending>0);
 assert.ok(!JSON.stringify(session).includes('pot_queue'));assert.ok(!JSON.stringify(session).includes('nonce'));
 const bad={command_id:'guci-spin-block-00001',expected_version:version,action:'SPIN',bet:50};
 assert.throws(()=>act(db,pid,session.id,bad),e=>e.code==='POT_CHOICE_REQUIRED');
 const before=wallet(db,pid);
 const choice={command_id:'guci-open-choice-00001',expected_version:version,action:'OPEN_POT',choice:1,bet:50};
 const result=act(db,pid,session.id,choice);
 assert.equal(wallet(db,pid),before+result.session.last_open.payout);
 assert.deepEqual(result,act(db,pid,session.id,choice));
 assert.equal(result.session.last_open.payout,result.session.last_open.multiplier*10);
 assert.throws(()=>act(db,pid,session.id,{...choice,command_id:'guci-new-choice-00002'}),e=>e.code==='STATE_STALE');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM game_actions WHERE command_id=?').get('guci-open-choice-00001').n,1);
 assert.deepEqual(checkLedger(db).imbalanced,[]);assert.deepEqual(checkLedger(db).playerBalancesMismatched,[]);
 db.close();
});
