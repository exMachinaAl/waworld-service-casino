import React from 'react';
import {CheckCircle2, CircleDot, Coins, LoaderCircle, Radio, ShieldCheck, Sparkles, Zap} from 'lucide-react';
import {money} from '../api';

const EMPTY_GRID=Array.from({length:3},()=>Array.from({length:3},()=> '✦'));
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const POCKET_ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const colorOf=n=>n===0?'green':RED.has(n)?'red':'black';

function AnimatedStatus({animating,label}){
  return <div className="motion-status" aria-live="polite" aria-atomic="true">
    {animating ? <><LoaderCircle size={14} className="spin-icon"/> {label}</> : <><CheckCircle2 size={14}/> Hasil berasal dari server</>}
  </div>;
}
export function SlotStage({session,animating,justRevealed,reduced}){
  const grid=session.last?.grid??EMPTY_GRID;
  return <section className={`slot-stage cinematic-stage ${animating?'is-spinning':''} ${justRevealed?'is-revealing':''} ${session.last?.payout>0 && justRevealed?'has-won':''} ${reduced?'reduce-motion':''}`} aria-label="Mesin slot Classic Match">
    <div className="stage-ambient" aria-hidden="true"><i/><i/><i/></div>
    <div className="stage-label"><span>✦ WORLD SLOTS ✦</span><span>CLASSIC 3×3</span></div>
    <div className="stage-kicker"><Sparkles size={14}/> A1-01 · THREE MATCHES</div>
    <div className="slot-cabinet">
      <div className="slot-top-line" aria-hidden="true"><span>✦</span><span>WORLD ARCADE</span><span>✦</span></div>
      <div className="slot-reels animated-reels">
        {grid.flatMap((row,r)=>row.map((symbol,c)=><div className={`slot-symbol reel-cell reel-column-${c}`} key={`${r}-${c}`}>
          <span className="reel-symbol" aria-hidden={animating}>{animating?'✦':symbol}</span>
          {animating&&<span className="reel-motion-blur" aria-hidden="true">🍒<br/>🔔<br/>⭐<br/>7️⃣</span>}
        </div>))}
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

export function RouletteStage({session,animating,justRevealed,reduced,targetNumber}){
  const last=session.last;
  const resolvedNumber=Number.isInteger(targetNumber)?targetNumber:last?.number;
  const index=POCKET_ORDER.indexOf(resolvedNumber);
  const finalAngle=index>=0?-(360/37)*index:0;
  return <section className={`roulette-stage cinematic-stage ${animating?'is-spinning':''} ${justRevealed?'is-revealing':''} ${reduced?'reduce-motion':''}`} aria-label="European Roulette">
    <div className="stage-ambient" aria-hidden="true"><i/><i/><i/></div>
    <div className="stage-label roulette-top-label"><span>EUROPEAN SINGLE ZERO</span><span>0 — 36</span></div>
    <div className="roulette-spotlight"><div className="roulette-wheel animated-wheel">
      <div className="roulette-rotor" aria-hidden="true" style={{'--wheel-final-angle':`${finalAngle}deg`}}>{POCKET_ORDER.map((n,i)=><span className={`roulette-pocket pocket-${colorOf(n)}`} key={n} style={{'--pocket':i}}>{n}</span>)}</div>
      <div className="roulette-ball-track" aria-hidden="true"><span className="roulette-ball"/></div>
      <div className="roulette-inner"><span>{animating?'—':(last?.number??'✦')}</span><small>{animating?'SPINNING':(last?.color??'WORLD ROULETTE')}</small></div>
    </div></div>
    <div className="roulette-outcome" aria-live="polite" aria-atomic="true">
      {animating?<><h3>Roda berputar…</h3><p>Hasil resmi segera ditampilkan</p></>:last?<><span className={`roulette-result-tag ${last.win?'won':''}`}>{last.win?'WIN':'NO WIN'}</span><h3>{last.number} · {last.color?.toUpperCase()}</h3><p>{last.net>=0?'+':''}{money(last.net)} ACR net</p></>:<><h3>Place your choice</h3><p>European single-zero · 0–36</p></>}
    </div>
    <AnimatedStatus animating={animating} label="Roda sedang berputar"/>
  </section>;
}

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
export function ScatterRushStage({session,animating,justRevealed,reduced}){
 const last=session.last;
 const grid=last?.grid??SCATTER_EMPTY;
 const bonus=session.bonus??{awarded:0,played:0,remaining:0};
 return <section className={`scatter-stage cinematic-stage ${animating?'is-spinning':''} ${justRevealed?'is-revealing':''} ${reduced?'reduce-motion':''}`} aria-label="Scatter Rush enam kolom empat baris">
   <div className="stage-label"><span>WORLD SLOTS</span><span>A1-02 · SIX REELS</span></div>
   <div className="scatter-title"><Sparkles size={22}/><strong>SCATTER RUSH</strong><Sparkles size={22}/></div>
   <div className="scatter-bonus"><span>✨ 3+ kolom = Free Spins</span><span>Retrigger +5</span><span>Maksimal 50</span></div>
   <div className="scatter-board" role="img" aria-label="Grid slot enam kolom dan empat baris">
    {grid.flatMap((row,r)=>row.map((symbol,c)=><div key={`${r}-${c}`} className={`scatter-cell reel-column-${c} ${symbol==='✨'&&!animating?'scatter-hit':''}`}>
      {animating?<span className="scatter-motion">🍋<br/>7️⃣<br/>✨<br/>🔔</span>:<span>{symbol}</span>}
    </div>))}
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
       <><span>READY TO SPIN</span><strong>Collect Scatter ✨</strong><small>3+ kolom berbeda membuka bonus</small></>}
   </div>
   <AnimatedStatus animating={animating} label="Scatter Rush sedang memutar reel"/>
   {justRevealed&&last?.free_spins_added>0&&!reduced&&<div className="scatter-retrigger-flash" aria-hidden="true">+{last.free_spins_added} FREE SPINS</div>}
 </section>;
}
