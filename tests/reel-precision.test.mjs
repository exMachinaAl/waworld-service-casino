import test from 'node:test';
import assert from 'node:assert/strict';
import {FILLER_SYMBOLS,makeReelTape,reelPlan,reelTravelPx,reelSnapErrorPx,validGrid} from '../web/src/reel-precision.mjs';

test('reel tape begins with previously visible symbols and ends on exact authoritative server result',()=>{
 for(const [rows,columns,theme] of [[3,3,'classic'],[4,6,'scatter'],[3,5,'guci'],[4,5,'blast']]){
  const before=Array.from({length:rows},(_,r)=>Array.from({length:columns},(_,c)=>`old-${r}-${c}`));
  const target=Array.from({length:rows},(_,r)=>Array.from({length:columns},(_,c)=>`win-${r}-${c}`));
  for(let c=0;c<columns;c++){
    const tape=makeReelTape(before,target,c,theme);
    assert.deepEqual(tape.cells.slice(0,rows),before.map(row=>row[c]));
    assert.deepEqual(tape.cells.slice(tape.travelCells),target.map(row=>row[c]));
    assert.ok(tape.cells.every(v=>typeof v==='string'));
    assert.ok(FILLER_SYMBOLS[theme]);
  }
 }
});
test('measured fractional pixel rows land exactly with zero snap error',()=>{
 for(const height of [120,195,235.5,320.25,425.125]){
  for(const rows of [3,4]){
   for(const cells of [23,26,29,33]){
    const travel=reelTravelPx(cells,height,rows);
    assert.equal(reelSnapErrorPx(travel,cells,height,rows),0);
    assert.ok(Math.abs(-travel-(height/rows)*cells)<0.0000001);
   }
  }
 }
});
test('column stop timeline finishes before the visible state is revealed',()=>{
 for(const [ms,cols] of [[1800,3],[2200,6],[1550,5],[1950,5]]){
  const p=reelPlan(ms,cols);
  assert.ok(p.settleByMs <= ms-100);
  assert.ok(p.durationMs > 500);
  assert.ok(p.staggerMs > 0);
 }
});
test('reject damaged matrices and bad measurements',()=>{
 assert.equal(validGrid([['x']],1,2),false);
 assert.throws(()=>makeReelTape([['a']],[[1]],0,'classic'));
 assert.throws(()=>reelTravelPx(4,0,3));
 assert.throws(()=>reelPlan(0,4));
});
test('deterministic reels: same inputs produce same tape, no random source',()=>{
 const a=[['🍒','✨'],['🍋','🍒'],['7️⃣','🍋']];const b=[['✨','✨'],['7️⃣','7️⃣'],['🍒','🍒']];
 assert.deepEqual(makeReelTape(a,b,1,'scatter'),makeReelTape(a,b,1,'scatter'));
});
