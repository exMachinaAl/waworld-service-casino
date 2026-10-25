import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('web/src/App.jsx'),vite=read('web/vite.config.js'),server=read('src/server.mjs');
for(const needle of ['EventSource','/api/v1/handoffs/claim','/api/v1/wa-links','expected_version','/api/v1/wallet','React'])if(!source.includes(needle)){console.error('[FAIL] Missing web integration '+needle);process.exit(1)}
for(const p of ['web/package.json','web/src/styles.css','web/src/animations.css','web/src/animation.mjs','src/scatter-rush.mjs','web/src/components/GamePanel.jsx','web/src/components/GameStages.jsx','web/src/api.js','web/src/components/AdminView.jsx','src/admin.mjs','scripts/admin-setup.mjs','web/index.html'])if(!fs.existsSync(path.join(root,p))){console.error('[FAIL] Missing file '+p);process.exit(1)}
if(!vite.includes('web-dist')||!server.includes('web-dist'))process.exit(1);
if(!read('web/index.html').includes('wae-ui-version')||!read('web/src/components/GamePanel.jsx').includes('animationDuration')||!read('web/src/components/GameStages.jsx').includes('ScatterRushStage')){console.error('[FAIL] Motion UI marker/modules missing');process.exit(1);}
if(!source.includes('AdminView')||!read('web/src/components/AdminView.jsx').includes('/api/v1/admin/wallet/adjust'))process.exit(1);
console.log('[OK] React v0.5.0 scatter, admin + motion components, API mapping, and static server references present.');
if(fs.existsSync(path.join(root,'web-dist','index.html')) && fs.readFileSync(path.join(root,'web-dist','index.html'),'utf8').includes('name="wae-ui-version" content="0.5.0"'))console.log('[OK] Compiled React v0.5.0 bundle available.');
else console.log('[WARN] React v0.5.0 bundle not built here: run npm run build:web on machine with npm access.');
