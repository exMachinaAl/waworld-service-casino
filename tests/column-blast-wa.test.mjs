import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorldArcadeAdapter} from '../integrations/wa-world/adapter.mjs';
test('WA adapter creates Column Blast and spins same session via service API',async()=>{
 const saved=globalThis.fetch,calls=[];
 const session={id:'a'.repeat(32),game_code:'A1-04',version:3,bet:10,last:null};
 globalThis.fetch=async(url,options={})=>{
  calls.push({url,options});
  const data=url.includes('/profile')?{balance:500,sessions:[session]}:url.includes('/games/create')?{session,balance:500}:url.includes('/games/action')?{session:{...session,last:{grid_after:[['⚡']],activated:true,trigger_columns:[1,2,3],lines:[],payout:30}},balance:520}:null;
  assert.ok(data,'unexpected API route');return {ok:true,json:async()=>data};
 };
 try{
  const adapter=createWorldArcadeAdapter({serviceKey:'secret-long-enough-for-this-test-00000'});
  assert.match(await adapter.handle({senderJid:'player@wa',text:'.wae blast 10'}),/A1-04/);
  assert.equal(JSON.parse(calls.at(-1).options.body).game_code,'A1-04');
  assert.match(await adapter.handle({senderJid:'player@wa',text:'.wae spin blast',messageId:'wa-msg-1'}),/Blast/);
  assert.equal(JSON.parse(calls.at(-1).options.body).action,'SPIN');
  assert.equal(JSON.parse(calls.at(-1).options.body).expected_version,3);
  const total=calls.length;
  assert.match(await adapter.handle({senderJid:'player@wa',text:'.wae blast 10',isGroup:true}),/DM bot/);
  assert.equal(calls.length,total);
 }finally{globalThis.fetch=saved;}
});
