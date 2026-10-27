/** A1-03 Mystery Guci: deterministic reducer; crypto used only for server-side random draws. */
import {randomInt,randomBytes,createHash} from 'node:crypto';
import {assert} from './util.mjs';
import {evaluateBidirectionalLines} from './slot-rules.mjs';
export const ROWS=3,REELS=5;
export const POT='🏺';
const SYMBOLS=['🍒','🍋','🔔','⭐','7️⃣',POT];
const WEIGHTED=['🍒','🍒','🍒','🍒','🍒','🍒','🍒','🍒','🍋','🍋','🍋','🍋','🍋','🍋','🍋','🔔','🔔','🔔','🔔','🔔','⭐','⭐','⭐','⭐','7️⃣','7️⃣','7️⃣',POT,POT];
const PAY=Object.freeze({'🍒':2,'🍋':3,'🔔':4,'⭐':5,'7️⃣':8});
export const THRESHOLDS=Object.freeze({activity:8,symbols:6,victory:3});
const REWARD_MULTIPLIERS=Object.freeze([2,3,5]);
export const generatePotGrid=()=>Array.from({length:ROWS},()=>Array.from({length:REELS},()=>WEIGHTED[randomInt(WEIGHTED.length)]));
export function evaluatePotGrid(grid,bet){
 assert(Array.isArray(grid)&&grid.length===ROWS&&grid.every(row=>Array.isArray(row)&&row.length===REELS&&row.every(s=>SYMBOLS.includes(s))),400,'INVALID_POT_GRID');
 assert((Number.isSafeInteger(bet)&&bet>=1&&bet<=10000),400,'INVALID_BET');
 const symbolCount=grid.flat().filter(s=>s===POT).length;
 const {payout,lines}=evaluateBidirectionalLines(grid,bet,PAY);
 return {symbolCount,payout,lines};
}
function shuffle(list){const result=[...list];for(let i=result.length-1;i>0;i--){const j=randomInt(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
function newTicket(source,bet){
 const options=shuffle(REWARD_MULTIPLIERS),nonce=randomBytes(16).toString('hex');
 const commit=createHash('sha256').update(JSON.stringify({source,bet,options,nonce})).digest('hex');
 return {source,bet,options,nonce,commit};
}
export function verifyTicket(ticket){
 return createHash('sha256').update(JSON.stringify({source:ticket.source,bet:ticket.bet,options:ticket.options,nonce:ticket.nonce})).digest('hex')===ticket.commit;
}
export function initialPotState(bet){return {phase:'READY',bet,meters:{activity:0,symbols:0,victory:0},pot_queue:[],last:null,last_open:null};}
export function resolvePotSpin(state,grid,bet){
 assert(state.phase==='READY' && (!state.pot_queue||state.pot_queue.length===0),409,'POT_CHOICE_REQUIRED');
 const outcome=evaluatePotGrid(grid,bet);
 const meters={...state.meters};const newly=[];
 const increments={activity:1,symbols:outcome.symbolCount,victory:outcome.lines.length>0?1:0};
 const queue=[...(state.pot_queue??[])];
 for(const [key,threshold] of Object.entries(THRESHOLDS)){
  meters[key]+=increments[key];
  while(meters[key]>=threshold){meters[key]-=threshold;const ticket=newTicket(key,bet);queue.push(ticket);newly.push({source:key,commit:ticket.commit});}
 }
 const last={grid,lines:outcome.lines,pot_symbols:outcome.symbolCount,payout:outcome.payout,stake_charged:bet,net:outcome.payout-bet,unlocked:newly};
 return {...state,phase:queue.length?'POT_CHOICE':'READY',bet,meters,pot_queue:queue,last,last_open:null};
}
export function resolvePotChoice(state,pick){
 assert(state.phase==='POT_CHOICE'&&Array.isArray(state.pot_queue)&&state.pot_queue.length>0,409,'NO_POT_BONUS');
 assert(Number.isInteger(pick)&&pick>=0&&pick<3,400,'INVALID_POT_CHOICE');
 const [ticket,...queue]=state.pot_queue;
 assert(verifyTicket(ticket),500,'POT_COMMIT_MISMATCH');
 const multiplier=ticket.options[pick],payout=ticket.bet*multiplier;
 const last_open={source:ticket.source,selected:pick,options:ticket.options,nonce:ticket.nonce,commit:ticket.commit,multiplier,payout};
 return {...state,phase:queue.length?'POT_CHOICE':'READY',pot_queue:queue,last_open};
}
/** Public projection: do not reveal unopened reward options or nonces. */
export function publicPotState(state){
 const {pot_queue=[],...visible}=state;
 return {...visible,pot_pending:pot_queue.length,pot_commit:pot_queue[0]?.commit??null,pot_source:pot_queue[0]?.source??null};
}
