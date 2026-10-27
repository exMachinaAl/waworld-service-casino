import fs from 'node:fs';import path from 'node:path';import net from 'node:net';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import {DatabaseSync,backup} from 'node:sqlite';
const patch=path.dirname(fileURLToPath(import.meta.url)),manifest=JSON.parse(fs.readFileSync(path.join(patch,'manifest.json'),'utf8'));
const mode=(process.argv[2]||'CHECK').toUpperCase(),target=path.resolve(process.argv[3]||'');
const sha=b=>createHash('sha256').update(b).digest('hex'),exists=p=>fs.existsSync(p),hash=p=>exists(p)?sha(fs.readFileSync(p)):null;
function safe(base,rel){if(typeof rel!=='string'||rel.includes('\\')||rel.split('/').some(x=>['..','.',''].includes(x))||path.isAbsolute(rel))throw Error('UNSAFE_PATH');const dest=path.resolve(base,rel);if(!dest.startsWith(base+path.sep))throw Error('PATH_ESCAPE');let cursor=base;for(const part of rel.split('/')){cursor=path.join(cursor,part);if(exists(cursor)&&fs.lstatSync(cursor).isSymbolicLink())throw Error(`SYMLINK_REJECTED: ${rel}`);}return dest;}
function atomic(file,bytes){fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.wae-upgrade-temp';if(exists(temp))throw Error('Unexpected temporary file: '+temp);fs.writeFileSync(temp,bytes,{flag:'wx'});fs.renameSync(temp,file);}
function sourceDiff(f){const original=safe(path.join(patch,'base'),f.path),current=safe(target,f.path),incoming=safe(path.join(patch,'payload'),f.path);if(!exists(original)||!exists(current)||fs.statSync(original).size>512000||fs.statSync(current).size>512000)return {note:'Compare files manually; missing or large file'};const a=fs.readFileSync(original,'utf8').split(/\r?\n/),b=fs.readFileSync(current,'utf8').split(/\r?\n/),c=exists(incoming)?fs.readFileSync(incoming,'utf8').split(/\r?\n/):[];const changes=[];for(let i=0;i<Math.max(a.length,b.length)&&changes.length<20;i++)if(a[i]!==b[i])changes.push({line:i+1,baseline:(a[i]??'').slice(0,180),local:(b[i]??'').slice(0,180),incoming:(c[i]??'').slice(0,180)});return {note:'First 20 differing line positions (not a merge)',changes};}
function plan(){const conflicts=[],actions=[];for(const f of manifest.files){const dest=safe(target,f.path),current=hash(dest);if(current===f.after)continue;if(f.preserve&&current!==f.before){console.log('[PRESERVED CUSTOM DOC] '+f.path);continue;}if(current!==f.before){conflicts.push({path:f.path,expected:f.before,actual:current,incoming:f.after,diff:sourceDiff(f)});continue;}if(f.after!==null&&hash(safe(path.join(patch,'payload'),f.path))!==f.after)throw Error('PATCH_CHECKSUM_INVALID: '+f.path);actions.push(f);}return {conflicts,actions};}
async function offline(){let port=8787;const env=path.join(target,'.env');if(exists(env)){const m=fs.readFileSync(env,'utf8').match(/^WAE_PORT\s*=\s*(\d+)/m);if(m)port=Number(m[1]);}if(manifest.migration){const listening=await new Promise(resolve=>{const s=net.connect({host:'127.0.0.1',port});s.once('connect',()=>{s.destroy();resolve(true)});s.once('error',()=>resolve(false));s.setTimeout(800,()=>{s.destroy();resolve(false)})});if(listening)throw Error('STOP_SERVER_FIRST: port '+port+' is active');}}
async function main(){
 if(!/^[A-Za-z0-9_-]+$/.test(manifest.id)||!Array.isArray(manifest.files))throw Error('INVALID_MANIFEST');
 if(!process.argv[3])throw Error('TARGET_PATH_REQUIRED');
 if(fs.lstatSync(target).isSymbolicLink())throw Error('TARGET_SYMLINK_REJECTED');
 for(const f of manifest.files)if(/^(data|logs|node_modules|\.git)(\/|$)/.test(f.path)||f.path==='.env')throw Error('PROTECTED_PATH_IN_MANIFEST');
 if(!['CHECK','DRYRUN','APPLY','ROLLBACK'].includes(mode)||!process.argv[3])throw Error('Usage: node upgrade.mjs CHECK|DRYRUN|APPLY|ROLLBACK "C:\\path\\project"');
 const pkg=JSON.parse(fs.readFileSync(safe(target,'package.json'),'utf8'));if(pkg.name!==manifest.project)throw Error('WRONG_TARGET_PROJECT');
 safe(target,'data/_wae-upgrades/guard');
 const home=path.join(target,'data','_wae-upgrades'),journal=path.join(home,manifest.id),statefile=path.join(journal,'journal.json');
 if(mode==='CHECK'||mode==='DRYRUN'){const result=plan();console.log(JSON.stringify({mode,target,source_build:manifest.build,...result},null,2));if(result.conflicts.length)process.exitCode=2;return;}
 await offline();fs.mkdirSync(home,{recursive:true});const lock=path.join(home,'upgrade.lock');const fd=fs.openSync(lock,'wx');fs.writeFileSync(fd,JSON.stringify({pid:process.pid,patch:manifest.id}));
 try{
 if(mode==='ROLLBACK'){
  if(!exists(statefile))throw Error('NO_UPGRADE_JOURNAL');const state=JSON.parse(fs.readFileSync(statefile,'utf8'));if(state.status==='ROLLED_BACK'){console.log('[OK] Already rolled back');return;}
  const dbfile=path.join(target,'data','arcade.sqlite');
  if(manifest.migration&&exists(dbfile)){const db=new DatabaseSync(dbfile,{readOnly:true});try{const tx=db.prepare('SELECT COUNT(*) n FROM transfers').get().n,hasReserves=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='treasury_reserves'").get(),res=hasReserves?db.prepare('SELECT COALESCE(SUM(amount),0) n FROM treasury_reserves WHERE id NOT LIKE \'slot:%\' AND id NOT LIKE \'solo:%\' AND id NOT LIKE \'bj:%\'').get().n:0;if(tx!==state.transfers||res>0)throw Error('ROLLBACK_BLOCKED: new wallet activity or active reserves; use forward fix, never restore an old wallet');}finally{db.close()}}
  for(const f of state.actions){const current=hash(safe(target,f.path));if(current!==f.after&&current!==f.before)throw Error('ROLLBACK_LOCAL_CONFLICT: '+f.path);if(f.before!==null&&hash(safe(path.join(journal,'before'),f.path))!==f.before)throw Error('BACKUP_CHECKSUM_INVALID: '+f.path);}
  for(const f of [...state.actions].reverse()){const dest=safe(target,f.path);if(f.before===null){if(exists(dest))fs.unlinkSync(dest);}else atomic(dest,fs.readFileSync(safe(path.join(journal,'before'),f.path)));}
  state.status='ROLLED_BACK';fs.writeFileSync(statefile,JSON.stringify(state,null,2));console.log('[OK] Code rolled back; database retained (additive migration).');return;
 }
 const result=plan();if(result.conflicts.length){console.error(JSON.stringify(result.conflicts,null,2));throw Error('SOURCE_CONFLICT: no project files changed. Compare target with payload; merge separately; never force.');}
 if(!result.actions.length){console.log('[OK] Already current; no files changed.');return;}
 if(exists(journal)){const old=exists(statefile)?JSON.parse(fs.readFileSync(statefile,'utf8')):null;if(old?.status==='ROLLED_BACK')fs.renameSync(journal,journal+'-rolled-back-'+Date.now());else throw Error('UPGRADE_JOURNAL_EXISTS: inspect recovery journal before retry');}fs.mkdirSync(journal,{recursive:true});
 const state={status:'PREPARING',build:manifest.build,transfers:0,actions:result.actions};
 for(const f of result.actions)if(f.before!==null){const b=safe(path.join(journal,'before'),f.path);fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(safe(target,f.path),b);}
 const dbfile=path.join(target,'data','arcade.sqlite');if(manifest.migration&&exists(dbfile)){const db=new DatabaseSync(dbfile,{readOnly:true});try{await backup(db,path.join(journal,'database-before.sqlite'));state.transfers=db.prepare('SELECT COUNT(*) n FROM transfers').get().n;}finally{db.close()}}
 fs.writeFileSync(statefile,JSON.stringify(state,null,2));
 try{for(const f of result.actions){const dest=safe(target,f.path);if(hash(dest)!==f.before)throw Error('SOURCE_CHANGED_DURING_UPGRADE: '+f.path);if(f.after===null){if(exists(dest))fs.unlinkSync(dest);}else atomic(dest,fs.readFileSync(safe(path.join(patch,'payload'),f.path)));}
 if(manifest.migration){const p=spawnSync(process.execPath,['--experimental-sqlite','scripts/migrate.mjs','--backup-already-created'],{cwd:target,stdio:'inherit'});if(p.status!==0)throw Error('MIGRATION_FAILED: database retained; inspect log');}
 state.status='APPLIED';fs.writeFileSync(statefile,JSON.stringify(state,null,2));console.log('[OK] Upgrade applied. Backup and journal: '+journal);
 }catch(e){state.status='RECOVERY_REQUIRED';state.error=e.message;fs.writeFileSync(statefile,JSON.stringify(state,null,2));throw e;}
 }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
try{await main()}catch(e){console.error('[FAIL] '+e.message);process.exitCode=1;}
