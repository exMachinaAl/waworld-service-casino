import React from 'react';
import {CheckCircle2, CircleDot, Coins, LoaderCircle, Radio, ShieldCheck, Sparkles, Zap} from 'lucide-react';
import {money} from '../api';
import PrecisionReels from './PrecisionReels.jsx';
import PhysicalRoulette from './PhysicalRoulette.jsx';

const EMPTY_GRID=Array.from({length:3},()=>Array.from({length:3},()=> '✦'));
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const POCKET_ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const colorOf=n=>n===0?'green':RED.has(n)?'red':'black';

function AnimatedStatus({animating,label}){
  return <div className="motion-status" aria-live="polite" aria-atomic="true">
    {animating ? <><LoaderCircle size={14} className="spin-icon"/> {label}</> : <><CheckCircle2 size={14}/> Hasil berasal dari server</>}
  </div>;
}
export function SlotStage({session,animating,justRevealed,reduced,targetGrid,spinId}){
  const grid=session.last?.grid??EMPTY_GRID;
  return <section className={`slot-stage cinematic-stage ${animating?'is-spinning':''} ${justRevealed?'is-revealing':''} ${session.last?.payout>0 && justRevealed?'has-won':''} ${reduced?'reduce-motion':''}`} aria-label="Mesin slot Classic Match">
    <div className="stage-ambient" aria-hidden="true"><i/><i/><i/></div>
    <div className="stage-label"><span>✦ WORLD SLOTS ✦</span><span>CLASSIC 3×3</span></div>
    <div className="stage-kicker"><Sparkles size={14}/> A1-01 · THREE MATCHES</div>
    <div className="slot-cabinet">
      <div className="slot-top-line" aria-hidden="true"><span>✦</span><span>WORLD ARCADE</span><span>✦</span></div>
      <div className="slot-reels animated-reels">
        <PrecisionReels grid={grid} targetGrid={targetGrid} rows={3} columns={3} variant="classic" animating={animating} reduced={reduced} motionMs={1800} spinId={spinId} winningLines={session.last?.matches??[]}/>
        <div className="slot-payline" aria-hidden="true"/>
      </div>
      <div className="cabinet-leds" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</div>
    </div>
    <div className="stage-result" aria-live="polite" aria-atomic="true">
      {animating?<><span>ROLLING THE REELS</span><strong>Memutar simbol…</strong><small>Hasil dihitung oleh Arcade Engine</small></>:session.last?<><span>LAST ROUND</span><strong className={session.last.payout>0?'win-text':''}>{session.last.payout>0?`WIN +${money(session.last.payout)} ACR`:'NO MATCH'}</strong><small>Net {session.last.net>=0?'+':''}{money(session.last.net)} ACR</small></>:<><span>READY TO SPIN</span><strong>Make your move</strong><small>Tiga simbol sama pada satu baris</small></>}
    </div>
    <AnimatedStatus animating={animating} label="Putaran sedang berlangsung"/>
    {justRevealed&&session.last?.payout>0&&!reduced&&<div className="win-confetti" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>}
  </section>;
}

export function RouletteStage(props){return <PhysicalRoulette {...props}/>;}

function Card({value,hidden=false,idx=0,animate=false}){
  if(hidden)return <span className={`playing-card card-hidden ${animate?'card-deal':''}`} style={{'--card-i':idx}} aria-label="Kartu dealer tertutup">W</span>;
  const v=String(value),suit=v.slice(-1),rank=v.slice(0,-1);
  return <span className={`playing-card ${'♥♦'.includes(suit)?'card-red':''} ${animate?'card-deal':''}`} style={{'--card-i':idx}} aria-label={`${rank} ${suit}`}><b>{rank}</b><strong>{suit}</strong></span>;
}
export function BlackjackStage({session,animating,justRevealed,reduced}){
  const dealer=session.dealer??[],player=session.player??[];
  return <section className={`blackjack-stage cinematic-stage ${animating?'is-dealing':''} ${justRevealed?'is-revealing':''} ${reduced?'reduce-motion':''}`} aria-label="Meja Blackjack">
    <div className="table-glow" aria-hidden="true"/>
    <div className="table-mark">WORLD <span>21</span> BLACKJACK</div>
    <div className="hand dealer-hand"><span>DEALER</span><div className="hand-cards">{dealer.map((c,i)=><Card key={`${session.version}-${i}`} value={c} hidden={c==='🂠'} idx={i} animate={justRevealed&&!reduced}/>)}</div><small>{session.dealer_total===null?'Satu kartu tersembunyi':`Total ${session.dealer_total??'—'}`}</small></div>
    <div className="table-divider"><span>VS</span></div>
    <div className="hand player-hand"><span>YOU</span><div className="hand-cards">{player.map((c,i)=><Card key={`${session.version}-${i}`} value={c} idx={i+2} animate={justRevealed&&!reduced}/>)}</div><small>Total {session.player_total??'—'}</small></div>
    <div className="blackjack-round-label" aria-live="polite">{animating?<><LoaderCircle className="spin-icon" size={15}/> Memproses aksi kartu…</>:<><CircleDot size={13}/> {session.phase==='PLAYER_TURN'?'GILIRAN ANDA':`ROUND ${session.phase}`}</>}</div>
    {session.outcome&&!animating&&<div className="bj-result" aria-live="polite">{session.outcome} · Hadiah {money(session.payout)} ACR</div>}
    <div className="table-integrity"><ShieldCheck size={13}/> Server-verified cards</div>
  </section>;
}

