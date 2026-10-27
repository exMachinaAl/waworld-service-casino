import test from 'node:test';
import assert from 'node:assert/strict';
import {generateBlastGrid,evaluateBlastGrid,resolveBlastSpin,ROWS,REELS,TRIGGER} from '../src/column-blast.mjs';
import {games,createGame,act,getSession} from '../src/games.mjs';
import {openDb,ensurePlayer,transaction,wallet,checkLedger} from '../src/db.mjs';
const base=()=>Array.from({length:4},()=>['🍒','🍋','🔔','⭐','7️⃣']);
const setup=()=>{const db=openDb(':memory:');const pid=transaction(db,()=>ensurePlayer(db,'blast-user@wa'));return {db,pid};};
test('A1-04 registered; generated grid 5x4 with valid symbols',()=>{
 assert.ok(games().some(g=>g.code==='A1-04'));
 for(let i=0;i<30;i++){const grid=generateBlastGrid();assert.equal(grid.length,ROWS);assert.ok(grid.every(row=>row.length===REELS));assert.doesNotThrow(()=>evaluateBlastGrid(grid,10));}
 assert.throws(()=>evaluateBlastGrid([['X']],10),e=>e.code==='INVALID_BLAST_GRID');
 assert.throws(()=>evaluateBlastGrid(base(),0),e=>e.code==='INVALID_BET');
});
test('three trigger symbols on same column DO NOT activate feature',()=>{
 const grid=base();grid[0][0]=TRIGGER;grid[1][0]=TRIGGER;grid[2][0]=TRIGGER;
 const out=evaluateBlastGrid(grid,10);assert.deepEqual(out.trigger_columns,[1]);assert.equal(out.activated,false);assert.deepEqual(out.grid_before,out.grid_after);assert.equal(out.blast_payout,0);
});
test('three A on top row do NOT activate: must exceed three',()=>{
 const g=base();for(const col of [0,1,2])g[0][col]=TRIGGER;
 const result=evaluateBlastGrid(g,10);assert.equal(result.activated,false);
 assert.deepEqual(result.trigger_columns,[1,2,3]);
});
test('four A on TOP row expand those columns TOP DOWN while preserving original',()=>{
 const g=base();for(const col of [0,1,2,3])g[0][col]=TRIGGER;
 const original=structuredClone(g),out=evaluateBlastGrid(g,10);
 assert.equal(out.activated,true);assert.deepEqual(out.trigger_columns,[1,2,3,4]);
 assert.deepEqual(g,original);
 for(const row of out.grid_after)assert.deepEqual(row.slice(0,4),Array(4).fill(TRIGGER));
 assert.equal(out.lines.length,4);assert.equal(out.line_payout,480);assert.equal(out.blast_payout,20);assert.equal(out.payout,500);
});
test('B complements ordinary paylines from right; B never triggers Blast',()=>{
 const g=base();g[0]=['🍋','🔷','🍒','🍒','🍒'];g[1]=['⚡','⚡','⚡','🔷','🍋'];
 const out=evaluateBlastGrid(g,10);
 assert.equal(out.activated,false);
 assert.deepEqual(out.trigger_columns,[]); // A di baris bawah tidak dihitung
 assert.ok(out.lines.some(l=>l.row===1&&l.direction==='right'&&l.count===4&&l.symbol==='🍒'));
});
test('five top-row A give bounded rewards and only one payout per full line',()=>{
 const g=base();for(let c=0;c<5;c++)g[0][c]=TRIGGER;
 const out=evaluateBlastGrid(g,50);assert.equal(out.trigger_columns.length,5);
 assert.equal(out.blast_multiplier,4);assert.equal(out.lines.length,4);
 assert.equal(out.line_payout,4*50*6*4);assert.equal(out.blast_payout,200);assert.equal(out.payout,5000);
});
test('server action idempotence, balance, stale version, and rollback for invalid actions',()=>{
 const {db,pid}=setup();const created=createGame(db,pid,'A1-04',10);
 const c={command_id:'blast-test-command-0001',expected_version:created.session.version,action:'SPIN',bet:10};
 const r=act(db,pid,created.session.id,c);assert.deepEqual(act(db,pid,created.session.id,c),r);assert.equal(r.session.version,2);
 assert.equal(wallet(db,pid),500-10+r.session.last.payout);
 assert.equal(r.session.last.grid_before.length,4);assert.equal(r.session.last.grid_after.length,4);
 assert.throws(()=>act(db,pid,created.session.id,{...c,command_id:'blast-second-command-002'}),e=>e.code==='STATE_STALE');
 assert.throws(()=>act(db,pid,created.session.id,{...c,command_id:'blast-wrong-action-003',expected_version:2,action:'OPEN_POT'}),e=>e.code==='INVALID_ACTION');
 assert.deepEqual(checkLedger(db).imbalanced,[]);assert.deepEqual(checkLedger(db).playerBalancesMismatched,[]);
 assert.equal(getSession(db,created.session.id,pid).version,2);db.close();
});
