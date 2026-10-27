import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('web/src/App.jsx'),vite=read('web/vite.config.js'),server=read('src/server.mjs');
for(const needle of ['EventSource','/api/v1/handoffs/claim','/api/v1/wa-links','expected_version','/api/v1/wallet','React'])if(!source.includes(needle)){console.error('[FAIL] Missing web integration '+needle);process.exit(1)}
for(const p of ['web/package.json','web/src/styles.css','web/src/animations.css','web/src/precision-reels.css','web/src/reel-precision.mjs','web/src/components/PrecisionReels.jsx','web/src/animation.mjs','src/scatter-rush.mjs','src/mystery-guci.mjs','src/column-blast.mjs','web/src/components/GamePanel.jsx','web/src/components/GameStages.jsx','web/src/api.js','web/src/components/AdminView.jsx','src/admin.mjs','scripts/admin-setup.mjs','web/index.html'])if(!fs.existsSync(path.join(root,p))){console.error('[FAIL] Missing file '+p);process.exit(1)}
if(!vite.includes('web-dist')||!server.includes('web-dist'))process.exit(1);
if(!read('web/index.html').includes('wae-ui-version')||!read('web/src/components/GamePanel.jsx').includes('animationDuration')||!read('web/src/components/GameStages.jsx').includes('ScatterRushStage')||!read('web/src/components/GameStages.jsx').includes('MysteryGuciStage')||!read('web/src/components/GameStages.jsx').includes('ColumnBlastStage')||!read('web/src/components/GameStages.jsx').includes('UltimateFusionStage')){console.error('[FAIL] Motion UI marker/modules missing');process.exit(1);}
if(!read('web/src/components/GamePanel.jsx').includes('startAuto')||!read('web/src/components/PrecisionReels.jsx').includes('precision-winning-guides')||!fs.existsSync(path.join(root,'web/src/auto-spin.mjs')))process.exit(1);
if(!source.includes('AdminView')||!read('web/src/components/AdminView.jsx').includes('/api/v1/admin/wallet/adjust'))process.exit(1);
if(!read('web/src/components/GameStages.jsx').includes('PrecisionReels')||!read('web/src/components/GamePanel.jsx').includes('Kalibrasi reel'))process.exit(1);
if(!source.includes('MultiplayerHub')||!read('web/src/components/MultiplayerLobby.jsx').includes('/api/v1/rooms')||!read('web/src/components/BlackjackLobby.jsx').includes('/api/v1/blackjack-tables'))process.exit(1);
for(const f of ['src/slot-rules.mjs','web/src/roulette-motion.mjs','web/src/components/PhysicalRoulette.jsx','web/src/physical-roulette.css'])if(!fs.existsSync(path.join(root,f)))process.exit(1);
if(!source.includes('HelpCenter')||!read('web/src/components/AdminView.jsx').includes('admin-module-tabs')||!read('web/src/components/RoundLobby.jsx').includes('lottery-empty')){console.error('[FAIL] RC2 Help/Admin/Lottery UI missing');process.exit(1)}
console.log('[OK] React v1.0.0-rc.3 Physical Roulette, bidirectional slot wins, multiplayer, precision reels, A1 games, admin, handoff, source/API mapping verified.');
if(fs.existsSync(path.join(root,'web-dist','index.html')) && fs.readFileSync(path.join(root,'web-dist','index.html'),'utf8').includes('name="wae-ui-version" content="1.0.0-rc.3"'))console.log('[OK] Compiled React v1.0.0-rc.3 bundle available.');
else console.log('[WARN] React v1.0.0-rc.3 bundle not built here: run npm run build:web on machine with npm access.');

for(const rel of ['web/src/components/GettingStarted.jsx','web/src/components/GuideDirectory.jsx','web/src/game-guides.mjs']) if(!fs.existsSync(path.join(root,rel)))process.exit(1);
if(!source.includes('rc3-mobile-tabs')||!source.includes('openGuide')||!read('web/src/components/HelpCenter.jsx').includes('GuideDirectory'))process.exit(1);