const SCATTER_EMPTY=Array.from({length:4},()=>Array.from({length:6},()=> '✦'));
export function ScatterRushStage({session,animating,justRevealed,reduced,targetGrid,spinId}){
 const last=session.last;
 const grid=last?.grid??SCATTER_EMPTY;
 const bonus=session.bonus??{awarded:0,played:0,remaining:0};
 return <section className={`scatter-stage cinematic-stage ${animating?'is-spinning':''} ${justRevealed?'is-revealing':''} ${reduced?'reduce-motion':''}`} aria-label="Scatter Rush enam kolom empat baris">
   <div className="stage-label"><span>WORLD SLOTS</span><span>A1-02 · SIX REELS</span></div>
   <div className="scatter-title"><Sparkles size={22}/><strong>SCATTER RUSH</strong><Sparkles size={22}/></div>
   <div className="scatter-bonus"><span>✨ 3+ kolom = Free Spins</span><span>⚡ A atas 4+ = Blast · 🔷 B pelengkap</span><span>Retrigger +5</span><span>Maksimal 50</span></div>
   <div className="scatter-board">
     <PrecisionReels grid={grid} targetGrid={targetGrid} rows={4} columns={6} variant="scatter" animating={animating} reduced={reduced} motionMs={2200} spinId={spinId} markedSymbol="✨" winningLines={last?.lines??[]}/>
   </div>
   <div className="scatter-progress">
    <div><span>Bonus diberikan</span><strong>{bonus.awarded}/50</strong></div>
    <div><span>Sudah digunakan</span><strong>{bonus.played}</strong></div>
    <div><span>Bonus tersisa</span><strong>{bonus.remaining}</strong></div>
   </div>
   <div className="scatter-meter" aria-hidden="true"><i style={{width:`${bonus.awarded*2}%`}}/></div>
   <div className="stage-result" aria-live="polite" aria-atomic="true">
     {animating?<><span>SCATTER RUSH</span><strong>Reel bergerak…</strong><small>Hasil ditentukan server</small></>:
       last?<><span>{last.is_free_spin?'FREE SPIN':'PAID SPIN'} · {last.scatter_count} SCATTER COLUMNS</span><strong className={last.payout>0?'win-text':''}>{last.payout>0?`+${money(last.payout)} ACR`:'ROUND COMPLETE'}</strong><small>{last.free_spins_added>0?`Bonus +${last.free_spins_added} free spins · `:''}Net {last.net>=0?'+':''}{money(last.net)} ACR</small></>:
       <><span>READY TO SPIN</span><strong>Collect Scatter ✨</strong><small>3+ ✨ membuka bonus; 4 A di paling atas menyalakan Blast</small></>}
   </div>
   <AnimatedStatus animating={animating} label="Scatter Rush sedang memutar reel"/>
   {justRevealed&&last?.free_spins_added>0&&!reduced&&<div className="scatter-retrigger-flash" aria-hidden="true">+{last.free_spins_added} FREE SPINS</div>}
 </section>;
}

