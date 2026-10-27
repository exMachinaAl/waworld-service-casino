import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateBidirectionalLines,A,B,evaluateTopRowBlast} from '../src/slot-rules.mjs';
import {evaluateGrid} from '../src/scatter-rush.mjs';
import {evaluatePotGrid} from '../src/mystery-guci.mjs';
import {evaluateFusionGrid} from '../src/ultimate-fusion.mjs';
import {evaluateBlastGrid} from '../src/column-blast.mjs';
import {rotorLandingAngle,pocketColor,pocketPath,WHEEL_ORDER} from '../web/src/roulette-motion.mjs';
import {normalizeWins} from '../web/src/win-lines.mjs';
const pay={'🍒':2,'🍋':3,'🔔':4,'⭐':5,'7️⃣':8,[A]:6};
test('right-side matches are paid with correct starting coordinate and direction',()=>{
 const x=evaluateBidirectionalLines([['🍋','🍒','🍒','🍒','🍒']],10,pay);
 assert.equal(x.lines.length,1);assert.deepEqual([x.lines[0].direction,x.lines[0].start,x.lines[0].end,x.lines[0].count],['right',2,5,4]);
 const n=normalizeWins({lines:x.lines},1,5);assert.equal(n[0].start,2);
});
test('full width matches paid only once, no left/right double-credit',()=>{
 const x=evaluateBidirectionalLines([['🍒','🍒','🍒','🍒','🍒']],10,pay);assert.equal(x.lines.length,1);assert.equal(x.lines[0].payout,80);
});
test('distinct left and right runs may win independently; B only supports normal symbols',()=>{
 const x=evaluateBidirectionalLines([['🍒','🍒','🍒','🍋','🍋','🍋']],10,pay);
 assert.equal(x.lines.length,2);assert.deepEqual(x.lines.map(l=>l.direction),['left','right']);
 const y=evaluateBidirectionalLines([[B,'🍒','🍒','⭐','🔔']],10,pay);assert.equal(y.lines.length,1);
 assert.equal(y.lines[0].symbol,'🍒');
 assert.equal(evaluateBidirectionalLines([[B,B,B,'🍋']],10,pay).lines[0].direction,'left');
 assert.equal(evaluateBidirectionalLines([[B,B,B,B]],10,pay).payout,0);
});
test('B overlap on opposite winning edges pays only larger mutually-exclusive line',()=>{
 const x=evaluateBidirectionalLines([['🍒','🍒',B,'🍋','🍋']],10,pay);
 assert.equal(x.lines.length,1);assert.equal(x.lines[0].direction,'right');
 assert.equal(x.payout,30);
});
test('A top row needs >=4; A in bottom rows and B cannot activate',()=>{
 const g=Array.from({length:4},()=>Array(5).fill('🍋'));
 g[1]=[A,A,A,A,A];g[0][0]=A;g[0][2]=A;g[0][4]=B;
 const b=evaluateTopRowBlast(g);assert.equal(b.activated,false);assert.deepEqual(b.trigger_columns,[1,3]);
 g[0][1]=A;g[0][3]=A;const a=evaluateTopRowBlast(g);assert.equal(a.activated,true);assert.deepEqual(a.trigger_columns,[1,2,3,4]);
 assert.equal(a.grid_after[3][0],A);assert.equal(a.grid_after[3][4],'🍋');
});
test('Scatter mode includes code A and B, scatter before A blast, B cannot trigger',()=>{
 const g=Array.from({length:4},()=>Array(6).fill('🍋'));
 g[1][0]='✨';g[1][1]='✨';g[1][4]='✨';
 for(const c of [0,1,2,3])g[0][c]=A;
 g[2][5]=B;
 const out=evaluateGrid(g,10);
 assert.equal(out.blast_activated,true);assert.deepEqual(out.scatterColumns,[1,2,5]);
 assert.equal(out.grid_after[1][0],A);assert.equal(out.grid_before[1][0],'✨');
 assert.ok(out.lines.some(l=>l.direction==='left'));
});
test('Mystery Guci and Ultimate Fusion support right-hand payouts',()=>{
 const g=Array.from({length:3},()=>['🏺','🍋','🍒','🍒','🍒']);const x=evaluatePotGrid(g,10);
 assert.equal(x.lines.length,3);assert.ok(x.lines.every(l=>l.direction==='right'));
 const f=Array.from({length:4},()=>['🏺','🍋','🍒','🍒','🍒','🍒']);const o=evaluateFusionGrid(f,10);
 assert.ok(o.lines.some(l=>l.direction==='right'));
});
test('European wheel has 37 unique pockets and every rotor landing aligns desired pocket to north',()=>{
 assert.equal(WHEEL_ORDER.length,37);assert.equal(new Set(WHEEL_ORDER).size,37);
 assert.equal(WHEEL_ORDER[0],0);assert.equal(WHEEL_ORDER[1],32);assert.equal(WHEEL_ORDER.at(-1),26);
 for(const num of WHEEL_ORDER){const i=WHEEL_ORDER.indexOf(num),final=(i*360/37+rotorLandingAngle(num))%360;
  assert.ok(Math.abs(final)<1e-8);assert.match(pocketPath(i),/^M/);
 }
 assert.equal(pocketColor(0),'green');assert.equal(pocketColor(32),'red');assert.equal(pocketColor(15),'black');
});
