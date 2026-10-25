/** A1-02 Scatter Rush: server-authoritative, virtual-only ACR math. */
import {randomInt} from 'node:crypto';
import {assert} from './util.mjs';
export const SCATTER='✨';
export const REELS=6, ROWS=4, MAX_BONUS=50;
export const PAYTABLE=Object.freeze({'🍒':2,'🍋':3,'🔔':4,'⭐':5,'7️⃣':8});
const WEIGHTED=['🍒','🍒','🍒','🍒','🍒','🍒','🍒','🍒','🍒',
 '🍋','🍋','🍋','🍋','🍋','🍋','🍋','🍋',
 '🔔','🔔','🔔','🔔','🔔','🔔','🔔',
 '⭐','⭐','⭐','⭐','⭐','⭐','⭐',
 '7️⃣','7️⃣','7️⃣','7️⃣',SCATTER];
export const generateGrid=()=>Array.from({length:ROWS},()=>Array.from({length:REELS},()=>WEIGHTED[randomInt(WEIGHTED.length)]));
export function evaluateGrid(grid,bet){
 assert(Array.isArray(grid)&&grid.length===ROWS&&grid.every(row=>Array.isArray(row)&&row.length===REELS&&row.every(s=>WEIGHTED.includes(s))),400,'INVALID_SCATTER_GRID');
 assert(Number.isSafeInteger(bet)&&[5,10,20,50].includes(bet),400,'INVALID_BET');
 const scatterColumns=[];
 for(let col=0;col<REELS;col++)if(grid.some(row=>row[col]===SCATTER))scatterColumns.push(col+1);
 const lines=[];let payout=0;
 grid.forEach((row,index)=>{
   const symbol=row[0];if(symbol===SCATTER)return;
   let count=0;while(count<REELS&&row[count]===symbol)count++;
   if(count>=3){const mult=PAYTABLE[symbol]*(2**(count-3));const amount=bet*mult;lines.push({row:index+1,symbol,count,multiplier:mult,payout:amount});payout+=amount;}
 });
 return {scatterColumns,lines,payout};
}
/** Pure state reducer, so retriggers and reward calculations can be unit-tested. */
export function resolveScatterSpin(state,grid,bet){
 const inBonus=state.phase==='BONUS'&&state.bonus?.remaining>0;
 if(inBonus)assert(bet===state.bet,409,'BET_LOCKED_DURING_BONUS');
 const result=evaluateGrid(grid,bet);
 const bonus=inBonus?{...state.bonus,remaining:state.bonus.remaining-1,played:state.bonus.played+1}:{awarded:0,played:0,remaining:0};
 let added=0;
 if(result.scatterColumns.length>=3){
   const request=inBonus?5:10+(result.scatterColumns.length-3)*5;
   added=Math.min(request,MAX_BONUS-bonus.awarded);
   bonus.awarded+=added;bonus.remaining+=added;
 }
 assert(bonus.awarded<=MAX_BONUS&&bonus.remaining>=0&&bonus.played+bonus.remaining===bonus.awarded,500,'BONUS_INVARIANT');
 const last={grid,lines:result.lines,scatter_columns:result.scatterColumns,scatter_count:result.scatterColumns.length,
   is_free_spin:inBonus,free_spins_added:added,bonus_awarded:bonus.awarded,
   bonus_played:bonus.played,bonus_remaining:bonus.remaining,
   payout:result.payout,stake_charged:inBonus?0:bet,net:result.payout-(inBonus?0:bet)};
 return {...state,phase:bonus.remaining>0?'BONUS':'READY',bet,bonus,last};
}
