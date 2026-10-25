import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AlertTriangle,ArrowDown,ArrowUp,CheckCircle2,Coins,KeyRound,LogOut,RefreshCw,Search,ShieldCheck} from 'lucide-react';
import {api,money,clock,shortId,prettyError} from '../api';

function Metric({label,value,note}){return <div className="admin-metric"><small>{label}</small><strong>{value}</strong><span>{note}</span></div>}
export default function AdminView({enabled,notify,onRefreshWallet}){
 const [auth,setAuth]=useState(null),[username,setUsername]=useState(''),[password,setPassword]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [overview,setOverview]=useState(null),[players,setPlayers]=useState([]),[search,setSearch]=useState(''),[history,setHistory]=useState([]);
 const [selected,setSelected]=useState(null),[operation,setOperation]=useState('ADD'),[amount,setAmount]=useState(500),[reason,setReason]=useState('');
 const [confirm,setConfirm]=useState(false);
 const pendingRequest=useRef(null);
 const reload=useCallback(async(q='')=>{
   const [o,p,h]=await Promise.all([
    api('GET','/api/v1/admin/overview'),api('GET',`/api/v1/admin/players?q=${encodeURIComponent(q)}`),
    api('GET','/api/v1/admin/adjustments')]);
   setOverview(o);setPlayers(p.players);setHistory(h.adjustments);
   setSelected(s=>s?p.players.find(x=>x.id===s.id)||null:null);
 },[]);
 useEffect(()=>{if(!enabled)return;let mounted=true;api('GET','/api/v1/admin/me').then(u=>{
  if(mounted)setAuth(u);
 }).catch(()=>{if(mounted)setAuth(null);});return()=>{mounted=false};},[enabled]);
 useEffect(()=>{if(auth)reload(search).catch(e=>setError(e.message));},[auth?.username]);
 const signIn=async e=>{e.preventDefault();setBusy(true);setError('');try{
   const u=await api('POST','/api/v1/admin/login',{username,password});setAuth(u);setPassword('');
 }catch(e){setError(e.message);}finally{setBusy(false);}};
 const signOut=async()=>{setBusy(true);try{await api('POST','/api/v1/admin/logout',{});setAuth(null);setOverview(null);setSelected(null);setHistory([]);}catch(e){setError(e.message)}finally{setBusy(false)}};
 const searchPlayers=async e=>{e.preventDefault();setBusy(true);try{await reload(search)}catch(e){setError(e.message)}finally{setBusy(false)}};
 const submit=async e=>{e.preventDefault();if(!selected||busy)return;
   if(!confirm){setError('Centang konfirmasi sebelum mengubah ACR.');return;}
   setBusy(true);setError('');try{
     const key=JSON.stringify([selected.id,operation,Number(amount),reason.trim()]);
     if(!pendingRequest.current||pendingRequest.current.key!==key)pendingRequest.current={key,id:crypto.randomUUID()};
     const result=await api('POST','/api/v1/admin/wallet/adjust',{
       player_id:selected.id,operation,amount:Number(amount),reason:reason.trim(),request_id:pendingRequest.current.id});
     pendingRequest.current=null;
     notify(`${operation==='ADD'?'Ditambahkan':'Dikurangi'} ${money(amount)} ACR. Saldo pemain: ${money(result.balance)}.`);
     setReason('');setConfirm(false);await reload(search);await onRefreshWallet?.();
   }catch(e){setError(e.message);}finally{setBusy(false);}};
 if(!enabled)return <section className="admin-view"><div className="view-intro"><span className="eyebrow">ADMIN · TEST ONLY</span><h1>Admin ACR Control</h1></div><div className="admin-warning"><AlertTriangle size={22}/><p>Admin testing dinonaktifkan. Pastikan server lokal menggunakan <code>WAE_DEMO_MODE=1</code>, <code>WAE_HOST=127.0.0.1</code>, dan <code>WAE_ADMIN_TEST_GRANTS=1</code>. Buat admin menggunakan <code>ADMIN-SETUP.bat</code>, kemudian restart server.</p></div></section>;
 if(!auth)return <section className="admin-view"><div className="view-intro"><span className="eyebrow">RESTRICTED AREA</span><h1>Admin ACR Control</h1><p>Saldo pengujian hanya dapat diubah setelah login sebagai admin WAE.</p></div><form className="admin-login panel" onSubmit={signIn}><div className="admin-login-icon"><KeyRound size={25}/></div><h3>Login administrator</h3><label>Username admin<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username admin" required minLength={3}/></label><label>Password<input autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password admin" required/></label>{error&&<div className="admin-error" role="alert">{error}</div>}<button className="btn primary full" disabled={busy} type="submit"><ShieldCheck size={17}/> {busy?'Memeriksa…':'Masuk panel admin'}</button><p className="admin-muted">Jika belum punya akun admin, jalankan <code>ADMIN-SETUP.bat</code> di folder WAE utama. Mode demo tidak otomatis memberikan hak admin.</p></form></section>;
 return <section className="admin-view"><div className="view-intro"><span className="eyebrow">LOCAL TEST TOOLKIT · ADMIN ONLY</span><div className="admin-title-row"><div><h1>ACR Control Center</h1><p>Ubah saldo arcade untuk uji coba, dengan ledger dan audit. Tidak mengakses VCUR.</p></div><button className="btn outline" onClick={signOut} disabled={busy}><LogOut size={16}/> Keluar admin</button></div></div>
 <div className="admin-warning"><AlertTriangle size={21}/><p><strong>Mode pengujian saja.</strong> Setiap kredit ADD berasal dari pool ACR khusus tes; pengurangan mengembalikan kredit ke pool. Tidak ada penambahan ke VCUR WA-WORLD.</p></div>
 <div className="admin-metrics"><Metric label="TOTAL PEMAIN" value={money(overview?.players)} note="Tenant WA-WORLD"/><Metric label="TOTAL ACR PEMAIN" value={money(overview?.player_acr)} note="Saldo pengguna"/><Metric label="SISA POOL TEST" value={money(overview?.pool_acr)} note="Sumber pemberian ACR"/><Metric label="ADD HARI INI (UTC)" value={`${money(overview?.daily_grants)} / ${money(overview?.daily_limit)}`} note="Batas global harian"/></div>
 <div className="admin-workspace">
  <section className="panel admin-players"><div className="panel-head"><div><span className="eyebrow">PLAYER DIRECTORY</span><h3>Pilih pemain</h3></div><button className="icon-button" onClick={()=>reload(search)} aria-label="Refresh pemain" title="Refresh pemain"><RefreshCw size={18}/></button></div><form onSubmit={searchPlayers} className="admin-search"><input placeholder="Cari ID atau identitas WA/demo" value={search} onChange={e=>setSearch(e.target.value)} maxLength={90}/><button aria-label="Cari pemain" type="submit"><Search size={19}/></button></form><div className="admin-player-list">{players.length?players.map(p=><button key={p.id} type="button" className={`admin-player ${selected?.id===p.id?'active':''}`} onClick={()=>{setSelected(p);setConfirm(false);setError('')}}><div><strong>{p.identities||shortId(p.id)}</strong><small>ID: {shortId(p.id)}</small></div><b>{money(p.balance)} ACR</b></button>):<div className="empty-list">Belum ada pemain yang cocok.</div>}</div></section>
  <section className="panel admin-adjust"><div className="panel-head"><div><span className="eyebrow">ADMIN LEDGER</span><h3>Tambah / Kurangi ACR</h3></div><Coins size={22}/></div>{selected?<form onSubmit={submit}><div className="admin-selected"><small>PEMAIN TERPILIH</small><strong>{selected.identities||selected.id}</strong><span>Saldo saat ini: {money(selected.balance)} ACR</span></div><div className="admin-mode"><button type="button" onClick={()=>{setOperation('ADD');setConfirm(false)}} className={operation==='ADD'?'active':''}><ArrowUp size={16}/> Tambah ACR</button><button type="button" onClick={()=>{setOperation('DEDUCT');setConfirm(false)}} className={operation==='DEDUCT'?'active':''}><ArrowDown size={16}/> Kurangi ACR</button></div><label>Jumlah ACR<input type="number" min={1} max={overview?.max_per_action??50000} step={1} required value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Alasan penyesuaian (minimal 8 karakter)<textarea required minLength={8} maxLength={240} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Contoh: Saldo pengujian A1-02 Scatter Rush" rows={3}/></label><label className="admin-checkbox"><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/> <span>Saya menyetujui penyesuaian saldo ACR virtual pemain ini dan pencatatan audit.</span></label>{error&&<div role="alert" className="admin-error">{error}</div>}<button type="submit" disabled={busy||!confirm||!reason.trim()||Number(amount)<=0} className="btn primary full"><CheckCircle2 size={17}/>{busy?'Memproses…':`${operation==='ADD'?'Tambah':'Kurangi'} ${money(amount)} ACR`}</button></form>:<div className="empty-list">Pilih salah satu pemain untuk mengatur saldo ACR.</div>}</section>
 </div>
 <section className="panel admin-log"><div className="panel-head"><div><span className="eyebrow">TRANSACTION AUDIT</span><h3>Riwayat perubahan admin</h3></div><ShieldCheck size={20}/></div><div className="admin-log-table"><table><thead><tr><th>Waktu</th><th>Pemain</th><th>Aktivitas</th><th>ACR</th><th>Alasan</th><th>Admin</th></tr></thead><tbody>{history.map(x=><tr key={x.id}><td>{clock(x.created_ms)}</td><td>{shortId(x.player_id)}</td><td>{x.operation==='ADD'?'Tambah':'Kurangi'}</td><td className={x.operation==='ADD'?'positive':'negative'}>{x.operation==='ADD'?'+':'-'}{money(x.amount)}</td><td>{x.reason}</td><td>{x.admin}</td></tr>)}</tbody></table>{!history.length&&<div className="empty-list">Belum ada transaksi admin.</div>}</div></section>
 </section>;
}
