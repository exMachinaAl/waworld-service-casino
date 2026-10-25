/** WORLD Arcade Engine native connector adapter.
 * Requires trusted WA-WORLD message sender; only use parsed sender from Baileys, NEVER message text as identity.
 * No VCUR access or WA-WORLD database calls.
 */
import {randomUUID} from 'node:crypto';
export function createWorldArcadeAdapter({apiUrl='http://127.0.0.1:8787',serviceKey,publicUrl=apiUrl}={}){
 if(!serviceKey||serviceKey.length<24)throw Error('WAE serviceKey must be configured separately');
 async function request(method,route,payload){
   const res=await fetch(`${apiUrl.replace(/\/$/,'')}${route}`,{method,headers:{'Content-Type':'application/json','X-WAE-Service-Key':serviceKey},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(8000)});
   const data=await res.json();if(!res.ok)throw Error(`WAE ${data.error||res.status}`);return data;
 }
 const post=(route,data)=>request('POST',route,data);
 const get=(route)=>request('GET',route);
 const fmt=s=>s?`${s.game_code} (#${s.id.slice(0,8)}), v${s.version}`:'Tidak ada sesi';
 function summarize(d){const s=d.session;let text=`🎮 WORLD ARCADE (${s.game_code})\nSesi: ${s.id}\nVersi: ${s.version}\nACR: ${d.balance}`;
   if(s.game_code==='A1-01')text+=`\n${(s.last?.grid||[]).map(row=>row.join(' | ')).join('\n')}\nHadiah: ${s.last?.payout??'-'} ACR`;
   if(s.game_code==='B1')text+=`\nRoulette: ${s.last?.number??'-'} (${s.last?.color??'-'})\nHasil: ${s.last?.net??'-'} ACR`;
   if(s.game_code==='B2')text+=`\nDealer: ${s.dealer.join(' ')}\nKartu: ${s.player.join(' ')}\nStatus: ${s.phase}`;
   return text;
 }
 async function handle({senderJid,text,isGroup=false,messageId}){
   const raw=String(text||'').trim();if(!/^\.wae(?:\s|$)/i.test(raw))return null;
   if(isGroup)return '🔒 World Arcade hanya menerima aksi privat di DM bot. Buka chat pribadi dan tulis .wae';
   if(!senderJid||typeof senderJid!=='string')return 'Identitas pengirim tidak valid.';
   const args=raw.split(/\s+/),op=(args[1]||'menu').toLowerCase(),subject=senderJid;
   try{
    if(['menu','help'].includes(op))return '🎮 WORLD ARCADE\n.wae profile\n.wae slot [5|10|20|50]\n.wae roulette [5|10|20|50]\n.wae blackjack [5|10|20|50]\n.wae spin [red|black|odd|even|0..36]\n.wae hit | .wae stand\n.wae web | .wae pending\n.wae approve <ref> <6digit>\n.wae link <6digit> | .wae confirm <6digit>\nSaldo ACR berbeda dari VCUR.';
    if(op==='profile'||op==='status'){
      const r=await get(`/internal/v1/profile?subject=${encodeURIComponent(subject)}`);
      return `👤 WORLD ARCADE\nACR: ${r.balance}\nSesi terkini: ${r.sessions.slice(0,3).map(fmt).join(' / ')||'Belum ada'}`;
    }
    if(op==='web'){
      const profile=await get(`/internal/v1/profile?subject=${encodeURIComponent(subject)}`);
      const r=await post('/internal/v1/handoffs',{subject,session_id:profile.sessions[0]?.id??null});
      return `🔐 LINK WEB PRIBADI\n${publicUrl.replace(/\/$/,'')}/connect?r=${r.ref}\n\nLink ini bukan token login. Buka link, klaim, lalu ketik .wae pending untuk melihat kode konfirmasi. Jangan setujui handoff yang tidak Anda mulai.`;
    }
    if(op==='pending'){
      const r=await get(`/internal/v1/handoffs/pending?subject=${encodeURIComponent(subject)}`);
      return r.requests.length?'🔐 Permintaan Web aktif:\n'+r.requests.map(x=>`${x.ref}\nStatus: ${x.status}${x.display_code?` · kode: ${x.display_code}`:''}\n${x.status==='CLAIMED'?`.wae approve ${x.ref} ${x.display_code}`:''}`).join('\n---\n'):'Tidak ada permintaan handoff aktif.';
    }
    if(op==='approve'){
      if(!/^[a-zA-Z0-9_-]{12,50}$/.test(args[2]||'')||!/^[0-9]{6}$/.test(args[3]||''))return 'Gunakan .wae approve <ref> <kode 6 angka> dari DM pemilik.';
      const r=await post(`/internal/v1/handoffs/${args[2]}/approve`,{subject,code:args[3]});return r.ok?'✅ Perangkat disetujui. Kembali ke browser dan pilih Lanjut.':'❌ Kode konfirmasi salah.';
    }
    if(op==='link'||op==='confirm'){
      if(!/^[0-9]{6}$/.test(args[2]||''))return `Gunakan .wae ${op} <6-digit-code>`;
      const r=await post(`/internal/v1/wa-links/${op==='link'?'claim':'confirm'}`,{subject,code:args[2]});
      return op==='link'?`Permintaan penautan ditemukan. Jika Anda yang memulai dari browser, konfirmasi dengan .wae confirm ${args[2]}`:'Konfirmasi WhatsApp berhasil. Kembali ke browser dan klik Selesaikan Link.';
    }
    if(['slot','roulette','blackjack'].includes(op)){
      const bet=Number(args[2]||10);const codes={slot:'A1-01',roulette:'B1',blackjack:'B2'};
      const r=await post('/internal/v1/games/create',{subject,game_code:codes[op],bet});return summarize(r);
    }
    if(['spin','hit','stand'].includes(op)){
      const prof=await get(`/internal/v1/profile?subject=${encodeURIComponent(subject)}`);
      const code=op==='spin'?(args[2]?'B1':'A1-01'):'B2';
      const s=prof.sessions.find(x=>x.game_code===code);
      if(!s)return `Tidak ada sesi ${code}. Buat dahulu dengan .wae slot / roulette / blackjack.`;
      const r=await post('/internal/v1/games/action',{subject,session_id:s.id,expected_version:s.version,command_id:`wa:${messageId||randomUUID()}:${s.id}`,action:op==='spin'?'SPIN':op.toUpperCase(),choice:args[2]||'red'});
      return summarize(r);
    }
    return 'Perintah tidak dikenal. Gunakan .wae menu';
   }catch(error){return `WORLD Arcade: ${String(error.message).slice(0,135)}. Coba .wae status untuk menyegarkan.`;}
 }
 return {handle};
}
