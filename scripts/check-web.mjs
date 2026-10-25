import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('web/src/App.jsx'),vite=read('web/vite.config.js'),server=read('src/server.mjs');
for(const needle of ['EventSource','/api/v1/handoffs/claim','/api/v1/wa-links','expected_version','/api/v1/wallet','React'])if(!source.includes(needle)){console.error('[FAIL] Missing web integration '+needle);process.exit(1)}
for(const p of ['web/package.json','web/src/styles.css','web/src/api.js','web/index.html'])if(!fs.existsSync(path.join(root,p))){console.error('[FAIL] Missing file '+p);process.exit(1)}
if(!vite.includes('web-dist')||!server.includes('web-dist'))process.exit(1);
console.log('[OK] React source, API mapping, and static server references present.');
if(fs.existsSync(path.join(root,'web-dist','index.html')))console.log('[OK] Compiled React bundle available.');
else console.log('[WARN] React bundle not built here: run npm run build:web on machine with npm access.');
