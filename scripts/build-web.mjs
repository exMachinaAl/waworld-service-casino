import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web=path.join(root,'web');
const npm=process.platform==='win32'?'npm.cmd':'npm';
const run=(args)=>{
  const p=spawnSync(npm,args,{cwd:web,stdio:'inherit',shell:process.platform==='win32'});
  if(p.error||p.status!==0){console.error('[FAIL] npm '+args.join(' ')+' gagal. Periksa koneksi internet untuk install package React/Vite.');process.exit(p.status||1)}
};
if(!existsSync(path.join(web,'node_modules','vite')))run(['install','--no-audit','--no-fund']);
run(['run','build']);
if(!existsSync(path.join(root,'web-dist','index.html'))){console.error('[FAIL] web-dist/index.html tidak dibuat');process.exit(1)}
console.log('[OK] React production bundle siap dalam web-dist/');
