import test from 'node:test';import assert from 'node:assert/strict';
import {createApp} from '../src/server.mjs';
import {createWorldArcadeAdapter} from '../integrations/wa-world/adapter.mjs';
test('WhatsApp connector creates, joins, readies and finishes Dice Duel via authenticated service',async()=>{
 const key='wae-multiplayer-key-test-long-123456';
 const app=createApp({database:':memory:',serviceKey:key,demo:true,host:'127.0.0.1'});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 try{
  const apiUrl=`http://127.0.0.1:${app.server.address().port}`;
  const adapter=createWorldArcadeAdapter({apiUrl,serviceKey:key});
  const alice='mp-alice@s.whatsapp.net',bob='mp-bob@s.whatsapp.net';
  const send=(senderJid,text,id)=>adapter.handle({senderJid,text,messageId:'mp-message-'+id,isGroup:false});
  const created=await send(alice,'.wae room create 10','1');
  assert.match(created,/DICE DUEL ROOM/);const code=created.match(/Kode: ([A-Z2-9]{7})/)[1];
  const listing=await send(alice,'.wae room list','2');assert.match(listing,new RegExp(code));
  const joined=await send(bob,`.wae room join ${code}`,'3');assert.match(joined,/Bergabung/);
  const bready=await send(bob,`.wae room ready ${code}`,'4');assert.match(bready,/ROOM/);
  const aready=await send(alice,`.wae room ready ${code}`,'5');assert.match(aready,/ROOM/);
  const result=await send(alice,`.wae room start ${code}`,'6');assert.match(result,/FINISHED/);assert.match(result,/pemenang/);
  const status=await send(bob,`.wae room status ${code}`,'7');assert.match(status,/FINISHED/);
  const repeated=await send(alice,`.wae room start ${code}`,'6');assert.equal(repeated,result);
  assert.match(await adapter.handle({senderJid:alice,text:'.wae room list',isGroup:true}),/DM bot/);
 }finally{await app.close();}
});
