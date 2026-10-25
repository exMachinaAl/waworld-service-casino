import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowRightLeft,Check,Gauge,Radio,RefreshCw,RotateCw,Shield,Sparkles,Target,Volume2,VolumeX} from 'lucide-react';
import {money,shortId} from '../api';
import {animationDuration,isNewVersion,preferReducedMotion,saveMotionPreference} from '../animation.mjs';
import {BlackjackStage,RouletteStage,SlotStage,ScatterRushStage} from './GameStages';

const META={'A1-01':{name:'Classic Match',genre:'SLOT · A1 SERIES'},'A1-02':{name:'Scatter Rush',genre:'SLOT · BONUS MODE'},'B1':{name:'European Roulette',genre:'TABLE · EUROPEAN'},'B2':{name:'Blackjack 21',genre:'TABLE · SINGLE PLAYER'}};
const BETS=[5,10,20,50];
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
function Pill({children,kind='muted'}){return <span className={`pill pill-${kind}`}>{children}</span>}

/** WAE is authoritative. React only delays *display* of already-settled results. */
export default function GamePanel({session,balance,bet,onBet,actNow,busy,syncStatus,refresh,navigate}){
  const [choice,setChoice]=useState('red');
  const [reduced,setReduced]=useState(preferReducedMotion);
  const [visible,setVisible]=useState(session);
  const [visibleBalance,setVisibleBalance]=useState(balance);
  const [phase,setPhase]=useState('idle');
  const timer=useRef(null);
  const revealTimer=useRef(null);
  const mountedId=useRef(session?.id);
  useEffect(()=>{document.documentElement.dataset.waeMotion=reduced?'off':'on';return ()=>{delete document.documentElement.dataset.waeMotion}},[reduced]);

  useEffect(()=>{
    return ()=>{clearTimeout(timer.current);clearTimeout(revealTimer.current);};
  },[]);

  useEffect(()=>{
    if(!session)return;
    // Switching games should never replay an earlier game's animation.
    if(mountedId.current!==session.id){
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
  const controlsLocked=busy||phase!=='idle';
  const bonusActive=code==='A1-02'&&session.phase==='BONUS'&&session.bonus?.remaining>0;
  const displayedBet=bonusActive?session.bet:bet;
  // During free spins the bet is pinned to the value stored in the session.
  const play=async(action,extra={})=>{
    if(controlsLocked)return;
    if(!reduced)setPhase('running');
    const succeeded=await actNow(action,bonusActive?{...extra,bet:session.bet}:extra);
    if(!succeeded){setPhase('idle');}
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
        <div className="play-heading"><div><span className="eyebrow">{meta.genre}</span><h1>{meta.name}</h1><p>Session #{shortId(session.id)}</p></div><button className="icon-button" title="Segarkan sesi" aria-label="Segarkan sesi" disabled={controlsLocked} onClick={refresh}><RefreshCw size={18}/></button></div>
        {code==='A1-01'&&<SlotStage session={shown} animating={animating} justRevealed={justRevealed} reduced={reduced}/>}
        {code==='A1-02'&&<ScatterRushStage session={shown} animating={animating} justRevealed={justRevealed} reduced={reduced}/>}
        {code==='B1'&&<RouletteStage session={shown} targetNumber={session.last?.number} animating={animating} justRevealed={justRevealed} reduced={reduced}/>}
        {code==='B2'&&<BlackjackStage session={shown} animating={animating} justRevealed={justRevealed} reduced={reduced}/>}
      </div>
      <aside className="play-side">
        <div className="panel bet-panel">
          <div className="panel-head"><h3>Game controls</h3><Gauge size={19}/></div>
          <div className="bet-label"><span>ACR per ronde</span><strong>{money(displayedBet)} ACR</strong></div>
          <div className="bet-options">{BETS.map(v=><button key={v} className={v===displayedBet?'active':''} disabled={controlsLocked||bonusActive} onClick={()=>onBet(v)}>{v}</button>)}</div>
          {code==='B1'&&<div className="choice-selector"><label htmlFor="roulette-choice">Tebakan roulette</label><select id="roulette-choice" value={choice} disabled={controlsLocked} onChange={e=>setChoice(e.target.value)}><option value="red">🔴 Red</option><option value="black">⚫ Black</option><option value="odd">Odd</option><option value="even">Even</option>{Array.from({length:37},(_,i)=><option key={i} value={i}>{i} {i===0?'· green':RED.has(i)?'· red':'· black'}</option>)}</select></div>}
          {bonusActive&&<p className="bonus-locked-hint">✨ FREE SPINS AKTIF — nilai bet dikunci. Putaran bonus tidak memotong ACR.</p>}
          <div className="game-control-buttons">
            {code==='A1-01'&&<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('SPIN')}><RotateCw size={18}/>{animating?'MEMUTAR…':'SPIN NOW'}</button>}
            {code==='A1-02'&&<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('SPIN')}><Sparkles size={18}/>{animating?'REELS BERPUTAR…':bonusActive?`FREE SPIN (${session.bonus.remaining})`:'SPIN SCATTER'}</button>}
            {code==='B1'&&<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('SPIN',{choice})}><Target size={18}/>{animating?'RODA BERPUTAR…':'SPIN WHEEL'}</button>}
            {code==='B2'&&(shown.phase==='FINISHED'?<button className="btn primary full" disabled={controlsLocked} onClick={()=>play('NEW_ROUND')}><RotateCw size={18}/> Ronde baru</button>:<><button className="btn primary full" disabled={controlsLocked} onClick={()=>play('HIT')}>HIT <ArrowRight size={17}/></button><button className="btn outline full" disabled={controlsLocked} onClick={()=>play('STAND')}>STAND <Check size={17}/></button></>)}
          </div>
          <button className="motion-pref" onClick={toggle} aria-pressed={!reduced} type="button" title="Pengaturan animasi hanya mengubah tampilan, tidak hasil permainan">{reduced?<VolumeX size={17}/>:<Volume2 size={17}/>} Animasi {reduced?'nonaktif':'aktif'} <span>{reduced?'Instan':'Sinematik'}</span></button>
          <div className="control-note"><Shield size={17}/> Semua hasil dan perubahan saldo ditentukan server. Animasi hanya visual.</div>
        </div>
        <div className="panel play-wallet"><span>BALANCE</span><strong>{money(visibleBalance)} <small>ACR</small></strong><p>Wallet Arcade terpisah dari WA-WORLD.</p></div>
        <div className="panel dual-box"><div><ArrowRightLeft size={19}/><strong>Dual Mode</strong></div><p>Game menggunakan sesi yang sama lewat Web dan WhatsApp. Gunakan <code>.wae web</code> dari DM bot.</p></div>
      </aside>
    </div>
  </>;
}
