import test from 'node:test';import assert from 'node:assert/strict';
import {createWorldArcadeAdapter} from '../integrations/wa-world/adapter.mjs';
test('WA connector knows fusion, session state, spin and explicit pot choice',async()=>{
 const old=globalThis.fetch,calls=[];
 globalThis.fetch=async(url,options={})=>{
  calls.push({url:String(url),options});
  if(String(url).includes('/profile'))return new Response(JSON.stringify({balance:500,sessions:[{id:'s'.repeat(32),version:3,game_code:'A1-05'}]}),{status:200});
  return new Response(JSON.stringify({balance:490,session:{id:'s'.repeat(32),version:4,game_code:'A1-05',bonus:{remaining:5},meters:{activity:0},pot_pending:1,last:{grid_after:[],payout:0}}}),{status:200});
 };
 try{
  const c=createWorldArcadeAdapter({serviceKey:'123456789012345678901234567890'});
  assert.match(await c.handle({senderJid:'p@wa',text:'.wae fusion 10',messageId:'a'}),/A1-05/);
  assert.equal(JSON.parse(calls.at(-1).options.body).game_code,'A1-05');
  assert.match(await c.handle({senderJid:'p@wa',text:'.wae spin fusion',messageId:'b'}),/A1-05/);
  assert.equal(JSON.parse(calls.at(-1).options.body).action,'SPIN');
  assert.match(await c.handle({senderJid:'p@wa',text:'.wae open fusion 2',messageId:'c'}),/A1-05/);
  assert.equal(JSON.parse(calls.at(-1).options.body).choice,1);
  assert.match(await c.handle({senderJid:'p@wa',text:'.wae fusion 10',isGroup:true}),/DM/);
 }finally{globalThis.fetch=old;}
});
