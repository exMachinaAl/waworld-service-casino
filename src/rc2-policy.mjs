import {transaction,audit} from './db.mjs';
import {parse,json,now,uuid} from './util.mjs';
/** One-time opt-in policy normalization for existing databases. No active rounds, tickets, ledger or player balances are altered. */
export function normalizeRc2GlobalPolicy(db){
 return transaction(db,()=>{
  if(db.prepare("SELECT 1 FROM schema_migrations WHERE version='1.0.0-rc.2'").get())return {changed:false,alreadyApplied:true};
  const row=db.prepare("SELECT * FROM stake_policies WHERE tenant_id='wa-world' AND game_code='*'").get();
  let changed=false,before=null,after=null;
  if(row){before=parse(row.policy_json);if(before.max>3000){if(before.min>3000)throw Error('GLOBAL_POLICY_MIN_ABOVE_3000: manual admin review needed');
   after={...before,max:3000,presets:(before.presets??[]).filter(n=>n>=before.min&&n<=3000)};
   db.prepare("UPDATE stake_policies SET version=version+1,policy_json=? WHERE tenant_id='wa-world' AND game_code='*'").run(json(after));
   db.prepare('INSERT INTO policy_audit VALUES(?,?,?,?,?,?)').run(uuid(),'wa-world','system:rc2-policy-migration',json(before),json(after),now());
   audit(db,'stake.policy.rc2_normalized',{actor:'system:rc2-policy-migration',before,after});changed=true;
  }}
  db.prepare('INSERT INTO schema_migrations VALUES(?,?)').run('1.0.0-rc.2',now());
  return {changed,oldMax:before?.max??null,newMax:after?.max??before?.max??3000};
 });
}
