import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const major=Number(process.versions.node.split('.')[0]);
let failures=0;const check=(test,ok)=>{console.log(`${ok?'[OK]':'[FAIL]'} ${test}`);if(!ok)failures++;};
check('Node >= 22',major>=22);check('Game modules',fs.existsSync(path.join(root,'src','games.mjs')));
check('React Web source',fs.existsSync(path.join(root,'web','src','App.jsx')));
check('WA adapter',fs.existsSync(path.join(root,'integrations','wa-world','adapter.mjs')));
check('Protected source untouched',!fs.existsSync(path.join(root,'src','world-economy.js')));
if(failures)process.exitCode=1;
