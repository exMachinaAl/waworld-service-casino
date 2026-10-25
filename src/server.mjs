import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDb,transaction,ensurePlayer,wallet,checkLedger} from './db.mjs';
import {games,createGame,getSession,sessionsFor,act} from './games.mjs';
import {createHandoff,claimHandoff,approveHandoff,finalizeHandoff,handoffStatus,pendingForWa,browserPlayer,revokeSession,devices,revokeDevice,makeWaLink,claimWaLink,confirmWaLink,waLinkStatus,approveWaLinkWeb} from './auth.mjs';
import {token,uuid,parse,json,digest,now,assert,fail,equal,HttpError} from './util.mjs';
import {setupAdminSchema,adminLogin,adminSession,adminLogout,adminPlayers,adminDashboard,adminRecentAdjustments,adminAdjust} from './admin.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function getEnv(){const filename=path.join(root,'.env');if(!fs.existsSync(filename))return;for(const line of fs.readFileSync(filename,'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim();}}
getEnv();
const remoteAllowed=addr=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(addr);
const getCookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=').slice(0,2)).filter(x=>x.length===2).map(([k,v])=>[k,decodeURIComponent(v)]));
const jsonResponse=(res,status,value,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(json(value));};
function cookie(name,value,secure=true,maxAge){return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; ${secure?'Secure; ':''}${maxAge===0?'Max-Age=0; ':''}Priority=High`;}
function body(req){return new Promise((resolve,reject)=>{let data='';req.on('data',chunk=>{data+=chunk;if(data.length>20000){reject(new HttpError(413,'TOO_LARGE'));req.destroy();}});req.on('end',()=>{if(!data)return resolve({});try{const parsed=parse(data);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error();resolve(parsed);}catch{reject(new HttpError(400,'BAD_JSON'));}});req.on('error',reject);});}
function siteOrigin(req){const host=req.headers.host;const proto=(req.socket.encrypted?'https':'http');return `${proto}://${host}`;}
function verifyOrigin(req){
 const o=req.headers.origin;
 // A browser mutation is always same-origin; clients not providing an Origin cannot mutate using browser cookies.
 assert(o&&o===(process.env.WAE_PUBLIC_ORIGIN||siteOrigin(req)),403,'ORIGIN_DENIED');
}
export function createApp({database=':memory:',serviceKey=process.env.WAE_SERVICE_TOKEN||'',demo=process.env.WAE_DEMO_MODE==='1',host='127.0.0.1'}={}){
 const db=openDb(database);setupAdminSchema(db);const active=new Map(),rate=new Map();
 const adminEnabled=Boolean(demo&&host==='127.0.0.1'&&process.env.WAE_ADMIN_TEST_GRANTS==='1');
 const secure=process.env.WAE_COOKIE_SECURE==='1';
 const sessCookie=secure?'__Host-wae_session':'wae_session',claimCookie=secure?'__Host-wae_claim':'wae_claim';
 const adminCookie=secure?'__Host-wae_admin':'wae_admin';
 function requireAdmin(req){assert(adminEnabled,403,'ADMIN_TEST_DISABLED');
   const session=adminSession(db,getCookies(req)[adminCookie]);assert(session,401,'ADMIN_LOGIN_REQUIRED');return session;}
 function auth(req){const s=browserPlayer(db,getCookies(req)[sessCookie]);assert(s,401,'LOGIN_REQUIRED');return s;}
 function protectedService(req){assert(serviceKey&&serviceKey.length>=24,503,'SERVICE_NOT_CONFIGURED');const k=req.headers['x-wae-service-key'];assert(typeof k==='string'&&equal(k,serviceKey),401,'BAD_SERVICE_KEY');}
 function limit(req,key,max=20,window=60000){const ip=req.socket.remoteAddress||'?';const k=`${ip}:${key}`;const t=now(),entry=rate.get(k);if(!entry||t-entry.s>window)rate.set(k,{s:t,n:1});else{entry.n++;assert(entry.n<=max,429,'RATE_LIMITED');}if(rate.size>3000){for(const [k,v] of rate)if(t-v.s>60000)rate.delete(k);}}
 function emit(id,event){for(const res of active.get(id)||[]){try{res.write(`id: ${event.session.version}\nevent: state\ndata: ${json(event)}\n\n`);}catch{}}}
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`),pathname=url.pathname;
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  try{
   // React/Vite builds into web-dist, served by the SAME origin as our cookie-protected API.
   // Never serve arbitrary files under project root; only Vite output with a safe static path.
   const dist=path.join(root,'web-dist');
   if(req.method==='GET'&&['/','/connect','/app','/admin'].includes(pathname)){
     const file=path.join(dist,'index.html');
     if(!fs.existsSync(file)){
       res.writeHead(503,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
       res.end('<!doctype html><meta charset="utf-8"><title>React belum dibangun</title><h1>React Web UI belum dibangun</h1><p>Jalankan INSTALL.bat untuk mengunduh dependency dan membangun React, lalu START.bat.</p>');return;
     }
     res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(file));return;
   }
   if(req.method==='GET'&&/^\/assets\/[a-zA-Z0-9_./-]+$/.test(pathname)&&!pathname.includes('..')){
     const asset=path.resolve(dist,pathname.slice(1));
     if(!asset.startsWith(path.resolve(dist)+path.sep)||!fs.existsSync(asset)||!fs.statSync(asset).isFile())fail(404,'ASSET_NOT_FOUND');
     const ext=path.extname(asset).toLowerCase();
     const type={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'}[ext];
     if(!type)fail(404,'ASSET_NOT_ALLOWED');
     res.writeHead(200,{'Content-Type':type,'Cache-Control':'public, max-age=31536000, immutable'});
     fs.createReadStream(asset).pipe(res);return;
   }

   if(req.method==='GET'&&pathname==='/api/v1/health')return jsonResponse(res,200,{ok:true,version:'0.5.0-admin-acr',mode:demo?'local-demo':'normal',service_ready:serviceKey.length>=24,admin_test_available:adminEnabled});
   if(req.method==='GET'&&pathname==='/api/v1/games')return jsonResponse(res,200,{games:games()});
   // Admin test controls are deliberately isolated from player cookies, bot service credentials and VCUR.
   // Safe default: unavailable unless WAE_DEMO_MODE=1 + loopback host + WAE_ADMIN_TEST_GRANTS=1.
   if(pathname.startsWith('/api/v1/admin/')){
     // Reject reverse-proxy/public hosts even when local test mode was mistakenly enabled.
     const localHost=url.hostname==='127.0.0.1'&&remoteAllowed(req.socket.remoteAddress);
     const proxied=Boolean(req.headers['x-forwarded-for']||req.headers['forwarded']||req.headers['x-forwarded-host']);
     assert(adminEnabled&&localHost&&!proxied,403,'ADMIN_TEST_DISABLED');
     if(req.method==='POST'){verifyOrigin(req);limit(req,'admin-post',30);}
     if(req.method==='POST'&&pathname==='/api/v1/admin/login'){
       limit(req,'admin-login',5,15*60*1000);
       const b=await body(req);
       const result=adminLogin(db,b.username,b.password);
       res.setHeader('Set-Cookie',cookie(adminCookie,result.secret,secure));
       return jsonResponse(res,200,{username:result.username,role:result.role,expires_at:result.expires_at});
     }
     const admin=requireAdmin(req);
     if(req.method==='GET'&&pathname==='/api/v1/admin/me')return jsonResponse(res,200,{username:admin.username,role:admin.role,expires_at:admin.expires_ms});
     if(req.method==='POST'&&pathname==='/api/v1/admin/logout'){
       adminLogout(db,admin);res.setHeader('Set-Cookie',cookie(adminCookie,'',secure,0));return jsonResponse(res,200,{ok:true});
     }
     if(req.method==='GET'&&pathname==='/api/v1/admin/overview')return jsonResponse(res,200,adminDashboard(db));
     if(req.method==='GET'&&pathname==='/api/v1/admin/players')return jsonResponse(res,200,{players:adminPlayers(db,url.searchParams.get('q')||'')});
     if(req.method==='GET'&&pathname==='/api/v1/admin/adjustments')return jsonResponse(res,200,{adjustments:adminRecentAdjustments(db)});
     if(req.method==='POST'&&pathname==='/api/v1/admin/wallet/adjust'){
       limit(req,'admin-adjust',15,60*1000);
       const result=adminAdjust(db,admin,await body(req));return jsonResponse(res,200,result);
     }
     fail(404,'ENDPOINT_NOT_FOUND');
   }
   if(pathname.startsWith('/internal/')){
    protectedService(req);limit(req,'internal',240);
    const b=req.method==='POST'?await body(req):{};
    const subject=req.method==='GET'?url.searchParams.get('subject'):b.subject;
    if(req.method==='POST'&&pathname==='/internal/v1/handoffs')return jsonResponse(res,201,createHandoff(db,subject,b.session_id??null));
    if(req.method==='GET'&&pathname==='/internal/v1/handoffs/pending')return jsonResponse(res,200,{requests:pendingForWa(db,subject)});
    const m=pathname.match(/^\/internal\/v1\/handoffs\/([a-zA-Z0-9_-]+)\/approve$/);
    if(req.method==='POST'&&m)return jsonResponse(res,200,approveHandoff(db,m[1],subject,b.code));
    if(req.method==='POST'&&pathname==='/internal/v1/wa-links/claim')return jsonResponse(res,200,claimWaLink(db,subject,b.code));
    if(req.method==='POST'&&pathname==='/internal/v1/wa-links/confirm')return jsonResponse(res,200,confirmWaLink(db,subject,b.code));
    if(req.method==='GET'&&pathname==='/internal/v1/profile'){
      const id=transaction(db,()=>ensurePlayer(db,subject));return jsonResponse(res,200,{player_id:id,balance:wallet(db,id),sessions:sessionsFor(db,id)});
    }
    if(req.method==='POST'&&pathname==='/internal/v1/games/create'){
      const id=transaction(db,()=>ensurePlayer(db,subject));const result=createGame(db,id,b.game_code,b.bet);emit(result.session.id,result);return jsonResponse(res,201,result);
    }
    if(req.method==='POST'&&pathname==='/internal/v1/games/action'){
      const id=transaction(db,()=>ensurePlayer(db,subject));const result=act(db,id,b.session_id,b);emit(result.session.id,result);return jsonResponse(res,200,result);
    }
    fail(404,'ENDPOINT_NOT_FOUND');
   }
   if(pathname.startsWith('/api/')&&req.method==='POST'){verifyOrigin(req);limit(req,'post');}
   const b=req.method==='POST'?await body(req):{};
   if(req.method==='POST'&&pathname==='/api/v1/handoffs/claim'){
      limit(req,'handoff',7);const result=claimHandoff(db,b.ref);
      res.setHeader('Set-Cookie',cookie(claimCookie,result.claimSecret,secure));
      return jsonResponse(res,200,{challenge:result.challenge,expires_at:result.expires_at});
   }
   if(req.method==='GET'&&pathname==='/api/v1/handoffs/status')return jsonResponse(res,200,handoffStatus(db,url.searchParams.get('ref'),getCookies(req)[claimCookie]));
   if(req.method==='POST'&&pathname==='/api/v1/handoffs/finalize'){
      limit(req,'handoff',7);
      const result=finalizeHandoff(db,b.ref,getCookies(req)[claimCookie],b.device_label);
      res.setHeader('Set-Cookie',[cookie(sessCookie,result.secret,secure),cookie(claimCookie,'',secure,0)]);
      return jsonResponse(res,200,{ok:true,game_session_id:result.game_session_id});
   }
   if(req.method==='POST'&&pathname==='/api/v1/demo-login'){
      assert(demo&&remoteAllowed(req.socket.remoteAddress)&&host==='127.0.0.1',403,'DEMO_DISABLED');
      const id=transaction(db,()=>ensurePlayer(db,'local-demo','demo'));
      const secret=token(),sessionId=uuid();
      db.prepare('INSERT INTO browser_sessions VALUES(?,?,?,?,?,?,?,?)').run(sessionId,'wa-world',id,digest(secret),now(),now()+7*86400000,null,'Local Demo');
      res.setHeader('Set-Cookie',cookie(sessCookie,secret,secure));return jsonResponse(res,200,{ok:true});
   }
   if(req.method==='GET'&&pathname==='/api/v1/me'){
      const s=auth(req);return jsonResponse(res,200,{player_id:s.player_id,device_label:s.device_label,balance:wallet(db,s.player_id),demo});
   }
   if(req.method==='GET'&&pathname==='/api/v1/wallet'){
      const s=auth(req);const tx=db.prepare(`SELECT t.id,t.reason,t.created_ms,SUM(e.delta) AS delta FROM transfers t JOIN entries e ON e.transfer_id=t.id JOIN accounts a ON e.account_id=a.id WHERE a.owner_id=? GROUP BY t.id ORDER BY t.created_ms DESC LIMIT 30`).all(s.player_id);
      return jsonResponse(res,200,{currency:'ACR',balance:wallet(db,s.player_id),transactions:tx});
   }
   if(req.method==='GET'&&pathname==='/api/v1/sessions'){
      const s=auth(req);return jsonResponse(res,200,{sessions:sessionsFor(db,s.player_id)});
   }
   if(req.method==='POST'&&pathname==='/api/v1/sessions'){
      const s=auth(req);const result=createGame(db,s.player_id,b.game_code,b.bet);emit(result.session.id,result);return jsonResponse(res,201,result);
   }
   const match=pathname.match(/^\/api\/v1\/sessions\/([a-f0-9]{32})(?:\/(actions|events))?$/);
   if(match){
      const s=auth(req),id=match[1],kind=match[2];
      if(req.method==='GET'&&!kind)return jsonResponse(res,200,{session:getSession(db,id,s.player_id),balance:wallet(db,s.player_id)});
      if(req.method==='POST'&&kind==='actions'){const result=act(db,s.player_id,id,b);emit(id,result);return jsonResponse(res,200,result);}
      if(req.method==='GET'&&kind==='events'){
        const ses=getSession(db,id,s.player_id);
        res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});
        res.write(`retry: 2500\nevent: state\ndata: ${json({session:ses,balance:wallet(db,s.player_id)})}\n\n`);
        if(!active.has(id))active.set(id,new Set());active.get(id).add(res);
        const heartbeat=setInterval(()=>{try{res.write(':ping\n\n');}catch{}},20000);
        req.on('close',()=>{clearInterval(heartbeat);active.get(id)?.delete(res);});return;
      }
   }
   if(req.method==='GET'&&pathname==='/api/v1/devices'){
      const s=auth(req);return jsonResponse(res,200,{devices:devices(db,s.player_id),current_id:s.id});
   }
   if(req.method==='POST'&&pathname==='/api/v1/logout'){
      const s=auth(req);revokeSession(db,s);const as=adminSession(db,getCookies(req)[adminCookie]);if(as)adminLogout(db,as);res.setHeader('Set-Cookie',[cookie(sessCookie,'',secure,0),cookie(adminCookie,'',secure,0)]);return jsonResponse(res,200,{ok:true});
   }
   const deviceMatch=pathname.match(/^\/api\/v1\/devices\/([a-f0-9]{32})\/revoke$/);
   if(req.method==='POST'&&deviceMatch){const s=auth(req);revokeDevice(db,s.player_id,deviceMatch[1]);return jsonResponse(res,200,{ok:true});}
   if(req.method==='POST'&&pathname==='/api/v1/wa-links'){
      const s=auth(req);return jsonResponse(res,201,makeWaLink(db,s.player_id));
   }
   const linkMatch=pathname.match(/^\/api\/v1\/wa-links\/([a-f0-9]{32})(?:\/(approve))?$/);
   if(linkMatch){const s=auth(req);if(req.method==='GET'&&!linkMatch[2])return jsonResponse(res,200,waLinkStatus(db,linkMatch[1],s.player_id));if(req.method==='POST'&&linkMatch[2])return jsonResponse(res,200,approveWaLinkWeb(db,linkMatch[1],s.player_id));}
   if(req.method==='GET'&&pathname==='/api/v1/dev/check'){
      assert(demo&&remoteAllowed(req.socket.remoteAddress),403,'DEMO_DISABLED');return jsonResponse(res,200,checkLedger(db));
   }
   fail(404,'ENDPOINT_NOT_FOUND');
  }catch(err){
   if(res.headersSent){try{res.end();}catch{};return;}
   const status=Number(err.status)||500;
   if(status===500)console.error('[WAE]',err.stack||String(err));
   jsonResponse(res,status,{error:err.code||'INTERNAL_ERROR',message:status>=500?'An internal error occurred':err.message});
  }
 });
 return {server,db,close:()=>new Promise(resolve=>server.close(()=>{db.close();resolve();}))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const host=process.env.WAE_HOST||'127.0.0.1';const port=Number(process.env.WAE_PORT||8787);
 const config={host,database:path.join(root,'data','arcade.sqlite'),serviceKey:process.env.WAE_SERVICE_TOKEN,demo:process.env.WAE_DEMO_MODE==='1'};
 if(host!=='127.0.0.1'&&process.env.WAE_COOKIE_SECURE!=='1'){
    console.error('Refusing public bind without secure cookies. Use TLS reverse proxy and WAE_COOKIE_SECURE=1.');process.exit(1);
 }
 const app=createApp(config);
 app.server.listen(port,host,()=>console.log(`WAE 0.5.0 Admin ACR listening on http://${host}:${port} (demo=${config.demo}); VCUR bridge: DISABLED`));
}
