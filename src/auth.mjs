import {uuid,token,digest,now,code,assert,fail,equal,json} from './util.mjs';
import {transaction,ensurePlayer,audit} from './db.mjs';
const TTL=120000, SESSION_TTL=7*24*3600*1000;
export function createHandoff(db,subject,gameSessionId=null){
 return transaction(db,()=>{
  const playerId=ensurePlayer(db,subject,'wa');
  if(gameSessionId){const ses=db.prepare('SELECT id FROM game_sessions WHERE id=? AND player_id=?').get(gameSessionId,playerId);assert(ses,403,'NOT_SESSION_OWNER');}
  const ref=token(18),id=uuid(),expiry=now()+TTL;
  db.prepare('INSERT INTO handoffs(id,tenant_id,player_id,game_session_id,ref,direction,status,expires_ms,created_ms) VALUES(?,?,?,?,?,?,?,?,?)')
  .run(id,'wa-world',playerId,gameSessionId,ref,'WA_TO_WEB','PENDING',expiry,now());
  audit(db,'handoff.created',{playerId,ref});return {ref,expires_at:expiry,game_session_id:gameSessionId};
 });
}
function handoff(db,ref){const h=db.prepare('SELECT * FROM handoffs WHERE ref=?').get(ref);assert(h,404,'HANDOFF_NOT_FOUND');return h;}
function active(h){assert(h.expires_ms>now(),410,'HANDOFF_EXPIRED');assert(!['CONSUMED','DENIED','REVOKED'].includes(h.status),409,'HANDOFF_CLOSED');}
export function claimHandoff(db,ref){
 return transaction(db,()=>{
  const h=handoff(db,ref);active(h);assert(h.status==='PENDING',409,'ALREADY_CLAIMED');
  const claimSecret=token(32),challenge=code();
  db.prepare('UPDATE handoffs SET status=?,claim_hash=?,code_hash=?,display_code=? WHERE id=?').run('CLAIMED',digest(claimSecret),digest(challenge),challenge,h.id);
  audit(db,'handoff.claimed',{ref});return {claimSecret,challenge,expires_at:h.expires_ms};
 });
}
export function handoffStatus(db,ref,claimSecret){const h=handoff(db,ref);if(!claimSecret||!equal(h.claim_hash,digest(claimSecret)))fail(403,'BAD_CLAIM');return {status:h.expires_ms<=now()?'EXPIRED':h.status,expires_at:h.expires_ms,game_session_id:h.game_session_id};}
export function pendingForWa(db,subject){
 const id=db.prepare('SELECT player_id FROM identities WHERE tenant_id=? AND provider=? AND subject=?').get('wa-world','wa',subject)?.player_id;
 if(!id)return [];
 return db.prepare('SELECT ref,status,display_code,expires_ms FROM handoffs WHERE player_id=? AND expires_ms>? AND status IN (\'PENDING\',\'CLAIMED\',\'APPROVED\') ORDER BY created_ms DESC LIMIT 5').all(id,now());
}
export function approveHandoff(db,ref,subject,entered){
 return transaction(db,()=>{
  const h=handoff(db,ref);active(h);assert(h.status==='CLAIMED',409,'HANDOFF_NOT_CLAIMED');
  const actual=db.prepare('SELECT player_id FROM identities WHERE tenant_id=? AND provider=? AND subject=?').get('wa-world','wa',subject)?.player_id;
  assert(actual&&actual===h.player_id,403,'NOT_HANDOFF_OWNER');
  if(!/^[0-9]{6}$/.test(String(entered))||!equal(h.code_hash,digest(entered))){
   const attempts=h.attempts+1;db.prepare('UPDATE handoffs SET attempts=?,status=? WHERE id=?').run(attempts,attempts>=5?'DENIED':'CLAIMED',h.id);
   return {ok:false,reason:'BAD_CONFIRMATION_CODE',attempts};
  }
  db.prepare('UPDATE handoffs SET status=? WHERE id=?').run('APPROVED',h.id);
  audit(db,'handoff.approved',{ref,playerId:actual});return {ok:true};
 });
}
export function finalizeHandoff(db,ref,claimSecret,label='Web Browser'){
 return transaction(db,()=>{
  const h=handoff(db,ref);active(h);assert(h.status==='APPROVED',409,'NOT_YET_APPROVED');
  assert(claimSecret&&equal(h.claim_hash,digest(claimSecret)),403,'BAD_CLAIM');
  const secret=token(32),id=uuid();
  db.prepare('INSERT INTO browser_sessions VALUES(?,?,?,?,?,?,?,?)').run(id,h.tenant_id,h.player_id,digest(secret),now(),now()+SESSION_TTL,null,String(label).slice(0,60));
  db.prepare('UPDATE handoffs SET status=?,claim_hash=NULL,code_hash=NULL,display_code=NULL WHERE id=?').run('CONSUMED',h.id);
  audit(db,'web.session.created',{playerId:h.player_id,id});
  return {secret,game_session_id:h.game_session_id};
 });
}
export function browserPlayer(db,cookieSecret){
 if(!cookieSecret)return null;
 return db.prepare('SELECT id,player_id,tenant_id,device_label FROM browser_sessions WHERE secret_hash=? AND revoked_ms IS NULL AND expires_ms>?').get(digest(cookieSecret),now())??null;
}
export function revokeSession(db,session){db.prepare('UPDATE browser_sessions SET revoked_ms=? WHERE id=?').run(now(),session.id);audit(db,'web.session.revoked',{sessionId:session.id});}
export function devices(db,playerId){return db.prepare('SELECT id,device_label,created_ms,expires_ms FROM browser_sessions WHERE player_id=? AND revoked_ms IS NULL AND expires_ms>? ORDER BY created_ms DESC').all(playerId,now());}
export function revokeDevice(db,playerId,id){const n=db.prepare('UPDATE browser_sessions SET revoked_ms=? WHERE id=? AND player_id=?').run(now(),id,playerId).changes;assert(n,404,'DEVICE_NOT_FOUND');audit(db,'web.device.revoked',{id,playerId});}
export function makeWaLink(db,playerId){
 return transaction(db,()=>{
  const active=db.prepare('SELECT subject FROM identities WHERE tenant_id=? AND provider=? AND player_id=?').get('wa-world','wa',playerId);
  if(active)fail(409,'ALREADY_WA_LINKED');
  const pin=code(),id=uuid();
  db.prepare('INSERT INTO wa_links VALUES(?,?,?,?,?,?,?,?)').run(id,'wa-world',playerId,digest(pin),pin,null,'PENDING',now()+TTL);
  audit(db,'wa.link.created',{playerId});return {id,code:pin,expires_at:now()+TTL};
 });
}
export function claimWaLink(db,subject,pin){
 return transaction(db,()=>{
  const link=db.prepare('SELECT * FROM wa_links WHERE code_hash=?').get(digest(pin));
  assert(link&&link.status==='PENDING'&&link.expires_ms>now(),404,'LINK_NOT_FOUND');
  const other=db.prepare('SELECT * FROM identities WHERE tenant_id=? AND provider=? AND subject=?').get('wa-world','wa',subject);
  assert(!other||other.player_id===link.player_id,409,'WA_IDENTITY_ALREADY_LINKED');
  db.prepare('UPDATE wa_links SET status=?,wa_subject=? WHERE id=?').run('WA_CLAIMED',subject,link.id);
  audit(db,'wa.link.claimed',{id:link.id});return {id:link.id,status:'WA_CLAIMED'};
 });
}
export function confirmWaLink(db,subject,pin){
 return transaction(db,()=>{
  const link=db.prepare('SELECT * FROM wa_links WHERE code_hash=?').get(digest(pin));
  assert(link&&link.status==='WA_CLAIMED'&&link.expires_ms>now()&&link.wa_subject===subject,403,'WA_LINK_UNVERIFIED');
  db.prepare('UPDATE wa_links SET status=? WHERE id=?').run('WA_CONFIRMED',link.id);
  return {status:'WA_CONFIRMED'};
 });
}
export function waLinkStatus(db,id,playerId){
 const link=db.prepare('SELECT id,status,expires_ms FROM wa_links WHERE id=? AND player_id=?').get(id,playerId);
 assert(link,404,'LINK_NOT_FOUND');return {...link,status:link.expires_ms<=now()?'EXPIRED':link.status};
}
export function approveWaLinkWeb(db,id,playerId){
 return transaction(db,()=>{
  const link=db.prepare('SELECT * FROM wa_links WHERE id=? AND player_id=?').get(id,playerId);
  assert(link&&link.expires_ms>now()&&link.status==='WA_CONFIRMED',409,'LINK_NOT_CONFIRMED');
  const existing=db.prepare('SELECT player_id FROM identities WHERE tenant_id=? AND provider=? AND subject=?').get('wa-world','wa',link.wa_subject);
  assert(!existing||existing.player_id===playerId,409,'WA_IDENTITY_ALREADY_LINKED');
  db.prepare('INSERT OR IGNORE INTO identities VALUES(?,?,?,?)').run('wa-world','wa',link.wa_subject,playerId);
  db.prepare('UPDATE wa_links SET status=?,display_code=? WHERE id=?').run('LINKED','',id);
  audit(db,'wa.link.completed',{playerId});return {status:'LINKED'};
 });
}
