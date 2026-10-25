/** Optional source syntax check using globally installed TypeScript or local typescript.
 * No compiler dependency is added to the project's production runtime.
 */
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let ts;
try{ts=require('typescript');}catch{console.log('[SKIP] TypeScript checker tidak ada; Vite build memvalidasi JSX saat instalasi.');process.exit(0)}
const files=['web/src/App.jsx','web/src/main.jsx','web/src/components/GamePanel.jsx','web/src/components/GameStages.jsx','web/src/components/AdminView.jsx'];
let errors=0;
for(const file of files){
 const source=readFileSync(path.join(root,file),'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);
 const diagnostics=ast.parseDiagnostics;
 if(diagnostics.length){errors+=diagnostics.length;for(const d of diagnostics){const loc=ast.getLineAndCharacterOfPosition(d.start??0);console.error(`[FAIL] ${file}:${loc.line+1}:${loc.character+1} ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`);}}
 else console.log('[PASS] JSX '+file);
}
process.exitCode=errors?1:0;
