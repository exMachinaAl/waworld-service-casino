/** A1-05 Ultimate Fusion. Server-authoritative deterministic state transitions.
 * RNG and sealed pot tickets are generated exclusively on the server.
 * Virtual ACR only; no VCUR or monetary conversion.
 */
import {createHash,randomBytes,randomInt} from 'node:crypto';
import {assert} from './util.mjs';
import {B,evaluateBidirectionalLines,evaluateTopRowBlast} from './slot-rules.mjs';
export const ROWS=4, REELS=6, SCATTER='✨', BLAST='⚡', POT='🏺', MAX_FREE_SPINS=50;
export const SYMBOLS=Object.freeze(['🍒','🍋','🔔','⭐','7️⃣',SCATTER,BLAST,POT,B]);
const WEIGHTED=Object.freeze([
 ...Array(11).fill('🍒'),...Array(9).fill('🍋'),...Array(7).fill('🔔'),
 ...Array(6).fill('⭐'),...Array(4).fill('7️⃣'),...Array(3).fill(SCATTER),
 ...Array(3).fill(BLAST),...Array(3).fill(POT),...Array(2).fill(B)
]);
const LINE_PAY=Object.freeze({'🍒':2,'🍋':3,'🔔':4,'⭐':5,'7️⃣':8,[BLAST]:6});
export const POT_THRESHOLDS=Object.freeze({activity:8,symbols:6,victory:3});
export const POT_OPTIONS=Object.freeze([2,3,5]);
const safeBet=bet=>assert(Number.isSafeInteger(bet)&&bet>=1&&bet<=10000,400,'INVALID_BET');
export const generateFusionGrid=()=>{const topPool=WEIGHTED.filter(s=>s!==BLAST);return Array.from({length:ROWS},(_,r)=>Array.from({length:REELS},()=>r===0&&randomInt(100)<21?BLAST:(r===0?topPool:WEIGHTED)[randomInt((r===0?topPool:WEIGHTED).length)]));};
function columns(grid,symbol){
 const result=[];for(let c=0;c<REELS;c++)if(grid.some(row=>row[c]===symbol))result.push(c+1);
 return result;
}
export function evaluateFusionGrid(grid,bet){
 safeBet(bet);
 assert(Array.isArray(grid)&&grid.length===ROWS&&grid.every(row=>Array.isArray(row)&&row.length===REELS&&row.every(s=>SYMBOLS.includes(s))),400,'INVALID_FUSION_GRID');
 const before=grid.map(row=>[...row]);
 // Scatter and pots are evaluated BEFORE a Blast can replace any symbols.
 const scatterColumns=columns(before,SCATTER);
 const potSymbols=before.flat().filter(s=>s===POT).length;
 // Scatter + pots are detected BEFORE top-down A transformation.
 const {grid_after:after,trigger_columns:triggerColumns,activated}=evaluateTopRowBlast(before,{a:BLAST,minTopColumns:4});
 const {lines,payout:linePayout}=evaluateBidirectionalLines(after,bet,LINE_PAY);
 const blastMultiplier=activated?2+2*(triggerColumns.length-4):0;
 const blastPayout=bet*blastMultiplier,payout=linePayout+blastPayout;
 assert(Number.isSafeInteger(payout)&&payout>=0,500,'FUSION_PAYOUT_INVALID');
 return {grid_before:before,grid_after:after,grid:after,
   scatter_columns:scatterColumns,scatter_count:scatterColumns.length,
   trigger_columns:triggerColumns,blast_activated:activated,
   pot_symbols:potSymbols,lines,line_payout:linePayout,
   blast_multiplier:blastMultiplier,blast_payout:blastPayout,payout};
}
function shuffledOptions(){const a=[...POT_OPTIONS];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function newTicket(source,bet){
 const options=shuffledOptions(),nonce=randomBytes(16).toString('hex');
 const commit=createHash('sha256').update(JSON.stringify({source,bet,options,nonce})).digest('hex');
 return {source,bet,options,nonce,commit};
}
export function verifyFusionTicket(t){
 return Boolean(t&&createHash('sha256').update(JSON.stringify({source:t.source,bet:t.bet,options:t.options,nonce:t.nonce})).digest('hex')===t.commit);
}
export function initialFusionState(bet){
 safeBet(bet);return {phase:'READY',bet,bonus:{awarded:0,played:0,remaining:0},
   meters:{activity:0,symbols:0,victory:0},pot_queue:[],last:null,last_open:null};
}
/** Each paid round costs bet; free spins do not. Pot choice suspends, not resets, bonus. */
export function resolveFusionSpin(state,grid,bet){
 const pending=state.pot_queue?.length??0;
 assert(state.phase!=='POT_CHOICE'&&pending===0,409,'FUSION_POT_CHOICE_REQUIRED');
 assert(state.phase==='READY'||state.phase==='BONUS',409,'FUSION_NOT_READY');
 safeBet(bet);
 const isFree=state.phase==='BONUS'&&state.bonus.remaining>0;
 if(isFree)assert(bet===state.bet,409,'BET_LOCKED_DURING_BONUS');
 const result=evaluateFusionGrid(grid,bet);
 const bonus=isFree?{...state.bonus,remaining:state.bonus.remaining-1,played:state.bonus.played+1}
   :{awarded:0,played:0,remaining:0};
 let added=0;
 if(result.scatter_count>=3){
   const request=isFree?5:10+5*(result.scatter_count-3);
   added=Math.min(request,MAX_FREE_SPINS-bonus.awarded);
   bonus.awarded+=added;bonus.remaining+=added;
 }
 assert(bonus.awarded<=MAX_FREE_SPINS&&bonus.played+bonus.remaining===bonus.awarded,500,'FUSION_BONUS_INVARIANT');
 const meters={...state.meters},potQueue=[...(state.pot_queue??[])],unlocked=[];
 const increments={activity:isFree?0:1,symbols:result.pot_symbols,victory:result.lines.length>0?1:0};
 for(const [key,threshold] of Object.entries(POT_THRESHOLDS)){
   meters[key]+=increments[key];
   while(meters[key]>=threshold){meters[key]-=threshold;
     const ticket=newTicket(key,bet);potQueue.push(ticket);unlocked.push({source:key,commit:ticket.commit});}
 }
 const phase=potQueue.length?'POT_CHOICE':bonus.remaining>0?'BONUS':'READY';
 const last={...result,is_free_spin:isFree,free_spins_added:added,
   bonus_awarded:bonus.awarded,bonus_played:bonus.played,bonus_remaining:bonus.remaining,
   stake_charged:isFree?0:bet,net:result.payout-(isFree?0:bet),unlocked};
 return {...state,bet,phase,bonus,meters,pot_queue:potQueue,last,last_open:null};
}
export function resolveFusionChoice(state,pick){
 assert(state.phase==='POT_CHOICE'&&Array.isArray(state.pot_queue)&&state.pot_queue.length>0,409,'NO_FUSION_POT');
 assert(Number.isInteger(pick)&&pick>=0&&pick<3,400,'INVALID_POT_CHOICE');
 const [ticket,...queue]=state.pot_queue;
 assert(verifyFusionTicket(ticket),500,'FUSION_COMMIT_MISMATCH');
 const multiplier=ticket.options[pick],payout=ticket.bet*multiplier;
 const last_open={source:ticket.source,selected:pick,options:[...ticket.options],nonce:ticket.nonce,
   commit:ticket.commit,multiplier,payout};
 return {...state,phase:queue.length?'POT_CHOICE':state.bonus.remaining>0?'BONUS':'READY',
   pot_queue:queue,last_open};
}
export function publicFusionState(state){
 const {pot_queue=[],...publicState}=state;
 return {...publicState,pot_pending:pot_queue.length,pot_commit:pot_queue[0]?.commit??null,
  pot_source:pot_queue[0]?.source??null};
}
