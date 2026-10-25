import {randomInt} from 'node:crypto';
import {uuid,now,json,parse,assert,fail} from './util.mjs';
import {transaction,wallet,transfer,accountId} from './db.mjs';
import {generateGrid,resolveScatterSpin} from './scatter-rush.mjs';
const GAMES={
 'A1-01':{name:'Classic Match 3x3',description:'3 horizontal paylines, three identical symbols from left'},
 'A1-02':{name:'Scatter Rush 6x4',description:'6 reels, 4 rows, scatters on 3+ distinct columns, +5 free-spin retrigger (maximum 50 total)'},
 'B1':{name:'European Roulette',description:'European 0-36, red/black/odd/even/number'},
 'B2':{name:'Blackjack Solo',description:'Dealer vs player, hit/stand'}
};
const SYMBOLS=['🍒','🍋','🔔','⭐','7️⃣'];
const PAY=[2,3,4,5,8];
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
export function games(){return Object.entries(GAMES).map(([code,g])=>({code,...g,status:'MVP'}));}
function playerSession(db,sessionId,playerId){
 const r=db.prepare('SELECT * FROM game_sessions WHERE id=? AND player_id=?').get(sessionId,playerId);
 assert(r,404,'SESSION_NOT_FOUND');return r;
}
function project(r){
 const state=parse(r.state_json);const publicState={...state};
 // Dealer hole card and deck must never leak through APIs/SSE/WA.
 if(r.game_code==='B2'&&state.phase==='PLAYER_TURN'){
   delete publicState.deck;
   publicState.dealer=[state.dealer[0],'🂠'];
 } else if(r.game_code==='B2')delete publicState.deck;
 return {id:r.id,game_code:r.game_code,version:r.version,...publicState};
}
export function getSession(db,id,playerId){return project(playerSession(db,id,playerId));}
export function sessionsFor(db,playerId){return db.prepare('SELECT id,game_code,version,updated_ms FROM game_sessions WHERE player_id=? ORDER BY updated_ms DESC LIMIT 30').all(playerId);}
function checkBet(bet){assert(Number.isSafeInteger(bet)&&[5,10,20,50].includes(bet),400,'INVALID_BET');}
function shuffledDeck(){const d=[];for(const suit of ['♣','♦','♥','♠'])for(const r of ['2','3','4','5','6','7','8','9','10','J','Q','K','A'])d.push(`${r}${suit}`);for(let i=d.length-1;i>0;i--){const j=randomInt(i+1);[d[i],d[j]]=[d[j],d[i]];}return d;}
function score(hand){let n=0,aces=0;for(const card of hand){const r=card.slice(0,-1);if(r==='A'){n+=11;aces++;}else n+=['J','Q','K'].includes(r)?10:Number(r);}while(n>21&&aces){n-=10;aces--;}return n;}
const natural=h=>h.length===2&&score(h)===21;
function debit(db,pid,bet,eventKey){transfer(db,{from:accountId(db,pid),to:'wa-treasury',amount:bet,eventKey,reason:'ACR arcade play'});}
function credit(db,pid,amount,eventKey){if(amount>0)transfer(db,{from:'wa-treasury',to:accountId(db,pid),amount,eventKey,reason:'ACR arcade payout'});}
function blackjackDeal(db,pid,state,bet,eventKey){
 debit(db,pid,bet,`${eventKey}:stake`);
 const deck=shuffledDeck(),player=[deck.pop(),deck.pop()],dealer=[deck.pop(),deck.pop()];
 Object.assign(state,{bet,player,dealer,deck,phase:'PLAYER_TURN',outcome:null,payout:0});
 if(natural(player)||natural(dealer))settleBlackjack(db,pid,state,`${eventKey}:payout`);
 state.player_total=score(state.player);state.dealer_total=state.phase==='FINISHED'?score(state.dealer):null;
}
function settleBlackjack(db,pid,state,eventKey){
 const p=score(state.player),d=score(state.dealer);
 let outcome='LOSE',payout=0;
 if(p>21){outcome='BUST';}
 else if(natural(state.player)&&!natural(state.dealer)){outcome='BLACKJACK';payout=state.bet*5/2;}
 else if((natural(state.player)&&natural(state.dealer))||p===d){outcome='PUSH';payout=state.bet;}
 else if(d>21||p>d){outcome='WIN';payout=state.bet*2;}
 if(!Number.isSafeInteger(payout))fail(500,'INVALID_PAYOUT');
 credit(db,pid,payout,eventKey);
 state.phase='FINISHED';state.outcome=outcome;state.payout=payout;
}
export function createGame(db,playerId,gameCode,bet=10){
 assert(GAMES[gameCode],404,'UNKNOWN_GAME');checkBet(bet);
 return transaction(db,()=>{
  const id=uuid(),state={phase:'READY',last:null,bet};
  if(gameCode==='B2')blackjackDeal(db,playerId,state,bet,`game:${id}:start`);
  db.prepare('INSERT INTO game_sessions VALUES(?,?,?,?,?,?,?,?)').run(id,'wa-world',playerId,gameCode,1,json(state),now(),now());
  const session=getSession(db,id,playerId);
  addEvent(db,playerId,session,'game.created');return {session,balance:wallet(db,playerId)};
 });
}
function addEvent(db,playerId,s,eventType){db.prepare('INSERT INTO outbox(tenant_id,player_id,session_id,event_type,version,payload_json,created_ms) VALUES(?,?,?,?,?,?,?)').run('wa-world',playerId,s.id,eventType,s.version,json({sessionId:s.id,version:s.version}),now());}
function perform(db,pid,record,command){
 const state=parse(record.state_json),action=command.action,bet=command.bet??state.bet;
 if(record.game_code==='A1-01'){
  assert(action==='SPIN',400,'INVALID_ACTION');checkBet(bet);
  debit(db,pid,bet,`action:${command.command_id}:stake`);
  const grid=Array.from({length:3},()=>Array.from({length:3},()=>randomInt(SYMBOLS.length)));
  const matches=[];let payout=0;
  for(let i=0;i<3;i++){const row=grid[i],sym=row[0];if(row.every(v=>v===sym)){const reward=bet*PAY[sym];matches.push({row:i+1,symbol:SYMBOLS[sym],payout:reward});payout+=reward;}}
  credit(db,pid,payout,`action:${command.command_id}:payout`);
  Object.assign(state,{phase:'READY',bet,last:{grid:grid.map(r=>r.map(i=>SYMBOLS[i])),matches,payout,net:payout-bet}});
 }else if(record.game_code==='A1-02'){
  assert(action==='SPIN',400,'INVALID_ACTION');checkBet(bet);
  const free=state.phase==='BONUS'&&state.bonus?.remaining>0;
  if(free)assert(bet===state.bet,409,'BET_LOCKED_DURING_BONUS');
  if(!free)debit(db,pid,bet,`action:${command.command_id}:stake`);
  const next=resolveScatterSpin(state,generateGrid(),bet);
  credit(db,pid,next.last.payout,`action:${command.command_id}:payout`);
  Object.assign(state,next);
 }else if(record.game_code==='B1'){
  assert(action==='SPIN',400,'INVALID_ACTION');checkBet(bet);
  const choice=String(command.choice??'').toLowerCase();
  const valid=['red','black','odd','even'].includes(choice)||(/^([0-9]|[12][0-9]|3[0-6])$/.test(choice));
  assert(valid,400,'INVALID_ROULETTE_CHOICE');
  debit(db,pid,bet,`action:${command.command_id}:stake`);
  const n=randomInt(37),isRed=RED.has(n),win=choice==='red'?isRed:choice==='black'?n!==0&&!isRed:choice==='odd'?n!==0&&n%2===1:choice==='even'?n!==0&&n%2===0:n===Number(choice);
  const payout=win?bet*(/\d/.test(choice)?36:2):0;
  credit(db,pid,payout,`action:${command.command_id}:payout`);
  Object.assign(state,{phase:'READY',bet,last:{number:n,color:n===0?'green':isRed?'red':'black',choice,win,payout,net:payout-bet}});
 }else if(record.game_code==='B2'){
  if(action==='NEW_ROUND'){
    assert(state.phase==='FINISHED',409,'ROUND_IN_PROGRESS');checkBet(bet);
    blackjackDeal(db,pid,state,bet,`action:${command.command_id}`);
  }else if(action==='HIT'){
    assert(state.phase==='PLAYER_TURN',409,'NOT_PLAYER_TURN');
    state.player.push(state.deck.pop());
    if(score(state.player)>=21) {
      if(score(state.player)===21){while(score(state.dealer)<17)state.dealer.push(state.deck.pop());}
      settleBlackjack(db,pid,state,`action:${command.command_id}:payout`);
    }
  }else if(action==='STAND'){
    assert(state.phase==='PLAYER_TURN',409,'NOT_PLAYER_TURN');
    while(score(state.dealer)<17)state.dealer.push(state.deck.pop());
    settleBlackjack(db,pid,state,`action:${command.command_id}:payout`);
  } else fail(400,'INVALID_ACTION');
  state.player_total=score(state.player);state.dealer_total=state.phase==='FINISHED'?score(state.dealer):null;
 }
 return state;
}
export function act(db,playerId,sessionId,command){
 assert(typeof command.command_id==='string'&&/^[a-zA-Z0-9:_-]{12,100}$/.test(command.command_id),400,'INVALID_COMMAND_ID');
 assert(Number.isSafeInteger(command.expected_version),400,'VERSION_REQUIRED');
 return transaction(db,()=>{
  const row=playerSession(db,sessionId,playerId);
  const previous=db.prepare('SELECT * FROM game_actions WHERE tenant_id=? AND command_id=?').get('wa-world',command.command_id);
  if(previous){assert(previous.session_id===sessionId,409,'COMMAND_REUSED_FOR_OTHER_SESSION');return parse(previous.response_json);}
  if(row.version!==command.expected_version)fail(409,'STATE_STALE');
  const state=perform(db,playerId,row,command);
  const version=row.version+1;
  db.prepare('UPDATE game_sessions SET state_json=?,version=?,updated_ms=? WHERE id=? AND version=?').run(json(state),version,now(),sessionId,row.version);
  const result={session:getSession(db,sessionId,playerId),balance:wallet(db,playerId)};
  db.prepare('INSERT INTO game_actions VALUES(?,?,?,?,?)').run('wa-world',command.command_id,sessionId,json(result),now());
  addEvent(db,playerId,result.session,'game.state.updated');
  return result;
 });
}
