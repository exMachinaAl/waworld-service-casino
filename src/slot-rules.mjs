/** Shared A1 payline engine, symmetric left/right matching without duplicate full-row awards.
 * B (🔷) assists ordinary paylines ONLY; it cannot trigger A-blast or substitute Scatter/Pot/A.
 */
export const A='⚡', B='🔷', SCATTER='✨';
export function evaluateBidirectionalLines(grid,bet,paytable,{minMatch=3}={}){
 const lines=[];let payout=0;
 for(let r=0;r<grid.length;r++){
  const row=grid[r],width=row.length;
  for(const direction of ['left','right']){
   const ordered=direction==='left'?row:[...row].reverse();
   // B may lead the line but only actual PAYTABLE symbol can anchor a win.
   const candidate=ordered.find(s=>s!==B);
   if(!candidate||!Object.hasOwn(paytable,candidate))continue;
   let count=0;
   for(const s of ordered){if(s===candidate || (s===B && candidate!==A))count++;else break;}
   if(count<minMatch)continue;
   const start=direction==='left'?1:width-count+1;
   const end=direction==='left'?count:width;
   // When the same physical cells and symbol are hit from both sides, count once.
   if(lines.some(x=>x.row===r+1&&x.start===start&&x.end===end&&x.symbol===candidate))continue;
   const multiplier=paytable[candidate]*2**(count-minMatch);
   const amount=bet*multiplier;
   const candidateLine={row:r+1,start,end,direction,symbol:candidate,count,multiplier,payout:amount};
   // Wild B cells can make opposing wins overlap. Never pay overlapping cells twice.
   const overlapping=lines.findIndex(x=>x.row===r+1 && start<=x.end && end>=x.start);
   if(overlapping>=0){
     if(amount>lines[overlapping].payout){payout-=lines[overlapping].payout;lines[overlapping]=candidateLine;payout+=amount;}
   }else{lines.push(candidateLine);payout+=amount;}

  }
 }
 return {lines,payout};
}
/** Only code A appearing in TOP ROW of >=4 DIFFERENT columns starts top-down blast. */
export function evaluateTopRowBlast(grid,{a=A,minTopColumns=4}={}){
 const top=grid[0]??[];
 const triggerColumns=top.flatMap((symbol,index)=>symbol===a?[index+1]:[]);
 const activated=triggerColumns.length>=minTopColumns;
 const after=grid.map(row=>row.map((symbol,index)=>activated&&triggerColumns.includes(index+1)?a:symbol));
 return {grid_after:after,trigger_columns:triggerColumns,activated};
}
