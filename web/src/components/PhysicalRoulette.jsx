import React from 'react';
import {money} from '../api';
import {WHEEL_ORDER,pocketColor,pocketPath,pointAt,rotorLandingAngle} from '../roulette-motion.mjs';
/** Cinematic physics-inspired depiction, not a predictive physical simulator.
 * Server commits to result first; rotor positions winning pocket under the ball.
 */
export default function PhysicalRoulette({session,animating,reduced,targetNumber}){
 const last=session.last;
 const target=Number.isInteger(targetNumber)?targetNumber:last?.number;
 const settled=Number.isInteger(target);
 const angle=settled?rotorLandingAngle(target):0;
 return <section className={`roulette-stage cinematic-stage physical-roulette ${animating&&!reduced?'roulette-moving':''} ${reduced?'reduce-motion':''}`} aria-label="European Roulette fisik bergaya simulasi">
  <div className="stage-label roulette-top-label"><span>EUROPEAN ROULETTE · SINGLE ZERO</span><span>37 POCKETS · PHYSICAL STYLE</span></div>
  <div className="physical-roulette-area">
   <div className="physical-wheel" style={{'--landing-angle':`${angle}deg`}}>
    <div className="physical-stator" aria-hidden="true"/>
    <svg className="physical-rotor" viewBox="0 0 320 320" role="img" aria-label={`Roda roulette 37 kantong, hasil ${settled?target:'belum ada'}`}>
     <defs><radialGradient id="woodRotor"><stop stopColor="#8d5b35"/><stop offset=".72" stopColor="#3a261c"/><stop offset="1" stopColor="#d4ab6b"/></radialGradient></defs>
     <circle cx="160" cy="160" r="146" fill="url(#woodRotor)" stroke="#cfad73" strokeWidth="4"/>
     <circle cx="160" cy="160" r="140" fill="#201919" stroke="#f0d5a4" strokeWidth="2"/>
     {WHEEL_ORDER.map((n,i)=>{
       const [x,y]=pointAt(160,160,115,i*360/37);
       return <g key={n}><path d={pocketPath(i)} fill={pocketColor(n)==='red'?'#b52f38':pocketColor(n)==='green'?'#157855':'#161e27'} stroke="#d6ae79" strokeWidth=".9"/>
        <text x={x} y={y} fill="#fff2d9" fontSize="10" textAnchor="middle" dominantBaseline="central" fontWeight="800" transform={`rotate(${i*360/37} ${x} ${y})`}>{n}</text></g>;
     })}
     <circle cx="160" cy="160" r="92" fill="url(#woodRotor)" stroke="#d6b77c" strokeWidth="4"/>
     <circle cx="160" cy="160" r="57" fill="#38251c" stroke="#d7b47b" strokeWidth="9"/>
     <circle cx="160" cy="160" r="19" fill="#d9b57d" stroke="#4d341c" strokeWidth="4"/>
     <circle cx="160" cy="160" r="8" fill="#f6d9a4"/>
    </svg>
    <div className="physical-deflectors" aria-hidden="true">{Array.from({length:8},(_,i)=><span key={i} style={{transform:`rotate(${i*45}deg) translateY(-119px)`}}/>)}</div>
    <div className="physical-ball-orbit" aria-hidden="true"><span className="physical-ball"><i/></span></div>
    <div className="physical-glint" aria-hidden="true"/>
   </div>
  </div>
  <div className="roulette-outcome" aria-live="polite">
   {animating&&!reduced?<><h3>Bola mengitari rotor…</h3><p>Melambat, menyentuh deflektor, lalu memasuki kantong</p></>:
    last?<><span className={`roulette-result-tag ${last.win?'won':''}`}>{last.win?'WIN':'NO WIN'}</span><h3>{last.number} · {String(last.color).toUpperCase()}</h3><p>{last.net>=0?'+':''}{money(last.net)} ACR net</p></>:
    <><h3>Choose your position</h3><p>European wheel · satu kantong hijau 0</p></>}
  </div>
  <p className="physical-roulette-disclaimer">Simulasi gerak fisik untuk tampilan. Nomor kemenangan berasal dari server; animasi tidak mengubah hasil atau saldo.</p>
 </section>;
}
