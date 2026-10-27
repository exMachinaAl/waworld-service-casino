import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {randomBytes} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),file=path.join(root,'.env');
if(fs.existsSync(file)){console.log('[OK] .env exists; NOT overwritten.');process.exit(0);}
const key=randomBytes(32).toString('base64url');
fs.writeFileSync(file,[
 '# Local development only. Never expose this service to internet as-is.',
 'LOTTERY_ENABLED=false','WAE_ADMIN_ENABLED=0','WAE_ADMIN_TEST_GRANTS=0','WAE_HOST=127.0.0.1','WAE_PORT=8787','WAE_DEMO_MODE=1','WAE_COOKIE_SECURE=0',
 `WAE_SERVICE_TOKEN=${key}`,''].join('\n'),{mode:0o600,flag:'wx'});
console.log('[OK] Created local .env; service token saved here. Do not share this file.');
