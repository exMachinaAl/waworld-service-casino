import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {makeReelTape,reelPlan,reelTravelPx,validGrid} from '../reel-precision.mjs';
import {normalizeWins} from '../win-lines.mjs';

/**
 * One clipped strip per physical reel/column, not independent bouncing cells.
 * Previous displayed state is visible on frame zero; ending cells are the
 * authoritative server outcome. Final translation is an exact multiple of
 * actual measured cell height. No random decisions, balance or wallet writes.
 */
export default function PrecisionReels({grid,targetGrid,rows,columns,variant='classic',animating=false,reduced=false,motionMs=1800,spinId='',markedSymbol,winningLines=[]}){
  const trackRefs=useRef([]);
  const viewportRefs=useRef([]);
  const valid=validGrid(grid,rows,columns);
  const prev=valid?grid:Array.from({length:rows},()=>Array(columns).fill('✦'));
  const target=validGrid(targetGrid,rows,columns)?targetGrid:null;
  const tapes=useMemo(()=>Array.from({length:columns},(_,c)=>target&&animating&&!reduced?makeReelTape(prev,target,c,variant):{cells:prev.map(row=>row[c]),travelCells:0}),[prev,target,columns,variant,animating,reduced]);
  const plan=reelPlan(motionMs,columns);
  const wins=animating?[]:normalizeWins({lines:winningLines},rows,columns);

  useLayoutEffect(()=>{
    if(!animating||!target||reduced)return;
    const tracks=trackRefs.current.slice(0,columns);
    const cancel=[];
    for(let c=0;c<columns;c++){
      const node=tracks[c],viewport=viewportRefs.current[c];
      if(!node||!viewport)continue;
      const viewportHeight=viewport.getBoundingClientRect().height;
      if(!(viewportHeight>0))continue;
      const offset=reelTravelPx(tapes[c].travelCells,viewportHeight,rows);
      const frames=[{transform:'translate3d(0,0,0)'},{transform:`translate3d(0,${offset}px,0)`}];
      if(typeof node.animate==='function'){
        const animation=node.animate(frames,{duration:plan.durationMs,delay:plan.staggerMs*c,easing:'cubic-bezier(.12,.65,.12,1)',fill:'forwards'});
        cancel.push(()=>animation.cancel());
      }else{
        // Rendering correctness remains intact in browsers without WAAPI.
        node.style.transform=`translate3d(0,${offset}px,0)`;
        cancel.push(()=>{node.style.transform='';});
      }
    }
    return ()=>{cancel.forEach(fn=>fn());};
  // `spinId` is authoritative session/version, no client-side RNG.
  },[spinId,animating,reduced,rows,columns,Boolean(target)]);

  return <div className={`precision-grid precision-${variant} ${animating&&!target?'precision-pending':''} ${reduced?'precision-instant':''}`}
    style={{'--precision-cols':columns,'--precision-rows':rows}} role="img" aria-label={`${columns} kolom ${rows} baris; hasil berdasarkan server`}>
    {tapes.map((t,c)=><div className="precision-viewport" key={c} ref={el=>{viewportRefs.current[c]=el}} data-reel={c+1}>
      <div className="precision-track" ref={el=>{trackRefs.current[c]=el}}>
        {t.cells.map((symbol,i)=><div key={i} className={`precision-symbol ${!animating&&markedSymbol===symbol?'precision-mark':''} ${!animating&&symbol==='✨'?'precision-scatter-hit':''} ${!animating&&symbol==='🔷'?'precision-b-helper':''}`} aria-hidden="true"><span>{symbol}</span></div>)}
      </div>
      <div className="precision-glass" aria-hidden="true"/>
      {!animating&&prev.some(row=>row[c]==='✨')&&<span className="precision-scatter-marker">SCATTER</span>}
    </div>)}
    {wins.length>0&&<div className="precision-winning-guides" aria-label={`${wins.length} garis horizontal menang`} role="group">{wins.map((w,i)=><div key={`${w.row}-${i}`} className="precision-win-line" style={{'--win-row':w.row,'--win-count':w.count,'--win-start':w.start}} title={`Baris ${w.row} (${w.direction}): ${w.count} simbol ${w.symbol}, +${w.payout} ACR`}><span className="precision-win-pill">{w.count}× {w.symbol} +{w.payout}</span></div>)}</div>}
  </div>;
}
