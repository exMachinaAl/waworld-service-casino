import test from 'node:test';import assert from 'node:assert/strict';
import {createApp} from '../src/server.mjs';

test('burst spam responds 429 without terminating server; state and ACR remain consistent',async()=>{
 const app=createApp({database:':memory:',demo:true,host:'127.0.0.1'});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${app.server.address().port}`;
 async function post(path,data,cookie){const res=await fetch(base+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});return {status:res.status,data:await res.json(),retry:res.headers.get('Retry-After'),cookie:res.headers.get('Set-Cookie')};}
 try{
  const login=await post('/api/v1/demo-login',{});assert.equal(login.status,200);
  const cookie=login.cookie.split(';')[0];
  const game=await post('/api/v1/sessions',{game_code:'A1-01',bet:5},cookie);assert.equal(game.status,201);
  const id=game.data.session.id;let version=1,accepted=0,denied=0;
  for(let i=0;i<9;i++){
   const r=await post(`/api/v1/sessions/${id}/actions`,{command_id:`spam-recovery-${i}`,expected_version:version,action:'SPIN',bet:5},cookie);
   if(r.status===200){accepted++;version=r.data.session.version;}
   else {assert.equal(r.status,429);assert.equal(r.retry,'3');denied++;}
  }
  assert.equal(accepted,7);assert.ok(denied>=1);
  const st=await fetch(base+`/api/v1/sessions/${id}`,{headers:{Cookie:cookie}});assert.equal(st.status,200);
  const current=await st.json();assert.equal(current.session.version,1+accepted);
  const wallet=await fetch(base+'/api/v1/wallet',{headers:{Cookie:cookie}});assert.equal(wallet.status,200);
  assert.ok(Number.isSafeInteger((await wallet.json()).balance));
  const health=await fetch(base+'/api/v1/health');assert.equal(health.status,200);assert.equal((await health.json()).ok,true);
 }finally{await app.close();}
});
