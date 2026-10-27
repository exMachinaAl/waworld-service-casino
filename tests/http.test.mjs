import test from 'node:test';import assert from 'node:assert/strict';
import {createApp} from '../src/server.mjs';

test('HTTP: handoff, login, authenticated game, and guarded internal service',async()=>{
 const key='secure-test-service-key-just-for-tests-123456',app=createApp({database:':memory:',serviceKey:key,demo:true,host:'127.0.0.1'});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${app.server.address().port}`;
 const call=async(method,route,data,extra={})=>{
  const r=await fetch(base+route,{method,headers:{Origin:base,...extra,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});
  const json=await r.json();return {status:r.status,json,cookie:r.headers.get('set-cookie')};
 };
 try{
  const health=await call('GET','/api/v1/health');assert.equal(health.status,200);assert.equal(health.json.version,'1.0.0-rc.2');
  const home=await fetch(base+'/');assert.ok([200,503].includes(home.status));
  if(home.status===503)assert.match(await home.text(),/React Web UI belum dibangun/);
  assert.equal((await call('POST','/internal/v1/handoffs',{subject:'tester@s.whatsapp.net'})).status,401);
  const h=await call('POST','/internal/v1/handoffs',{subject:'tester@s.whatsapp.net'},{'X-WAE-Service-Key':key});assert.equal(h.status,201);
  const claim=await call('POST','/api/v1/handoffs/claim',{ref:h.json.ref});assert.equal(claim.status,200);
  const cookie=claim.cookie.split(';')[0];
  assert.equal((await call('POST','/api/v1/handoffs/finalize',{ref:h.json.ref},{Cookie:cookie})).status,409);
  const a=await call('POST',`/internal/v1/handoffs/${h.json.ref}/approve`,{subject:'tester@s.whatsapp.net',code:claim.json.challenge},{'X-WAE-Service-Key':key});assert.deepEqual(a.json,{ok:true});
  const f=await call('POST','/api/v1/handoffs/finalize',{ref:h.json.ref},{Cookie:cookie});assert.equal(f.status,200);
  const browserCookie=f.cookie.split(';')[0];
  const catalog=await call('GET','/api/v1/games');
  assert.ok(catalog.json.games.some(g=>g.code==='A1-02'));
  const scatter=await call('POST','/api/v1/sessions',{game_code:'A1-02',bet:10},{Cookie:browserCookie});
  assert.equal(scatter.status,201);
  const scatterSpin=await call('POST',`/api/v1/sessions/${scatter.json.session.id}/actions`,{command_id:'http-scatter-spin-12345',expected_version:1,action:'SPIN',bet:10},{Cookie:browserCookie});
  assert.equal(scatterSpin.status,200);
  assert.equal(scatterSpin.json.session.last.grid.length,4);
  assert.equal(scatterSpin.json.session.last.grid[0].length,6);
  assert.ok(catalog.json.games.some(g=>g.code==='A1-05'));
  const fusion=await call('POST','/api/v1/sessions',{game_code:'A1-05',bet:10},{Cookie:browserCookie});
  assert.equal(fusion.status,201);
  const fusionSpin=await call('POST',`/api/v1/sessions/${fusion.json.session.id}/actions`,{command_id:'http-fusion-spin-1234567',expected_version:1,action:'SPIN',bet:10},{Cookie:browserCookie});
  assert.equal(fusionSpin.status,200);
  assert.equal(fusionSpin.json.session.last.grid_before.length,4);
  assert.equal(fusionSpin.json.session.last.grid_after[0].length,6);
  assert.ok(catalog.json.games.some(g=>g.code==='A1-04'));
  const blast=await call('POST','/api/v1/sessions',{game_code:'A1-04',bet:10},{Cookie:browserCookie});
  assert.equal(blast.status,201);
  const blastSpin=await call('POST',`/api/v1/sessions/${blast.json.session.id}/actions`,{command_id:'http-blast-spin-1234567',expected_version:1,action:'SPIN',bet:10},{Cookie:browserCookie});
  assert.equal(blastSpin.status,200);
  assert.equal(blastSpin.json.session.last.grid_before.length,4);
  assert.equal(blastSpin.json.session.last.grid_after[0].length,5);
  const game=await call('POST','/api/v1/sessions',{game_code:'A1-01',bet:10},{Cookie:browserCookie});assert.equal(game.status,201);
  const sess=game.json.session;
  const action={command_id:'http-test-idempotent-1234',expected_version:sess.version,action:'SPIN',bet:10};
  const spin=await call('POST',`/api/v1/sessions/${sess.id}/actions`,action,{Cookie:browserCookie});assert.equal(spin.status,200);
  const repeat=await call('POST',`/api/v1/sessions/${sess.id}/actions`,action,{Cookie:browserCookie});assert.equal(repeat.status,200);assert.deepEqual(repeat.json,spin.json);
  const stale=await call('POST',`/api/v1/sessions/${sess.id}/actions`,{...action,command_id:'http-stale-command-id-123'}, {Cookie:browserCookie});assert.equal(stale.status,409);
  const noOrigin=await fetch(base+'/api/v1/sessions',{method:'POST',headers:{Cookie:browserCookie,'Content-Type':'application/json'},body:'{}'});assert.equal(noOrigin.status,403);
 }finally{await app.close();}
});
