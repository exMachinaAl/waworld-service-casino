import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorldArcadeAdapter} from '../integrations/wa-world/adapter.mjs';
test('WA native adapter: Mystery Guci can create, spin and open, group actions blocked',async()=>{
 const original=globalThis.fetch;const calls=[];
 const base={id:'g'.repeat(32),game_code:'A1-03',version:1,meters:{activity:0,symbols:0,victory:0},pot_pending:0,phase:'READY'};
 globalThis.fetch=async (url,options={})=>{
  calls.push({url,options});
  if(url.includes('/profile'))return {ok:true,json:async()=>({balance:500,sessions:[base]})};
  if(url.includes('/games/create'))return {ok:true,json:async()=>({balance:500,session:base})};
  if(url.includes('/games/action'))return {ok:true,json:async()=>({balance:520,session:{...base,phase:'READY',last_open:{payout:20},pot_pending:0}})};
  throw Error('Unexpected request');
 };
 try{
  const client=createWorldArcadeAdapter({serviceKey:'test-key-123456789012345678901234'});
  assert.match(await client.handle({senderJid:'player@wa',text:'.wae guci 10',messageId:'message-a'}),/Mystery|A1-03/);
  assert.equal(JSON.parse(calls[0].options.body).game_code,'A1-03');
  assert.match(await client.handle({senderJid:'player@wa',text:'.wae spin guci',messageId:'message-b'}),/WORLD ARCADE/);
  assert.equal(JSON.parse(calls.at(-1).options.body).action,'SPIN');
  assert.match(await client.handle({senderJid:'player@wa',text:'.wae open 2',messageId:'message-c'}),/WORLD ARCADE/);
  assert.equal(JSON.parse(calls.at(-1).options.body).action,'OPEN_POT');
  assert.equal(JSON.parse(calls.at(-1).options.body).choice,1);
  const n=calls.length;
  assert.match(await client.handle({senderJid:'player@wa',text:'.wae guci 10',isGroup:true}),/DM bot/);
  assert.equal(calls.length,n);
 }finally{globalThis.fetch=original;}
});