/** A1-03: reveal is always supplied by the server after the choice settles. */
export function MysteryGuciStage({session,animating,justRevealed,reduced,targetGrid,spinId}){
 const last=session.last;const grid=last?.grid??Array.from({length:3},()=>Array(5).fill('✦'));
 const meters=session.meters??{activity:0,symbols:0,victory:0};
 const pending=session.pot_pending??0;
 return <section className={`guci-stage cinematic-stage ${animating?'is-spinning':''} ${justRevealed?'is-revealing':''} ${reduced?'reduce-motion':''}`} aria-label="Mystery Guci lima kolom tiga baris">
  <div className="stage-label"><span>WORLD SLOTS</span><span>A1-03 · MYSTERY GUCI</span></div>
  <div className="guci-heading"><span aria-hidden="true">🏺</span><div><strong>MYSTERY GUCI</strong><small>Collect • Unlock • Reveal</small></div><span aria-hidden="true">🏺</span></div>
  <div className="guci-reels"><PrecisionReels grid={grid} targetGrid={targetGrid} rows={3} columns={5} variant="guci" animating={animating} reduced={reduced} motionMs={1550} spinId={spinId} markedSymbol="🏺" winningLines={last?.lines??[]}/></div>
  <div className="guci-meters">{[['activity','Aktivitas',8],['symbols','Simbol 🏺',6],['victory','Kemenangan',3]].map(([key,label,max])=><div className="guci-meter" key={key}><span>{label}</span><strong>{meters[key]??0}/{max}</strong><div className="guci-bar"><i style={{width:`${100*Math.min(max,meters[key]??0)/max}%`}}/></div></div>)}</div>
  <div className="guci-result" aria-live="polite">
    {animating?<><strong>Guci sedang diproses…</strong><span>Hasil sudah ditentukan server</span></>:session.last_open?<><strong>🏺 Hadiah dibuka: +{money(session.last_open.payout)} ACR</strong><span>{session.last_open.multiplier}× · Pilihan {session.last_open.selected+1} · Terverifikasi dengan commit</span></>:last?<><strong>{last.payout>0?`+${money(last.payout)} ACR`:'Putaran selesai'}</strong><span>Simbol guci: {last.pot_symbols} · Bonus baru: {last.unlocked?.length??0}</span></>:<><strong>Mulai kumpulkan simbol guci</strong><span>Bonus tidak memerlukan ACR tambahan</span></>}
  </div>
  {pending>0&&<div className="guci-pending">🎁 {pending} bonus menunggu pilihan <small>Komitmen #{session.pot_commit?.slice(0,12)}…</small></div>}
  <AnimatedStatus animating={animating} label="Guci sedang bergerak"/>
 </section>;
}

/** A1-04: visual presentation only. All transformation and payouts are server results. */
export function ColumnBlastStage({session,animating,justRevealed,reduced,targetGrid,spinId}){
 const last=session.last;
 const initial=last?.grid_before??Array.from({length:4},()=>Array(5).fill('✦'));
 const grid=last?.grid_after??initial;
 const trigger=new Set(last?.trigger_columns??[]);
 return <section className={`blast-stage cinematic-stage ${animating?'is-spinning':''} ${justRevealed?'is-revealing':''} ${reduced?'reduce-motion':''}`} aria-label="Column Blast lima kolom empat baris">
  <div className="stage-label"><span>WORLD SLOTS</span><span>A1-04 · COLUMN BLAST</span></div>
  <div className="blast-heading"><span aria-hidden="true">⚡</span><div><strong>COLUMN BLAST</strong><small>4+ kode A di baris paling atas · Server verified</small></div><span aria-hidden="true">⚡</span></div>
  <div className="blast-columns" aria-label="Kolom yang memuat pemicu"><span>TRIGGER COLUMNS</span>{Array.from({length:5},(_,c)=><b key={c} className={trigger.has(c+1)&&!animating?'lit':''}>{c+1}</b>)}<small>4 A ATAS = AKTIF</small></div>
  <div className="blast-board">
   <PrecisionReels grid={grid} targetGrid={targetGrid} rows={4} columns={5} variant="blast" animating={animating} reduced={reduced} motionMs={1950} spinId={spinId} markedSymbol="⚡" winningLines={last?.lines??[]}/>
  </div>
  <div className="blast-status" aria-live="polite" aria-atomic="true">
   {animating?<><strong>ENERGIZING REELS…</strong><small>Menunggu efek visual dari hasil yang sudah dihitung server</small></>:
     last?<><strong>{last.activated?'⚡ BLAST ACTIVATED':'NO BLAST'}</strong><small>{last.trigger_columns.length} kolom pemicu · {last.lines.length} baris menang</small></>:
       <><strong>READY TO IGNITE</strong><small>Kode A ⚡ harus muncul di baris teratas pada minimal 4 kolom; B 🔷 membantu garis biasa</small></>}
  </div>
  <div className="blast-breakdown">
   <div><span>Hadiah garis</span><strong>{money(last?.line_payout??0)} ACR</strong></div>
   <div><span>Bonus Blast</span><strong>{money(last?.blast_payout??0)} ACR</strong></div>
   <div><span>Total hasil</span><strong>{money(last?.payout??0)} ACR</strong></div>
  </div>
  {justRevealed&&last?.activated&&!reduced&&<div className="blast-overlay" aria-hidden="true">⚡ COLUMN BLAST!</div>}
  <AnimatedStatus animating={animating} label="Kolom sedang diputar"/>
 </section>;
}

/** A1-05: one authoritative result grid, with Scatter counted before transformation.
 * Rendering does not determine reels, bonus tickets or payouts.
 */
export function UltimateFusionStage({session,animating,justRevealed,reduced,targetGrid,spinId}){
 const last=session.last;
 const grid=last?.grid_after??Array.from({length:4},()=>Array(6).fill('✦'));
 const bonus=session.bonus??{awarded:0,played:0,remaining:0};
 const meters=session.meters??{activity:0,symbols:0,victory:0};
 const potPending=session.pot_pending??0;
 return <section className={`fusion-stage cinematic-stage ${animating?'is-spinning':''} ${justRevealed?'is-revealing':''} ${reduced?'reduce-motion':''}`} aria-label="Ultimate Fusion enam kolom empat baris">
   <div className="stage-label"><span>✦ WORLD SLOTS ✦</span><span>A1-05 · ULTIMATE FUSION</span></div>
   <div className="fusion-heading"><Sparkles size={21}/><strong>ULTIMATE FUSION</strong><Zap size={21}/></div>
   <div className="fusion-chips"><span>✨ Scatter</span><span>⚡ A: 4+ atas → Blast</span><span>🔷 B: pendukung garis</span><span>🏺 Mystery Guci</span></div>
   <div className="fusion-board"><PrecisionReels grid={grid} targetGrid={targetGrid} rows={4} columns={6} variant="fusion" animating={animating} reduced={reduced} motionMs={2400} spinId={spinId} markedSymbol="⚡" winningLines={last?.lines??[]}/></div>
   <div className="fusion-progress">
     <div><small>FREE SPINS</small><strong>{bonus.remaining} <i>/ {bonus.awarded} diberikan</i></strong></div>
     <div><small>BLAST</small><strong>{last?.blast_activated?'AKTIF':'MENUNGGU'}</strong></div>
     <div><small>GUCI TERSEGEL</small><strong>{potPending}</strong></div>
   </div>
   <div className="fusion-meters">{[['Activity',meters.activity,8],['Symbols',meters.symbols,6],['Victory',meters.victory,3]].map(([name,val,max])=><div key={name}><span>{name}</span><div className="fusion-meter"><i style={{width:`${Math.min(100,val/max*100)}%`}}/></div><b>{val}/{max}</b></div>)}</div>
   <div className="fusion-breakdown">
     <div><span>Hadiah garis</span><strong>{money(last?.line_payout??0)} ACR</strong></div>
     <div><span>Bonus Blast</span><strong>{money(last?.blast_payout??0)} ACR</strong></div>
     <div><span>Scatter</span><strong>{last?.scatter_count??0} kolom</strong></div>
     <div><span>Hasil ronde</span><strong>{money(last?.payout??0)} ACR</strong></div>
   </div>
   <div className="stage-result" aria-live="polite" aria-atomic="true">
     {animating?<><span>FUSION SPIN</span><strong>Reels sedang bergerak…</strong><small>Semua hasil telah diproses oleh server</small></>:
       session.last_open?<><span>🏺 MYSTERY GUCI OPENED</span><strong>+{money(session.last_open.payout)} ACR</strong><small>Komitmen hadiah diverifikasi ketika dibuka</small></>:
       last?<><span>{last.is_free_spin?'FREE SPIN':'PAID SPIN'} · {last.scatter_count} SCATTER</span><strong className={last.payout>0?'win-text':''}>{last.payout>0?`WIN +${money(last.payout)} ACR`:'ROUND COMPLETE'}</strong><small>{last.free_spins_added>0?`+${last.free_spins_added} bonus spin · `:''}Net {last.net>=0?'+':''}{money(last.net)} ACR</small></>:
       <><span>READY</span><strong>Fusion dengan A & B · dua arah menang.</strong><small>Scatter + Blast + sealed Guci</small></>}
   </div>
   {session.phase==='POT_CHOICE'&&!animating&&<div className="fusion-prompt" role="status">🏺 {potPending} guci menunggu pilihan. Bonus tidak akan terlewat.</div>}
   {justRevealed&&last?.blast_activated&&!reduced&&<div className="blast-overlay" aria-hidden="true">⚡ FUSION BLAST!</div>}
   <AnimatedStatus animating={animating} label="Ultimate Fusion sedang memutar reels"/>
 </section>;
}
