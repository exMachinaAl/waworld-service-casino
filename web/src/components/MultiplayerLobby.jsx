import StakeInput from './StakeInput.jsx';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Users,ShieldCheck,Dices,Copy,RefreshCw,CheckCircle2,ArrowLeft,Play,Plus,LogIn,XCircle,LoaderCircle} from 'lucide-react';
import {api,money,prettyError} from '../api.js';

function actionId(){return crypto.randomUUID();}
function Status({room}){return <span className={`mp-status mp-${room.status.toLowerCase()}`}>{room.status==='OPEN'?'MENUNGGU':room.status==='FINISHED'?'SELESAI':room.status==='EXPIRED'?'KEDALUWARSA':'DIBATALKAN'}</span>}
export default function MultiplayerLobby({onNotify,onBalance}){
 const [rooms,setRooms]=useState([]),[mine,setMine]=useState([]),[room,setRoom]=useState(null),[bet,setBet]=useState(10),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const ref=useRef(null);
 const showError=e=>onNotify?.(prettyError(e?.code||e?.message),'error');
 const refresh=useCallback(async()=>{const d=await api('GET','/api/v1/rooms');setRooms(d.rooms);setMine(d.mine);return d;},[]);
 const open=useCallback(async id=>{try{const d=await api('GET',`/api/v1/rooms/${id}`);setRoom(d.room);onBalance?.(d.balance)}catch(e){showError(e)}},[]);
 useEffect(()=>{let alive=true;refresh().catch(e=>{if(alive)showError(e)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[refresh]);
 useEffect(()=>{if(!room?.id)return;const id=room.id;ref.current?.close();const es=new EventSource(`/api/v1/rooms/${id}/events`,{withCredentials:true});ref.current=es;
  es.addEventListener('room',event=>{try{const d=JSON.parse(event.data);setRoom(old=>old?.id===id&&d.room.version>=old.version?d.room:old);onBalance?.(d.balance);}catch{}});
  return()=>{es.close();if(ref.current===es)ref.current=null};
 },[room?.id]);
 async function run(task){if(busy)return;setBusy(true);try{await task();await refresh()}catch(e){showError(e)}finally{setBusy(false)}}
 function create(){run(async()=>{const d=await api('POST','/api/v1/rooms',{bet,command_id:actionId()});setRoom(d.room);onBalance?.(d.balance);onNotify?.('Room berhasil dibuat. Bagikan kode kepada teman.')})}
 function join(targetCode=code,version=null){run(async()=>{
  const key=String(targetCode).trim().toUpperCase();if(!/^[A-Z2-9]{7}$/.test(key))throw Error('Kode room harus 7 karakter.');
  const r=version!==null?{version}:rooms.find(x=>x.code===key)||(await api('GET',`/api/v1/rooms/preview/${key}`)).room;
  const d=await api('POST','/api/v1/rooms/join',{code:key,expected_version:r.version,command_id:actionId()});setRoom(d.room);onBalance?.(d.balance);onNotify?.('Bergabung ke room berhasil.')
 })}
 function command(action){if(!room)return;run(async()=>{
  const d=await api('POST',`/api/v1/rooms/${room.id}/actions`,{action,expected_version:room.version,command_id:actionId()});setRoom(d.room);onBalance?.(d.balance);
  if(action==='START')onNotify?.('Dice Duel selesai. Hasil dibuat oleh server.');
 })}
 const seats=room?.members??[];
 return <section className="mp-page">
  <div className="view-intro"><span className="eyebrow">MULTIPLAYER · v0.9.0</span><h1>Friends Lobby</h1><p>Buat room Dice Duel, bagikan kode kepada teman, dan mainkan satu ronde bersama. Semua ACR menggunakan ledger engine, bukan VCUR.</p></div>
  {!room?<>
   <div className="mp-top">
    <div className="panel mp-hero"><div className="mp-hero-icon"><Dices size={32}/></div><span className="eyebrow">ROOM BARU</span><h3>Dice Duel · 2 pemain</h3><p>Kedua pemain memasang jumlah ACR yang sama. Dadu lebih tinggi memenangkan total dua stake. Jika seri, lempar ulang tanpa biaya tambahan.</p>
     <label className="mp-field-label">ACR per pemain</label><StakeInput game="T0" value={bet} onChange={setBet} disabled={busy}/>
     <button className="btn primary" onClick={create} disabled={busy}><Plus size={16}/> Buat Room</button>
    </div>
    <div className="panel"><span className="eyebrow">INVITATION CODE</span><h3>Gabung teman</h3><p>Masukkan kode room yang teman kirim dari Web atau chat WhatsApp. Kode hanyalah undangan, bukan akses ke akun.</p>
     <div className="mp-join"><input aria-label="Kode room" value={code} maxLength={7} placeholder="7 KARAKTER" onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,''))}/><button className="btn outline" onClick={()=>join()} disabled={busy||!code}><LogIn size={16}/> Gabung</button></div>
     <div className="mp-safe"><ShieldCheck size={16}/> Room berlaku 2 jam. Saldo tidak dikurangi sebelum host memulai duel.</div>
    </div>
   </div>
   <div className="panel"><div className="panel-head"><div><span className="eyebrow">AVAILABLE ROOMS</span><h3>Lobby Terbuka</h3></div><button className="btn outline" disabled={busy} onClick={()=>run(refresh)}><RefreshCw size={16}/> Refresh</button></div>
    {loading?<p><LoaderCircle className="spin-icon" size={18}/> Memuat lobby…</p>:rooms.length===0?<div className="empty-list">Belum ada room terbuka. Buat room pertama dan undang teman.</div>:
     <div className="mp-rooms">{rooms.map(r=><div className="mp-room-row" key={r.id}><div className="mp-room-icon"><Users size={19}/></div><div><strong>Dice Duel · {r.code}</strong><small>{r.player_count}/2 pemain · {money(r.bet)} ACR / pemain</small></div><Status room={r}/><button className="btn outline" disabled={busy} onClick={()=>r.is_member?open(r.id):join(r.code,r.version)}>{r.is_member?'Lihat':'Gabung'}</button></div>)}</div>}
   </div>
   {mine.length>0&&<div className="panel"><div className="panel-head"><h3>Room Saya</h3></div><div className="mp-rooms">{mine.map(r=><button key={r.id} className="mp-my-room" onClick={()=>open(r.id)}><span>{r.code} · {r.game_code}</span><Status room={r}/><span>Lihat</span></button>)}</div></div>}
  </>:<>
   <button className="btn ghost" onClick={()=>{setRoom(null);refresh().catch(showError)}}><ArrowLeft size={16}/> Kembali ke lobby</button>
   <div className="panel mp-match"><div className="panel-head"><div><span className="eyebrow">DICE DUEL · {room.code}</span><h3>Room Pertandingan</h3></div><Status room={room}/></div>
     <p>Taruhan simulasi: <strong>{money(room.bet)} ACR per pemain.</strong> Hasil berasal dari RNG server dan settlement atomik.</p>
     <div className="mp-code"><strong>{room.code}</strong><button className="btn outline" onClick={()=>{navigator.clipboard?.writeText(room.code);onNotify?.('Kode room disalin')}}><Copy size={17}/> Salin kode</button></div>
     <div className="mp-seats">{[1,2].map(seat=>{const user=seats.find(m=>m.seat===seat);return <div key={seat} className={`mp-seat ${user?.ready?'ready':''}`}><Users size={25}/><strong>Pemain {seat}</strong><span>{user?user.is_me?'Anda':'Teman':'Menunggu pemain…'}</span><span>{user?(user.ready?'SIAP':'BELUM SIAP'):'KOSONG'}</span></div>})}</div>
     {room.result&&<div className="mp-result"><span className="eyebrow">SERVER-VERIFIED RESULT</span><div className="mp-dice">🎲 {room.result.dice[0]} <span>VS</span> {room.result.dice[1]} 🎲</div><h3>{room.result.winning_seat===room.my_seat?'Anda Menang!':'Pemain '+room.result.winning_seat+' Menang'}</h3><p>Hadiah {money(room.result.payout)} ACR · {room.result.rolls.length} kali lempar</p></div>}
     {room.status==='OPEN'&&room.is_member&&<div className="mp-actions">
      {!seats.find(m=>m.is_me)?.ready&&<button className="btn primary" disabled={busy} onClick={()=>command('READY')}><CheckCircle2 size={17}/> Saya Siap</button>}
      {room.is_host&&<button className="btn primary" disabled={busy||seats.length!==2||seats.some(m=>!m.ready)} onClick={()=>command('START')}><Play size={17}/> Mulai Duel</button>}
      {room.is_host?<button className="btn outline" disabled={busy} onClick={()=>command('CANCEL')}><XCircle size={17}/> Batalkan Room</button>:<button className="btn outline" disabled={busy} onClick={()=>command('LEAVE')}><ArrowLeft size={17}/> Keluar Room</button>}
     </div>}
     <div className="mp-safe"><ShieldCheck size={16}/> Satu host, dua pemain, satu settlement. Refresh halaman atau pindah perangkat tidak menjalankan ulang duel.</div>
   </div>
  </>}
 </section>;
}
