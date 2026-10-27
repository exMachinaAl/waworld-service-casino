/** A1-04 Column Blast — deterministic, server-authoritative reducer.
 * All random draws happen on the server; client visualizes the returned outcome.
 * No ACR <-> VCUR bridge is present.
 */
import {randomInt} from 'node:crypto';
import {assert} from './util.mjs';
import {B,evaluateBidirectionalLines,evaluateTopRowBlast} from './slot-rules.mjs';
export const ROWS=4, REELS=5, TRIGGER='⚡', MIN_TRIGGER_COLUMNS=4;
export const SYMBOLS=Object.freeze(['🍒','🍋','🔔','⭐','7️⃣',TRIGGER,B]);
const WEIGHTED=Object.freeze([
 '🍒','🍒','🍒','🍒','🍒','🍒','🍒',
 '🍋','🍋','🍋','🍋','🍋','🍋',
 '🔔','🔔','🔔','🔔','🔔',
 '⭐','⭐','⭐','⭐',
 '7️⃣','7️⃣',TRIGGER,TRIGGER,B,B
]);
const MULTIPLIER=Object.freeze({'🍒':2,'🍋':3,'🔔':4,'⭐':5,'7️⃣':8,[TRIGGER]:6});
export function generateBlastGrid(){
 const topPool=WEIGHTED.filter(s=>s!==TRIGGER);
 return Array.from({length:ROWS},(_,row)=>Array.from({length:REELS},()=>row===0&&randomInt(100)<21?TRIGGER:(row===0?topPool:WEIGHTED)[randomInt((row===0?topPool:WEIGHTED).length)]));
}
export function evaluateBlastGrid(input,bet){
 assert(Number.isSafeInteger(bet)&&bet>=1&&bet<=10000,400,'INVALID_BET');
 assert(Array.isArray(input)&&input.length===ROWS&&input.every(row=>Array.isArray(row)&&row.length===REELS&&row.every(s=>SYMBOLS.includes(s))),400,'INVALID_BLAST_GRID');
 const before=input.map(row=>[...row]);
 // Code A must be present in the TOP row of four or more distinct columns.
 // Code B is a complement (wild for ordinary lines), never an activation trigger.
 const {grid_after:after,trigger_columns:triggerColumns,activated}=evaluateTopRowBlast(before,{a:TRIGGER,minTopColumns:MIN_TRIGGER_COLUMNS});
 const {lines,payout:linePayout}=evaluateBidirectionalLines(after,bet,MULTIPLIER);
 // Trigger can be on non-adjacent reels; fixed, transparent feature reward.
 // This is distinct from row payouts, which never evaluate twice.
 const blastMultiplier=activated?2+(triggerColumns.length-MIN_TRIGGER_COLUMNS)*2:0;
 const blastPayout=bet*blastMultiplier;
 const payout=linePayout+blastPayout;
 assert(Number.isSafeInteger(payout)&&payout>=0,500,'INVALID_BLAST_PAYOUT');
 return {grid_before:before,grid_after:after,trigger_columns:triggerColumns,activated,lines,
  line_payout:linePayout,blast_multiplier:blastMultiplier,blast_payout:blastPayout,payout};
}
export function resolveBlastSpin(state,grid,bet){
 assert(state.phase==='READY',409,'BLAST_NOT_READY');
 const outcome=evaluateBlastGrid(grid,bet);
 return {...state,phase:'READY',bet,last:{...outcome,grid:outcome.grid_after,
  stake_charged:bet,net:outcome.payout-bet}};
}
