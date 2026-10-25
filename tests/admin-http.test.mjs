import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/server.mjs';
import {createAdmin} from '../src/admin.mjs';

async function session(enabled){
 const old=process.env.WAE_ADMIN_TEST_GRANTS;
 if(enabled)process.env.WAE_ADMIN_TEST_GRANTS='1';else delete process.env.WAE_ADMIN_TEST_GRANTS;
 const app=createApp({demo:true,host:'127.0.0.1'});
 const username='owner',password='veryStrongPw1212';createAdmin(app.db,username,password);
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 const port=app.server.address().port,origin=`http://127.0.0.1:${port}`;
 const request=async (method,route,data,cookie='')=>{
  const response=await fetch(origin+route,{method,headers:{...(method==='POST'?{'Origin':origin,'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});
  const parsed=await response.json();return {response,data:parsed};
 };
 return {app,request,finish:async()=>{await app.close();if(old===undefined)delete process.env.WAE_ADMIN_TEST_GRANTS;else process.env.WAE_ADMIN_TEST_GRANTS=old;}};
}
// Tests use sequential execution because env flag is read at app creation.
test('HTTP Admin: disabled by default and demo player cannot grant ACR',async()=>{
 const t=await session(false);try{
  assert.equal((await t.request('GET','/api/v1/admin/overview')).response.status,403);
  assert.equal((await t.request('POST','/api/v1/admin/login',{username:'owner',password:'veryStrongPw1212'})).response.status,403);
 }finally{await t.finish()}
});
test('HTTP Admin: login cookie, player search, adjust, dedupe and logout',async()=>{
 const t=await session(true);try{
  const unauth=await t.request('GET','/api/v1/admin/overview');assert.equal(unauth.response.status,401);
  const login=await t.request('POST','/api/v1/admin/login',{username:'owner',password:'veryStrongPw1212'});
  assert.equal(login.response.status,200);
  const cookie=login.response.headers.get('set-cookie').split(';')[0];
  const me=await t.request('GET','/api/v1/admin/me',null,cookie);assert.equal(me.data.role,'ADMIN');
  // Create player via demo login using separate cookie.
  const demo=await t.request('POST','/api/v1/demo-login',{});assert.equal(demo.response.status,200);
  const dir=await t.request('GET','/api/v1/admin/players?q=local-demo',null,cookie);
  assert.equal(dir.data.players.length,1);const id=dir.data.players[0].id;
  const input={player_id:id,operation:'ADD',amount:400,reason:'ACR test for scatter',request_id:'12345678-1234-1234-1234-123456789abc'};
  const adjust=await t.request('POST','/api/v1/admin/wallet/adjust',input,cookie);
  assert.equal(adjust.response.status,200);assert.equal(adjust.data.balance,900);
  const again=await t.request('POST','/api/v1/admin/wallet/adjust',input,cookie);
  assert.equal(again.data.reused,true);
  const audit=await t.request('GET','/api/v1/admin/adjustments',null,cookie);
  assert.equal(audit.data.adjustments.length,1);
  assert.equal((await t.request('POST','/api/v1/admin/wallet/adjust',input)).response.status,401);
  const logout=await t.request('POST','/api/v1/admin/logout',{},cookie);assert.equal(logout.response.status,200);
  assert.equal((await t.request('GET','/api/v1/admin/me',null,cookie)).response.status,401);
 }finally{await t.finish()}
});
