import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const built=path.join(root,'web-dist','index.html');
if(!existsSync(built)||!readFileSync(built,'utf8').includes('name="wae-ui-version" content="0.5.0"')){
  console.error('[STOP] UI React v0.5.0 belum dibuild. Versi bundle lama tidak akan dijalankan.');
  console.error('[NEXT] Jalankan INSTALL.bat atau npm run build:web dari proyek WAE.');
  process.exitCode=1;
}else console.log('[OK] React Scatter Rush UI v0.5.0 built.');
