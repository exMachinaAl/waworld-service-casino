import test from 'node:test';
import assert from 'node:assert/strict';
import {openDb,transaction,ensurePlayer,checkLedger} from '../src/db.mjs';
import {setupBlackjackTables,sweepBlackjackTimeouts} from '../src/blackjack-tables.mjs';
import {sweepScheduledRounds} from '../src/scheduled-rounds.mjs';
import {createRoulette,rouletteView} from '../src/roulette-rounds.mjs';
import {reserve} from '../src/stake-policy.mjs';

function fixture(t){
 const db=openDb();setupBlackjackTables(db);t.after(()=>db.close());
 const player=transaction(db,()=>ensurePlayer(db,'scheduler-fixture'));
 // Synthetic losing hands isolate scheduling without RNG or money movements.
 function table(id,deadline,updated=0){
  const state={phase:'PLAYING',dealer:['10♠','8♥'],deck:[],turn_seat:1,turn_deadline_ms:deadline,
   hands:[{seat:1,player_id:player,cards:['10♥','7♠'],done:false}]};
  db.prepare('INSERT INTO bj_tables VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,'wa-world',id,player,10,'PLAYING',1,JSON.stringify(state),0,updated,deadline);
  db.prepare('INSERT INTO bj_members VALUES(?,?,?,?,?)').run(id,player,1,1,0);
 }
 return {db,table};
}

test('expired blackjack turn is processed behind 100 nonexpired tables',t=>{
 const {db,table}=fixture(t);
 for(let i=0;i<100;i++)table(`waiting-${i}`,Date.now()+600000,i);
 table('expired-table',Date.now()-1000,101);
 assert.equal(sweepBlackjackTimeouts(db),1);
 assert.equal(db.prepare('SELECT status FROM bj_tables WHERE id=?').get('expired-table').status,'FINISHED');
 assert.equal(db.prepare("SELECT COUNT(*) n FROM bj_tables WHERE status='PLAYING'").get().n,100);
 assert.equal(sweepBlackjackTimeouts(db),0);
 assert.deepEqual(checkLedger(db),{imbalanced:[],playerBalancesMismatched:[]});
});

test('invalid blackjack state is reported after healthy expired tables progress',t=>{
 const {db,table}=fixture(t);
 table('broken-table',Date.now()-1000,0);
 db.prepare('UPDATE bj_tables SET state_json=? WHERE id=?').run('{broken','broken-table');
 table('healthy-table',Date.now()-1000,1);
 assert.throws(()=>sweepBlackjackTimeouts(db));
 assert.equal(db.prepare('SELECT status FROM bj_tables WHERE id=?').get('healthy-table').status,'FINISHED');
 assert.equal(db.prepare('SELECT version FROM bj_tables WHERE id=?').get('broken-table').version,1);
 assert.throws(()=>sweepBlackjackTimeouts(db));
 assert.equal(db.prepare('SELECT COUNT(*) n FROM bj_commands WHERE table_id=?').get('healthy-table').n,1);
 assert.deepEqual(checkLedger(db),{imbalanced:[],playerBalancesMismatched:[]});
});

test('failed timeout rolls back reserve release and state while another table completes',t=>{
 const {db,table}=fixture(t);
 table('failed-table',Date.now()-1000,0);
 table('next-table',Date.now()-1000,1);
 transaction(db,()=>reserve(db,'bj:failed-table',25));
 db.exec(`CREATE TRIGGER fail_timeout BEFORE UPDATE ON bj_tables
  WHEN OLD.id='failed-table' BEGIN SELECT RAISE(ABORT,'fixture failure'); END;`);
 assert.throws(()=>sweepBlackjackTimeouts(db),AggregateError);
 assert.equal(db.prepare('SELECT amount FROM treasury_reserves WHERE id=?').get('bj:failed-table').amount,25);
 assert.equal(db.prepare('SELECT version FROM bj_tables WHERE id=?').get('failed-table').version,1);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM bj_commands WHERE table_id=?').get('failed-table').n,0);
 assert.equal(db.prepare('SELECT status FROM bj_tables WHERE id=?').get('next-table').status,'FINISHED');
 db.exec('DROP TRIGGER fail_timeout');
 assert.equal(sweepBlackjackTimeouts(db),1);
 assert.equal(sweepBlackjackTimeouts(db),0);
 assert.equal(db.prepare('SELECT amount FROM treasury_reserves WHERE id=?').get('bj:failed-table'),undefined);
 assert.deepEqual(checkLedger(db),{imbalanced:[],playerBalancesMismatched:[]});
});

test('scheduler continues roulette through settlement when blackjack and lottery fail',t=>{
 const {db,table}=fixture(t);
 table('broken-table',Date.now()-1000);
 db.prepare('UPDATE bj_tables SET state_json=? WHERE id=?').run('{broken','broken-table');
 // Simulate an unavailable lottery schema; roulette must still run each tick.
 db.exec('DROP TABLE lottery_campaigns');
 const round=createRoulette(db,{id:'test-admin',role:'ADMIN'},{closes_ms:Date.now()+60000,budget:100000,command_id:'scheduler-roulette-create'});
 db.prepare('UPDATE roulette_rounds SET closes_ms=? WHERE id=?').run(Date.now()-1000,round.id);
 for(const status of ['LOCKED','SPINNING','SETTLED']){
  assert.throws(()=>sweepScheduledRounds(db),e=>e instanceof AggregateError&&e.errors.length===2);
  assert.equal(rouletteView(db,round.id).status,status);
 }
 const result=rouletteView(db,round.id).result;
 assert.throws(()=>sweepScheduledRounds(db),AggregateError);
 assert.equal(rouletteView(db,round.id).result,result);
 assert.deepEqual(checkLedger(db),{imbalanced:[],playerBalancesMismatched:[]});
});
