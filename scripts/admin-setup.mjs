// Local interactive admin provisioning. Password is never passed through CLI args, .env, or logs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import readline from 'node:readline/promises';
import {openDb} from '../src/db.mjs';
import {setupAdminSchema,createAdmin} from '../src/admin.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ui=readline.createInterface({input:process.stdin,output:process.stdout});
async function hidden(prompt){
 if(!process.stdin.isTTY||!process.stdin.setRawMode)throw Error('Harus dijalankan dari CMD / terminal interaktif.');
 return await new Promise((resolve,reject)=>{
  let value='';process.stdin.setRawMode(true);process.stdin.resume();
  const key=(chunk)=>{const data=chunk.toString('utf8');for(const c of data){
   if(c==='\r'||c==='\n'){cleanup();process.stdout.write('\n');resolve(value);return;}
   if(c==='\u0003'){cleanup();reject(Error('Dibatalkan.'));return;}
   if(c==='\b'||c==='\u007f'){value=value.slice(0,-1);continue;}
   if(c>=' '&&c<='~')value+=c;
  }};
  const cleanup=()=>{process.stdin.off('data',key);process.stdin.setRawMode(false);process.stdin.pause();};
  process.stdin.on('data',key);
  process.stdout.write(prompt);
 });
}
try{
 const username=(await ui.question('Username admin baru (3-40 karakter): ')).trim();
 ui.close();
 const pass=await hidden('Password admin minimal 12 karakter (input disembunyikan): ');
 const confirm=await hidden('Konfirmasi password: ');
 if(pass!==confirm)throw Error('Password tidak cocok.');
 const db=openDb(path.join(root,'data','arcade.sqlite'));
 try{setupAdminSchema(db);const user=createAdmin(db,username,pass);console.log('[OK] Admin dibuat: '+user.username);}
 finally{db.close();}
 console.log('Aktifkan WAE_ADMIN_TEST_GRANTS=1 di .env lokal, restart server, dan buka menu Admin di Web GUI.');
}catch(e){console.error('[STOP] '+e.message);process.exitCode=1;}finally{ui.close();}
