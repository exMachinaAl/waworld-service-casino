import test from 'node:test';
import assert from 'node:assert/strict';
import {openDb,ensurePlayer,transaction,wallet,checkLedger} from '../src/db.mjs';
import {games,createGame,act,getSession} from '../src/games.mjs';
import {ROWS,REELS,SCATTER,BLAST,POT,MAX_FREE_SPINS,generateFusionGrid,evaluateFusionGrid,initialFusionState,resolveFusionSpin,resolveFusionChoice,publicFusionState,verifyFusionTicket} from '../src/ultimate-fusion.mjs';
const grid=()=>Array.from({length:ROWS},()=>Array(REELS).fill('🍒'));
const make=()=>{const db=openDb(':memory:');const pid=transaction(db,()=>ensurePlayer(db,'fusion-test@s.whatsapp.net'));return {db,pid};};
test('A1-05 is registered and crypto-generated grid is 6x4',()=>{
 assert.ok(games().some(g=>g.code==='A1-05'));
 const g=generateFusionGrid();assert.equal(g.length,4);assert.ok(g.every(row=>row.length===6));
});
test('fusion preserves Scatter before top-row A blast and guci count',()=>{
 const g=grid();
 g[1][0]=SCATTER;g[1][1]=SCATTER;g[2][2]=SCATTER;g[3][5]=POT;
 for(const c of [0,1,2,3])g[0][c]=BLAST;
 const o=evaluateFusionGrid(g,10);
 assert.deepEqual(o.scatter_columns,[1,2,3]);assert.deepEqual(o.trigger_columns,[1,2,3,4]);
 assert.equal(o.blast_activated,true);assert.equal(o.pot_symbols,1);
 assert.ok(o.grid_after.every(row=>row.slice(0,4).every(s=>s===BLAST)));
 assert.equal(o.lines.length,4);assert.equal(o.line_payout,4*10*6*2);assert.equal(o.blast_payout,20);
 assert.equal(o.payout,500);
});
test('fusion requires distinct trigger columns, payout row only once',()=>{
 const g=grid();g[0][2]=BLAST;g[1][2]=BLAST;g[2][2]=BLAST;
 const o=evaluateFusionGrid(g,10);assert.deepEqual(o.trigger_columns,[3]);assert.equal(o.blast_activated,false);
 assert.ok(o.lines.length<=ROWS);
 assert.throws(()=>evaluateFusionGrid([[]],10),e=>e.code==='INVALID_FUSION_GRID');
});
test('free spins +5 retrigger, locked bet, total granted <=50',()=>{
 const g=grid();g[0][0]=SCATTER;g[0][1]=SCATTER;g[0][2]=SCATTER;
 let s=resolveFusionSpin(initialFusionState(10),g,10);
 assert.equal(s.phase,'BONUS');assert.equal(s.bonus.awarded,10);assert.equal(s.bonus.remaining,10);
 for(let i=0;i<40;i++){
  if(s.phase==='POT_CHOICE')while(s.phase==='POT_CHOICE')s=resolveFusionChoice(s,0);
  assert.throws(()=>resolveFusionSpin(s,g,20),e=>e.code==='BET_LOCKED_DURING_BONUS');
  s=resolveFusionSpin(s,g,10);
  assert.ok(s.bonus.awarded<=50);
  assert.equal(s.bonus.awarded,s.bonus.played+s.bonus.remaining);
 }
 assert.equal(s.bonus.awarded,MAX_FREE_SPINS);
 assert.equal(s.bonus.played,40);
});
test('pot choice suspends and resumes free spins; ticket sealed before choice',()=>{
 const g=grid();g[0][0]=SCATTER;g[0][1]=SCATTER;g[0][2]=SCATTER;
 g[0][3]=POT;g[0][4]=POT;g[0][5]=POT;g[1][3]=POT;g[1][4]=POT;g[1][5]=POT;
 let s=resolveFusionSpin(initialFusionState(10),g,10);
 assert.equal(s.phase,'POT_CHOICE');assert.ok(s.bonus.remaining>0);
 const first=s.pot_queue[0];assert.ok(verifyFusionTicket(first));
 const publicly=publicFusionState(s);assert.equal('pot_queue' in publicly,false);
 assert.equal(JSON.stringify(publicly).includes(first.nonce),false);
 assert.throws(()=>resolveFusionSpin(s,g,10),e=>e.code==='FUSION_POT_CHOICE_REQUIRED');
 const after=resolveFusionChoice(s,1);
 assert.equal(after.last_open.payout,first.options[1]*10);
 assert.deepEqual(after.last_open.options,first.options);
 while(after.phase==='POT_CHOICE')break;
 assert.equal(after.phase,'BONUS');assert.equal(after.bonus.remaining,s.bonus.remaining);
});
test('public game session hides unrevealed pot options and nonce',()=>{
 const {db,pid}=make();const c=createGame(db,pid,'A1-05',10);
 assert.equal(c.session.game_code,'A1-05');assert.equal(c.session.bonus.remaining,0);
 // Enter stored pending state with cryptographically sealed ticket, preserve game entry.
 let state=initialFusionState(10);
 const g=grid();for(let i=0;i<6;i++)g[0][i]=POT;
 state=resolveFusionSpin(state,g,10);
 db.prepare('UPDATE game_sessions SET state_json=? WHERE id=?').run(JSON.stringify(state),c.session.id);
 const projection=getSession(db,c.session.id,pid);
 assert.ok(projection.pot_pending>=1);assert.equal('pot_queue' in projection,false);
 assert.equal(JSON.stringify(projection).includes(state.pot_queue[0].nonce),false);
 assert.deepEqual(checkLedger(db).imbalanced,[]);
 db.close();
});
test('fusion server action idempotent, stale refused, ACR ledger remains balanced',()=>{
 const {db,pid}=make();const c=createGame(db,pid,'A1-05',10);
 const cmd={command_id:'fusion-spin-test-command-0001',expected_version:1,action:'SPIN',bet:10};
 const first=act(db,pid,c.session.id,cmd);const dupe=act(db,pid,c.session.id,cmd);
 assert.deepEqual(first,dupe);assert.equal(first.session.version,2);
 assert.equal(wallet(db,pid),first.balance);
 assert.throws(()=>act(db,pid,c.session.id,{...cmd,command_id:'fusion-spin-test-command-0002'}),e=>e.code==='STATE_STALE');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM game_actions').get().n,1);
 assert.deepEqual(checkLedger(db).imbalanced,[]);assert.deepEqual(checkLedger(db).playerBalancesMismatched,[]);
 db.close();
});
test('fusion pot reward pays once and ticket cannot be replayed after choice',()=>{
 const {db,pid}=make();const c=createGame(db,pid,'A1-05',10);
 let state=initialFusionState(10);const g=grid();for(let i=0;i<6;i++)g[0][i]=POT;
 state=resolveFusionSpin(state,g,10);
 db.prepare('UPDATE game_sessions SET state_json=? WHERE id=?').run(JSON.stringify(state),c.session.id);
 const cmd={command_id:'fusion-pot-test-command-001',expected_version:1,action:'OPEN_POT',choice:2};
 const first=act(db,pid,c.session.id,cmd);const again=act(db,pid,c.session.id,cmd);
 assert.deepEqual(first,again);assert.equal(first.balance,500+first.session.last_open.payout);
 assert.throws(()=>act(db,pid,c.session.id,{...cmd,command_id:'fusion-pot-test-command-002'}),e=>e.code==='STATE_STALE');
 assert.deepEqual(checkLedger(db).imbalanced,[]);db.close();
});
