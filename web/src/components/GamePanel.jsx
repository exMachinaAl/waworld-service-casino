import StakeInput from './StakeInput.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowRightLeft,Check,Gauge,Radio,RefreshCw,RotateCw,BookOpen,Shield,Sparkles,Target,Volume2,VolumeX} from 'lucide-react';
import {money,shortId} from '../api';
import {animationDuration,isNewVersion,preferReducedMotion,saveMotionPreference} from '../animation.mjs';
import {AUTO_PRESETS,AUTO_GAMES,validAutoMode,shouldStopAuto,AUTO_MIN_GAP_MS} from '../auto-spin.mjs';
import {BlackjackStage,RouletteStage,SlotStage,ScatterRushStage,MysteryGuciStage,ColumnBlastStage,UltimateFusionStage} from './GameStages';

const META={'A1-01':{name:'Classic Match',genre:'SLOT · A1 SERIES'},'A1-02':{name:'Scatter Rush',genre:'SLOT · BONUS MODE'},'A1-03':{name:'Mystery Guci',genre:'SLOT · COLLECT & REVEAL'},'A1-04':{name:'Column Blast',genre:'SLOT · REEL TRANSFORMATION'},'A1-05':{name:'Ultimate Fusion',genre:'SLOT · SCATTER × POT × BLAST'},'B1':{name:'European Roulette',genre:'TABLE · EUROPEAN'},'B2':{name:'Blackjack 21',genre:'TABLE · SINGLE PLAYER'},'L1':{name:'Number Draw',genre:'NUMBER GAME · FREE DAILY ENTRY'}};
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
function Pill({children,kind='muted'}){return <span className={`pill pill-${kind}`}>{children}</span>}

