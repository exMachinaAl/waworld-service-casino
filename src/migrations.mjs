import {transaction} from './db.mjs';
import {treasuryStatus} from './stake-policy.mjs';
// Conservatively protect pre-RC unfinished liabilities before any new round can reserve treasury.
export function migrateActiveLiabilities(db){return transaction(db,()=>{
 const pending=[];
 for(const t of db.prepare("SELECT id,bet,state_json FROM bj_tables WHERE status='PLAYING'").all())pending.push([`bj:${t.id}`,JSON.parse(t.state_json).hands.length*Math.floor(t.bet*5/2)]);
 for(const s of db.prepare('SELECT id,game_code,state_json FROM game_sessions').all()){const st=JSON.parse(s.state_json);
 if(s.game_code==='B2'&&st.phase==='PLAYER_TURN')pending.push([`solo:${s.id}`,Math.floor(st.bet*5/2)]);
 if(s.game_code.startsWith('A1-')){const bound=s.game_code==='A1-05'?292:262;const bonus=st.bonus?.remaining>0?(50-st.bonus.played)*bound*st.bet:0;const pots=(st.pot_queue??[]).reduce((n,t)=>n+5*t.bet,0);if(bonus+pots>0)pending.push([`slot:${s.id}`,bonus+pots]);}
 }
 for(const [id,amount] of pending)db.prepare('INSERT OR IGNORE INTO treasury_reserves VALUES(?,?,?)').run(id,'wa-world',amount);
 return {protected:pending.length,treasury:treasuryStatus(db)};
 });}
