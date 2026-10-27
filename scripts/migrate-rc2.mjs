import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {DatabaseSync,backup} from 'node:sqlite';
import {openDb,checkLedger} from '../src/db.mjs';import {normalizeRc2GlobalPolicy} from '../src/rc2-policy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const file=path.join(root,'data','arcade.sqlite');
if(!fs.existsSync(file)){console.log('[RC2] Database belum ada. Default policy baru tetap maksimum 3000 ACR.');process.exit(0);}
const folder=path.join(root,'data','_wae-upgrades',`rc2-policy-${Date.now()}`);fs.mkdirSync(folder,{recursive:true});
const source=new DatabaseSync(file,{readOnly:true});try{await backup(source,path.join(folder,'before.sqlite'));}finally{source.close();}
const db=openDb(file);try{const result=normalizeRc2GlobalPolicy(db);const ledger=checkLedger(db);if(ledger.imbalanced.length||ledger.playerBalancesMismatched.length)throw Error('LEDGER_INVARIANT_FAILED');console.log('[RC2] Policy normalisasi:',result,'Ledger OK. Backup konsisten:',folder);}finally{db.close();}