/** WAE is authoritative. React only delays *display* of already-settled results. */
export default function GamePanel({session,balance,bet,onBet,actNow,busy,syncStatus,refresh,navigate,onGuide}){
  const [choice,setChoice]=useState('red');
  const [numberGuess,setNumberGuess]=useState('1234');
  const [reduced,setReduced]=useState(preferReducedMotion);
  const [reelGuide,setReelGuide]=useState(false);
  const [visible,setVisible]=useState(session);
  const [visibleBalance,setVisibleBalance]=useState(balance);
  const [phase,setPhase]=useState('idle');
  const [autoStatus,setAutoStatus]=useState({running:false,done:0,mode:null,message:''});
  const autoJob=useRef(null),autoSleep=useRef(null);
  const timer=useRef(null);
  const revealTimer=useRef(null);
  const mountedId=useRef(session?.id);
  useEffect(()=>{document.documentElement.dataset.waeMotion=reduced?'off':'on';return ()=>{delete document.documentElement.dataset.waeMotion}},[reduced]);
  useEffect(()=>{document.documentElement.dataset.waeReelGuide=reelGuide?'on':'off';return ()=>{delete document.documentElement.dataset.waeReelGuide}},[reelGuide]);

  useEffect(()=>{
    return ()=>{clearTimeout(timer.current);clearTimeout(revealTimer.current);if(autoJob.current)autoJob.current.cancelled=true;if(autoSleep.current){clearTimeout(autoSleep.current.timer);autoSleep.current.resolve();autoSleep.current=null;}};
  },[]);

  useEffect(()=>{
    if(!session)return;
    // Switching games should never replay an earlier game's animation.
    if(mountedId.current!==session.id){
      if(autoJob.current)autoJob.current.cancelled=true;
      mountedId.current=session.id;
      clearTimeout(timer.current);clearTimeout(revealTimer.current);
      setVisible(session);setVisibleBalance(balance);setPhase('idle');return;
    }
    if(!isNewVersion(visible,session)){
      if(reduced && phase!=='idle'){clearTimeout(timer.current);clearTimeout(revealTimer.current);setVisible(session);setVisibleBalance(balance);setPhase('idle');}
      else if(phase==='idle')setVisibleBalance(balance);
      return;
    }
    clearTimeout(timer.current);clearTimeout(revealTimer.current);
    const duration=animationDuration(session.game_code,reduced);
    if(duration===0){setVisible(session);setVisibleBalance(balance);setPhase('idle');return;}
    setPhase('running');
    timer.current=setTimeout(()=>{
      setVisible(session);setVisibleBalance(balance);setPhase('reveal');
      revealTimer.current=setTimeout(()=>setPhase('idle'),620);
    },duration);
    return ()=>clearTimeout(timer.current);
  // Only restart timeline on an authoritative state change or motion toggle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[session?.id,session?.version,reduced]);

  useEffect(()=>{if(phase==='idle')setVisibleBalance(balance);},[balance,phase]);

  if(!session)return null;
  const shown=visible?.id===session.id?visible:session;
  const code=session.game_code;
  const meta=META[code]||{name:code,genre:'ARCADE'};
  const animating=phase==='running';
  const justRevealed=phase==='reveal';
  const isIncoming=animating && shown?.id===session.id && session.version>shown.version;
  const guciOpenOnly = (code==='A1-03'||code==='A1-05') && isIncoming && session.last_open && JSON.stringify(session.last_open)!==JSON.stringify(shown.last_open);
  const incomingGrid=isIncoming && !guciOpenOnly ? (session.last?.grid_after ?? session.last?.grid ?? null) : null;
  const spinId=`${session.id}:${session.version}`;
  const controlsLocked=busy||phase!=='idle'||autoStatus.running;
  const potChoice=(code==='A1-03'||code==='A1-05')&&session.phase==='POT_CHOICE';
  const bonusActive=(code==='A1-02'||code==='A1-05')&&session.bonus?.remaining>0;
  const displayedBet=bonusActive||potChoice?session.bet:bet;
  // During free spins the bet is pinned to the value stored in the session.
  const play=async(action,extra={})=>{
    if(controlsLocked)return;
    if(!reduced)setPhase('running');
    const succeeded=await actNow(action,bonusActive?{...extra,bet:session.bet}:extra);
    if(!succeeded){setPhase('idle');}
  };
  const stopAuto=()=>{if(autoJob.current)autoJob.current.cancelled=true;
    if(autoSleep.current){clearTimeout(autoSleep.current.timer);autoSleep.current.resolve();autoSleep.current=null;}
    setAutoStatus(x=>({...x,message:'Menghentikan setelah aksi berjalan selesai…'}));
  };
  const waitAuto=duration=>new Promise(resolve=>{
    const timer=setTimeout(()=>{autoSleep.current=null;resolve();},duration);
    autoSleep.current={timer,resolve};
  });
  const startAuto=async mode=>{
    if(autoJob.current)return;
    if(!validAutoMode(mode,code)||controlsLocked||potChoice)return;
    const job={cancelled:false,gameId:session.id};autoJob.current=job;
    const pinnedBet=displayedBet;
    let completed=0,message='Dihentikan';
    setAutoStatus({running:true,done:0,mode,message:'Auto Spin aktif · satu request per putaran'});
    try{
      while(!job.cancelled){
        if(job.gameId!==mountedId.current){message='Sesi berubah';break;}
        const spinResult=await actNow('SPIN',{bet:pinnedBet});
        if(!spinResult?.session){message='Permintaan ditolak atau jaringan sibuk. Saldo sudah disinkronkan jika server dapat dihubungi.';break;}
        completed++;
        const next=spinResult.session;
        setAutoStatus({running:true,done:completed,mode,message:'Menampilkan hasil server…'});
        const done=shouldStopAuto({mode,gameCode:code,session:next,completed});
        // Never begin another spin until the authoritative result is visually revealed.
        await waitAuto(Math.max(AUTO_MIN_GAP_MS,animationDuration(code,reduced)+650));
        if(done){message=done;break;}
      }
    }catch {message='Terhenti karena gangguan; cek status dan saldo terbaru.';}
    finally{
      if(job.cancelled)message='Dihentikan oleh pemain';
      if(autoJob.current===job)autoJob.current=null;
      setAutoStatus({running:false,done:completed,mode,message});
    }
  };
  const toggle=()=>{
    const next=!reduced;
    setReduced(next);saveMotionPreference(next);
  };

  return <>
    <div className="play-top">
      <button className="back-link" onClick={()=>navigate('sessions')}><ArrowLeft size={18}/> Kembali</button>
      <div><Pill kind={syncStatus==='connected'?'success':'muted'}><Radio size={12}/> {syncStatus==='connected'?'LIVE SYNC':'SYNCING'}</Pill> <Pill>v{session.version}</Pill></div>
    </div>
    <div className="play-layout">
      <div className="play-main">
        <div className="play-heading"><div><span className="eyebrow">{meta.genre}</span><h1>{meta.name}</h1><p>Session #{shortId(session.id)}</p><button type="button" className="btn outline rc3-game-help" onClick={onGuide}><BookOpen size={16}/> Aturan game</button></div><button className="icon-button" title="Segarkan sesi" aria-label="Segarkan sesi" disabled={controlsLocked} onClick={refresh}><RefreshCw size={18}/></button></div>
        {code==='A1-01'&&<SlotStage session={shown} animating={animating} justRevealed={justRevealed} reduced={reduced} targetGrid={incomingGrid} spinId={spinId}/>}
        {code==='A1-02'&&<ScatterRushStage session={shown} animating={animating} justRevealed={justRevealed} reduced={reduced} targetGrid={incomingGrid} spinId={spinId}/>}
        {code==='A1-04'&&<ColumnBlastStage session={shown} animating={animating} justRevealed={justRevealed} reduced={reduced} targetGrid={incomingGrid} spinId={spinId}/>}
        {code==='A1-05'&&<UltimateFusionStage session={shown} animating={animating} justRevealed={justRevealed} reduced={reduced} targetGrid={incomingGrid} spinId={spinId}/>}
        {code==='A1-03'&&<MysteryGuciStage session={shown} animating={animating} justRevealed={justRevealed} reduced={reduced} targetGrid={incomingGrid} spinId={spinId}/>}
        {code==='B1'&&<RouletteStage session={shown} targetNumber={session.last?.number} animating={animating} justRevealed={justRevealed} reduced={reduced}/>}
        {code==='L1'&&<div className="panel draw-stage"><span className="eyebrow">FREE NUMBER DRAW · TEST RELEASE</span><h2>🔢 Pilih 4–12 digit</h2><p>Minimal 4 angka berturut-turut benar sejak posisi pertama untuk mendapat ACR. Setiap angka tambahan menaikkan hadiah 1,5×. Semua peluang tetap.</p>{shown.last?.draw&&<><div className="draw-numbers">{shown.last.draw}</div><p>Nomor Anda: <strong>{shown.last.guess}</strong></p><p>Benar berurutan: <strong>{shown.last.matched_prefix}</strong> · Hadiah: <strong>{money(shown.last.reward)} ACR</strong></p></>}<p className="draw-quota">Sisa kesempatan hari ini: {session.quota?.player_remaining??3} · Kuota global: {session.quota?.global_remaining??200}</p><small>Tidak menggunakan stake. Kemenangan berasal dari treasury ACR, tidak dapat dikonversi ke VCUR.</small></div>}
        {code==='B2'&&<BlackjackStage session={shown} animating={animating} justRevealed={justRevealed} reduced={reduced}/>}
      </div>
      <aside className="play-side">
        <div className="panel bet-panel">
          <div className="panel-head"><h3>Game controls</h3><Gauge size={19}/></div>
          {code==='L1'?<div className="bet-label"><span>Biaya entri</span><strong>GRATIS</strong></div>:<div className="bet-label"><span>ACR per ronde</span><strong>{money(displayedBet)} ACR</strong></div>}
          {code!=='L1'&&<StakeInput game={code} value={displayedBet} onChange={onBet} disabled={controlsLocked||bonusActive||potChoice} snapshot={bonusActive||potChoice?session.stake_policy:null}/>}
          {code==='L1'&&<div className="choice-selector"><label htmlFor="draw-number">Nomor 4–12 digit (angka nol di depan valid)</label><input id="draw-number" inputMode="numeric" autoComplete="off" maxLength={12} value={numberGuess} disabled={controlsLocked} onChange={e=>setNumberGuess(e.target.value.replace(/\D/g,'').slice(0,12))}/></div>}
          {code==='B1'&&<div className="choice-selector"><label htmlFor="roulette-choice">Tebakan roulette</label><select id="roulette-choice" value={choice} disabled={controlsLocked} onChange={e=>setChoice(e.target.value)}><option value="red">🔴 Red</option><option value="black">⚫ Black</option><option value="odd">Odd</option><option value="even">Even</option>{Array.from({length:37},(_,i)=><option key={i} value={i}>{i} {i===0?'· green':RED.has(i)?'· red':'· black'}</option>)}</select></div>}
          {bonusActive&&<p className="bonus-locked-hint">✨ FREE SPINS AKTIF — nilai bet dikunci. Putaran bonus tidak memotong ACR.</p>}
          <div className="game-control-buttons">
            {code==='A1-01'&&<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('SPIN')}><RotateCw size={18}/>{animating?'MEMUTAR…':'SPIN NOW'}</button>}
            {code==='A1-02'&&<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('SPIN')}><Sparkles size={18}/>{animating?'REELS BERPUTAR…':bonusActive?`FREE SPIN (${session.bonus.remaining})`:'SPIN SCATTER'}</button>}
            {code==='A1-03'&&(potChoice?<div className="guci-picks"><p>Pilih satu guci tersegel (pilihan sudah ditentukan di server).</p>{[0,1,2].map(index=><button key={index} className="btn outline full" disabled={controlsLocked} onClick={()=>play('OPEN_POT',{choice:index})}>🏺 BUKA GUCI {index+1}</button>)}</div>:<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('SPIN')}><RotateCw size={18}/> SPIN GUCI</button>)}
            {code==='A1-04'&&<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('SPIN')}><RotateCw size={18}/>{animating?'CHARGING…':'⚡ SPIN COLUMN BLAST'}</button>}
            {code==='A1-05'&&(potChoice?<div className="guci-picks"><p>Pilih 1 dari 3 guci tersegel, tanpa mengubah hasil yang sudah ditetapkan server.</p>{[0,1,2].map(index=><button key={index} className="btn outline full" disabled={controlsLocked} onClick={()=>play('OPEN_POT',{choice:index})}>🏺 BUKA GUCI {index+1}</button>)}</div>:<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('SPIN')}><Sparkles size={18}/>{animating?'FUSION BERPUTAR…':bonusActive?`FREE SPIN (${session.bonus.remaining})`:'🌌 SPIN ULTIMATE FUSION'}</button>)}
            {code==='L1'&&<button className="btn primary full" disabled={controlsLocked||!/^[0-9]{4,12}$/.test(numberGuess)||!session.quota?.player_remaining||!session.quota?.global_remaining} onClick={()=>play('SPIN',{digits:numberGuess})}><Target size={18}/> DRAW NOMOR GRATIS</button>}
            {code==='B1'&&<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('SPIN',{choice})}><Target size={18}/>{animating?'RODA BERPUTAR…':'SPIN WHEEL'}</button>}
            {code==='B2'&&(shown.phase==='FINISHED'?<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('NEW_ROUND')}><RotateCw size={18}/> Ronde baru</button>:<><button className="btn primary full" disabled={controlsLocked} onClick={()=>play('HIT')}>HIT <ArrowRight size={17}/></button><button className="btn outline full" disabled={controlsLocked} onClick={()=>play('STAND')}>STAND <Check size={17}/></button></>)}
          </div>
          {AUTO_GAMES.has(code)&&<div className="auto-spin-panel" aria-label="Kontrol Auto Spin">
            <div className="auto-spin-title"><strong>Auto Spin</strong><small>Satu aksi server setiap putaran · stop kapan pun</small></div>
            <div className="auto-spin-options">{AUTO_PRESETS.map(mode=><button key={String(mode)} type="button" onClick={()=>startAuto(mode)} disabled={controlsLocked||potChoice||!validAutoMode(mode,code)} title={mode==='bonus'?'Berhenti setelah Scatter/Guci/Blast terpicu; maksimal 500 putaran':'Jalankan '+mode+' putaran'}>{mode==='bonus'?'∞ → BONUS':mode}</button>)}</div>
            {autoStatus.running&&<button type="button" className="btn outline full auto-stop" onClick={stopAuto}>■ STOP AUTO</button>}
            {(autoStatus.running||autoStatus.message)&&<p className="auto-progress" role="status" aria-live="polite">{autoStatus.done} putaran · {autoStatus.message}</p>}
            <small className="auto-disclaimer">Berhenti otomatis saat guci perlu dibuka, saldo kurang, rate limit, atau koneksi tidak pasti. Mode ∞ dibatasi 500 putaran per aktivasi.</small>
          </div>}
          <button className="motion-pref" onClick={toggle} aria-pressed={!reduced} type="button" title="Pengaturan animasi hanya mengubah tampilan, tidak hasil permainan">{reduced?<VolumeX size={17}/>:<Volume2 size={17}/>} Animasi {reduced?'nonaktif':'aktif'} <span>{reduced?'Instan':'Sinematik'}</span></button>
          {code.startsWith('A1-')&&<button className="motion-pref" type="button" onClick={()=>setReelGuide(v=>!v)} aria-pressed={reelGuide} title="Tampilkan garis pengukuran sel untuk menguji presisi reel"> <Gauge size={17}/> Kalibrasi reel <span>{reelGuide?'GUIDE ON':'GUIDE OFF'}</span></button>}
          <div className="control-note"><Shield size={17}/> Semua hasil dan perubahan saldo ditentukan server. Animasi hanya visual.</div>
        </div>
        <div className="panel play-wallet"><span>BALANCE</span><strong>{money(visibleBalance)} <small>ACR</small></strong><p>Wallet Arcade terpisah dari WA-WORLD.</p></div>
        <div className="panel dual-box"><div><ArrowRightLeft size={19}/><strong>Dual Mode</strong></div><p>Game menggunakan sesi yang sama lewat Web dan WhatsApp. Gunakan <code>.wae web</code> dari DM bot.</p></div>
      </aside>
    </div>
  </>;
}
