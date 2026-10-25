import test from 'node:test';
import assert from 'node:assert/strict';
import {openDb,transaction,ensurePlayer,wallet,checkLedger} from '../src/db.mjs';
import {games,createGame,act,getSession} from '../src/games.mjs';
import {evaluateGrid,resolveScatterSpin,generateGrid,SCATTER,MAX_BONUS} from '../src/scatter-rush.mjs';
const make=()=>{const db=openDb(':memory:');const p=transaction(db,()=>ensurePlayer(db,'99902@s.whatsapp.net'));return {db,p};};
const seedGrid=()=>Array.from({length:4},()=>Array(6).fill('🍋'));
const noScatter=()=>Array.from({length:4},()=>['🍒','🍋','🔔','⭐','🍒','🍋']);
test('A1-02 registry and cryptographic grid shape',()=>{
 assert.ok(games().find(g=>g.code==='A1-02'));
 for(let i=0;i<30;i++){const g=generateGrid();assert.equal(g.length,4);assert.ok(g.every(row=>row.length===6));}
});
test('scatter counts DISTINCT columns and pays left-to-right lines once',()=>{
 const g=noScatter();g[0][1]=SCATTER;g[1][1]=SCATTER;g[2][3]=SCATTER;
 const e=evaluateGrid(g,10);assert.deepEqual(e.scatterColumns,[2,4]);assert.equal(e.payout,0);
 const filled=seedGrid();const res=evaluateGrid(filled,10);assert.equal(res.lines.length,4);assert.equal(res.payout,4*10*3*8);
});
test('3 scatter columns start bonus, following retriggers increment +5 only, hard cap 50',()=>{
 const a=noScatter();a[0][0]=SCATTER;a[1][2]=SCATTER;a[2][5]=SCATTER;
 const b=noScatter();b[0][0]=SCATTER;b[0][1]=SCATTER;b[0][3]=SCATTER;
 let state=resolveScatterSpin({phase:'READY',bet:10},a,10);
 assert.equal(state.last.free_spins_added,10);assert.equal(state.bonus.remaining,10);
 for(let i=0;i<10;i++){
   state=resolveScatterSpin(state,b,10);
   assert.equal(state.last.is_free_spin,true);
   assert.equal(state.last.stake_charged,0);
   assert.ok(state.bonus.awarded<=MAX_BONUS);
 }
 assert.equal(state.bonus.awarded,50);
 assert.equal(state.bonus.remaining,40);
 assert.equal(state.bonus.played,10);
 state=resolveScatterSpin(state,b,10);
 assert.equal(state.last.free_spins_added,0);
 assert.equal(state.bonus.awarded,50);
 while(state.bonus.remaining>0)state=resolveScatterSpin(state,noScatter(),10);
 assert.equal(state.phase,'READY');assert.equal(state.bonus.remaining,0);assert.equal(state.bonus.played,50);
 state=resolveScatterSpin(state,noScatter(),10);
 assert.equal(state.bonus.awarded,0);assert.equal(state.last.stake_charged,10);
});
test('6 scattered columns give 25 initial spins; bonus cannot change bet',()=>{
 const grid=noScatter();for(let c=0;c<6;c++)grid[0][c]=SCATTER;
 const state=resolveScatterSpin({phase:'READY',bet:20},grid,20);
 assert.equal(state.last.free_spins_added,25);
 assert.throws(()=>resolveScatterSpin(state,noScatter(),50),e=>e.status===409&&e.code==='BET_LOCKED_DURING_BONUS');
});
test('server session persists bonus, repeat commands do not duplicate wallet changes',()=>{
 const {db,p}=make();const created=createGame(db,p,'A1-02',10);
 assert.equal(created.session.phase,'READY');
 const cmd={command_id:'scatter-spin-test-12345',expected_version:1,action:'SPIN',bet:10};
 const one=act(db,p,created.session.id,cmd),two=act(db,p,created.session.id,cmd);
 assert.deepEqual(one,two);assert.equal(one.session.version,2);
 assert.ok(Array.isArray(one.session.last.grid)&&one.session.last.grid[0].length===6);
 assert.equal(wallet(db,p),one.balance);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM game_actions').get().n,1);
 assert.throws(()=>act(db,p,created.session.id,{...cmd,command_id:'scatter-spin-other-12345'}),e=>e.code==='STATE_STALE');
 assert.deepEqual(checkLedger(db).imbalanced,[]);assert.deepEqual(checkLedger(db).playerBalancesMismatched,[]);db.close();
});
