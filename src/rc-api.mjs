import {lotteryList,lotteryView,createLottery,lotteryAdminAction,buyLotteryTicket,cancelLotteryTicket} from './lottery.mjs';
import {rouletteList,rouletteView,createRoulette,rouletteAdminAction,submitSlip} from './roulette-rounds.mjs';
import {policy,setPolicy,tenantFor,treasuryStatus,fundTreasury} from './stake-policy.mjs';
import {assert,parse} from './util.mjs';
export function rcAdmin(db,admin,method,route,b,query){
 if(route==='/treasury'&&method==='GET')return treasuryStatus(db);
 if(route==='/treasury/fund'&&method==='POST')return fundTreasury(db,admin,b);
 if(route==='/policies')return method==='GET'?{policies:['*','L1','B1','B2','B2-MP','T0','A1-01','A1-02','A1-03','A1-04','A1-05'].map(g=>policy(db,g))}:setPolicy(db,admin,b);
 if(route==='/lottery')return method==='GET'?lotteryList(db,null):createLottery(db,admin,b);
 if(route==='/roulette-rounds')return method==='GET'?rouletteList(db,null):createRoulette(db,admin,b);
 const m=route.match(/^\/(lottery|roulette-rounds)\/([a-f0-9]{32})(?:\/(actions|export))?$/);
 if(m){if(method==='GET')return m[1]==='lottery'?lotteryView(db,m[2],null,true):rouletteView(db,m[2],null,true);if(method==='POST'&&m[3]==='actions')return m[1]==='lottery'?lotteryAdminAction(db,admin,m[2],b):rouletteAdminAction(db,admin,m[2],b);}
 return undefined;
}
export function rcPlayer(db,p,method,route,b,query){tenantFor(db,p);
 if(method==='GET'&&route==='/policies')return policy(db,query.get('game_code')||'*');
 if(method==='GET'&&route==='/lottery')return lotteryList(db,p);
 if(method==='GET'&&route==='/roulette-rounds')return rouletteList(db,p);
 if(method==='GET'&&route==='/notifications'){const cursor=Number(query.get('after')||0);assert(Number.isSafeInteger(cursor)&&cursor>=0,400,'INVALID_CURSOR');return {events:db.prepare("SELECT id,session_id,event_type,version,payload_json,created_ms FROM outbox WHERE player_id=? AND tenant_id='wa-world' AND id>? ORDER BY id LIMIT 100").all(p,cursor).map(e=>({...e,payload:parse(e.payload_json),payload_json:undefined}))};}
 const cmd=route.match(/^\/commands\/([A-Za-z0-9:_-]{12,100})$/);if(cmd&&method==='GET'){const row=db.prepare("SELECT response_json FROM rc_commands WHERE tenant_id='wa-world' AND actor=? AND command_id=?").get(p,cmd[1]);return {found:!!row,response:row?parse(row.response_json):null};}
 const m=route.match(/^\/(lottery|roulette-rounds)\/([a-f0-9]{32})(?:\/(tickets|cancel-ticket|slips))?$/);
 if(m){if(method==='GET'&&!m[3])return {round:m[1]==='lottery'?lotteryView(db,m[2],p):rouletteView(db,m[2],p)};
 if(method==='POST'&&m[1]==='lottery'&&m[3]==='tickets')return buyLotteryTicket(db,p,m[2],b);
 if(method==='POST'&&m[1]==='lottery'&&m[3]==='cancel-ticket')return cancelLotteryTicket(db,p,m[2],b);
 if(method==='POST'&&m[1]==='roulette-rounds'&&m[3]==='slips')return submitSlip(db,p,m[2],b);}
 return undefined;
}
export const isRcRoute=route=>/^\/(policies|lottery|roulette-rounds|notifications|commands|treasury)(\/|$)/.test(route);
