import StakeInput from './StakeInput.jsx';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {api,money,prettyError} from '../api.js';
import {Spade,Users,RefreshCw,Copy,ShieldCheck,ArrowLeft,Play} from 'lucide-react';

const cmd=()=>crypto.randomUUID();
const statusName={OPEN:'Menunggu pemain',PLAYING:'Berlangsung',FINISHED:'Selesai',CANCELLED:'Dibatalkan',EXPIRED:'Kedaluwarsa'};
export default function BlackjackLobby({onNotify,onBalance}){
 const [rooms,setRooms]=useState([]),[mine,setMine]=useState([]),[room,setRoom]=useState(null);
 const [stake,setStake]=useState(10),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[refreshing,setRefreshing]=useState(false);
 const lock=useRef(false);
 const error=e=>onNotify?.(prettyError(e?.code||e?.message),'error');
 const list=useCallback(async()=>{const d=await api('GET','/api/v1/blackjack-tables');setRooms(d.tables);setMine(d.mine)},[]);
 const load=useCallback(async id=>{const d=await api('GET',`/api/v1/blackjack-tables/${id}`);setRoom(d.table);onBalance?.(d.balance)},[onBalance]);
 useEffect(()=>{list().catch(error)},[list]);
 useEffect(()=>{if(!room?.id)return;const id=room.id;const source=new EventSource(`/api/v1/blackjack-tables/${id}/events`,{withCredentials:true});
  source.addEventListener('table',event=>{try{const d=JSON.parse(event.data);setRoom(prev=>prev?.id===id&&d.table.version>=prev.version?d.table:prev);onBalance?.(d.balance);}catch{}});
  return()=>source.close();},[room?.id,onBalance]);
 async function run(fn){if(lock.current)return;lock.current=true;setBusy(true);try{await fn();await list()}catch(e){error(e);if(room?.id)await load(room.id).catch(()=>{});}finally{lock.current=false;setBusy(false)}}
 const create=()=>run(async()=>{const d=await api('POST','/api/v1/blackjack-tables',{bet:stake,command_id:cmd()});setRoom(d.table);onBalance?.(d.balance);onNotify?.('Meja Blackjack dibuat. Bagikan kode undangan ke teman.')});
 const join=(val=code,ver)=>run(async()=>{const key=String(val).trim().toUpperCase();if(!/^[A-Z2-9]{7}$/.test(key))throw Error('Kode harus 7 karakter.');
  const t=ver===undefined?(await api('GET',`/api/v1/blackjack-tables/preview/${key}`)).table:{version:ver};
  const d=await api('POST','/api/v1/blackjack-tables/join',{code:key,expected_version:t.version,command_id:cmd()});setRoom(d.table.is_member?d.table:null);onBalance?.(d.balance)});
 const action=(a,confirm_forfeit=false)=>run(async()=>{const d=await api('POST',`/api/v1/blackjack-tables/${room.id}/actions`,{action:a,confirm_forfeit,expected_version:room.version,command_id:cmd()});setRoom(d.table.is_member?d.table:null);onBalance?.(d.balance)});
 const m=room?.members??[],mineSeat=m.find(x=>x.is_me),myTurn=room?.status==='PLAYING'&&room.turn_seat===room.my_seat;
 return <section className="mp-page bj-page">
  <div className="view-intro"><span className="eyebrow">B2 MULTIPLAYER · V1.0.0-RC.1</span><h1>Blackjack Table</h1><p>Meja 1–4 teman, satu dealer bersama. Tiap pemain menentukan HIT/STAND pada gilirannya. Wallet ACR tetap terisolasi dari VCUR.</p></div>
  {!room?<>
   <div className="mp-top">
    <div className="panel mp-hero"><div className="mp-hero-icon"><Spade size={31}/></div><span className="eyebrow">BUAT MEJA</span><h3>Blackjack · 1–4 pemain</h3><p>Satu pemain boleh mulai melawan dealer. Stake bersifat simulasi. Dealer berdiri pada semua 17, blackjack natural 3:2 (total return dibulatkan ke bawah), dan setiap pemain mendapat hasil melawan dealer.</p>
     <label className="mp-field-label">Stake ACR per pemain</label><StakeInput game="B2-MP" value={stake} onChange={setStake} disabled={busy}/>
     <button className="btn primary" onClick={create} disabled={busy}><Play size={16}/> Buat meja</button></div>
    <div className="panel"><span className="eyebrow">UNDANGAN PRIVAT</span><h3>Gabung meja teman</h3><p>Gunakan kode meja dari teman. Kode bukan kredensial login; identitas tetap diverifikasi.</p>
     <div className="mp-join"><input aria-label="Kode meja Blackjack" value={code} maxLength={7} placeholder="KODE 7 KARAKTER" onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,''))}/><button className="btn outline" disabled={busy||code.length!==7} onClick={()=>join()}>Gabung</button></div>
     <div className="mp-safe"><ShieldCheck size={16}/> Stake baru diambil setelah semua siap dan host memulai.</div>
    </div>
   </div>
   <div className="panel"><div className="panel-head"><h3>Meja tersedia</h3><button className="btn outline" disabled={busy||refreshing} onClick={async()=>{setRefreshing(true);try{await list()}catch(e){error(e)}finally{setRefreshing(false)}}}><RefreshCw size={16}/> Refresh</button></div>
    <div className="mp-rooms">{rooms.length===0?<p>Belum ada meja terbuka.</p>:rooms.map(t=><div className="mp-room-row" key={t.id}><Users size={18}/><div><strong>BLACKJACK · {t.code}</strong><small>{t.player_count}/4 · {money(t.bet)} ACR / orang</small></div><span>{statusName[t.status]}</span><button className="btn outline" disabled={busy} onClick={()=>t.is_member?run(()=>load(t.id)):join(t.code,t.version)}>{t.is_member?'Lihat':'Gabung'}</button></div>)}</div>
   </div>
   {mine.length>0&&<div className="panel"><h3>Meja Saya</h3><div className="mp-rooms">{mine.map(t=><button key={t.id} className="mp-my-room" onClick={()=>run(()=>load(t.id))}><span>{t.code} · {statusName[t.status]}</span><span>{t.player_count}/4</span><span>Lihat</span></button>)}</div></div>}
  </>:<>
   <button className="btn ghost" onClick={()=>{setRoom(null);list().catch(error)}}><ArrowLeft size={16}/> Kembali</button>
   <div className="panel bj-table"><div className="panel-head"><div><span className="eyebrow">MEJA BLACKJACK · {room.code}</span><h3>{statusName[room.status]}</h3></div><span className="mp-status">Versi {room.version}</span></div>
    <div className="mp-code"><strong>{room.code}</strong><button className="btn outline" onClick={()=>{navigator.clipboard?.writeText(room.code);onNotify?.('Kode meja disalin.')}}><Copy size={15}/> Salin</button></div>
    <div className="bj-dealer"><span>DEALER · {room.status==='FINISHED'?`Total ${room.dealer_total}`:'Kartu tertutup'}</span><div className="bj-cards">{room.dealer.length?room.dealer.map((card,i)=><span className="bj-card" key={i}>{card}</span>):<span>Menunggu permainan dimulai</span>}</div></div>
    <div className="bj-seats">{[1,2,3,4].map(seat=>{const player=m.find(p=>p.seat===seat),hand=room.hands?.find(h=>h.seat===seat);return <div className={`bj-seat ${room.turn_seat===seat?'turn':''}`} key={seat}>
      <span>PLAYER {seat} {player?.is_me?'· ANDA':''}</span>
      <strong>{player?player.ready?'SIAP':'MENUNGGU':'KOSONG'}</strong>
      <div className="bj-cards">{hand?hand.cards.length?hand.cards.map((c,i)=><span className="bj-card" key={i}>{c}</span>):<span>🂠 × {hand.card_count}</span>:<span>—</span>}</div>
      <small>{hand?.total!==null&&hand?.total!==undefined?`Total ${hand.total} · `:''}{hand?.outcome|| (hand?.done?'Selesai giliran':'')}</small>
      {room.status==='FINISHED'&&hand&&<strong>{hand.outcome} · +{money(hand.payout)} ACR</strong>}
     </div>})}</div>
    {room.status==='PLAYING'&&<p className="bj-turn-info">{myTurn?'Giliran Anda. Pilih HIT atau STAND.':`Giliran pemain ${room.turn_seat}.`}{room.turn_deadline_ms?` Batas: ${new Date(room.turn_deadline_ms).toLocaleTimeString('id-ID')}`:''}</p>}
    <div className="mp-actions">{room.status==='OPEN'&&<>
      {!mineSeat?.ready&&<button className="btn primary" disabled={busy} onClick={()=>action('READY')}>Saya Siap</button>}
      {room.is_host&&<button className="btn primary" disabled={busy||m.length<1||m.some(p=>!p.ready)} onClick={()=>action('START')}>Mulai Blackjack</button>}
      {room.is_host&&<button className="btn outline" disabled={busy} onClick={()=>action('LEAVE')}>Keluar & alihkan host / tutup jika sendiri</button>}
      <button className="btn outline" disabled={busy} onClick={()=>action(room.is_host?'CANCEL':'LEAVE')}>{room.is_host?'Batalkan meja':'Keluar meja'}</button>
     </>}
     {room.status==='PLAYING'&&!room.hands?.find(h=>h.seat===room.my_seat)?.done&&<button className="btn outline" disabled={busy} onClick={()=>{if(window.confirm('Keluar ronde aktif = FORFEIT. Taruhan tidak dikembalikan. Lanjutkan?'))action('LEAVE',true)}}>Forfeit & keluar (tanpa refund)</button>}
     {myTurn&&<><button className="btn primary" disabled={busy} onClick={()=>action('HIT')}>HIT · Ambil Kartu</button><button className="btn outline" disabled={busy} onClick={()=>action('STAND')}>STAND · Berhenti</button></>}
     {room.status==='PLAYING'&&room.turn_deadline_ms<=Date.now()&&<button className="btn outline" disabled={busy} onClick={()=>action('TIMEOUT')}>Lanjutkan Giliran Kedaluwarsa</button>}
    </div>
    <div className="mp-safe"><ShieldCheck size={16}/> Tidak ada split/double pada v0.12. Semua aksi diverifikasi server, deck tersembunyi, saldo diselesaikan sekali saat ronde berakhir. Pindah Web–WA tidak membuat ronde baru.</div>
   </div>
  </>}
 </section>;
}
