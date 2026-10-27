/** Reel math only. Pure and deterministic: symbols in the final visible rows MUST be server symbols. */
export const FILLER_SYMBOLS = Object.freeze({
  classic:['🍒','🍋','🔔','⭐','7️⃣'],
  scatter:['🍒','🍋','🔔','⭐','7️⃣','✨'],
  guci:['🍒','🍋','🔔','⭐','🏺'],
  blast:['🍒','🍋','🔔','⭐','7️⃣','⚡']
});
export function validGrid(grid, rows, cols) {
  return Array.isArray(grid) && grid.length===rows && grid.every(row=>Array.isArray(row)&&row.length===cols&&row.every(s=>typeof s==='string'&&s.length>0));
}
export function reelPlan(totalMs, columns){
  if(!Number.isFinite(totalMs)||totalMs<=0||!Number.isInteger(columns)||columns<1) throw Error('Invalid reel timing');
  const staggerMs = Math.min(90, Math.max(0, (totalMs-260)/Math.max(columns,1)/2));
  const durationMs = Math.max(100, totalMs - staggerMs*(columns-1) - 140);
  return {staggerMs,durationMs, settleByMs:staggerMs*(columns-1)+durationMs};
}
export function makeReelTape(previousGrid,targetGrid,col,theme){
  const rows=previousGrid?.length;
  if(!Number.isInteger(rows)||rows<1||!validGrid(previousGrid,rows,previousGrid[0].length)|| !validGrid(targetGrid,rows,previousGrid[0].length)||col<0||col>=previousGrid[0].length)throw Error('Invalid reel grid');
  const palette=FILLER_SYMBOLS[theme]??FILLER_SYMBOLS.classic;
  // The visible initial rows exactly match the last shown server state.
  const start=previousGrid.map(row=>row[col]);
  const fillerCount=20+col*3;
  const filler=Array.from({length:fillerCount},(_,i)=>palette[(i*7+Math.floor(i/3)+col*5)%palette.length]);
  const target=targetGrid.map(row=>row[col]);
  const travelCells=start.length+filler.length;
  return {cells:[...start,...filler,...target],travelCells,target};
}
export function reelTravelPx(travelCells, viewportHeight, rows){
  if(!Number.isFinite(viewportHeight)||viewportHeight<=0||!Number.isInteger(rows)||rows<1||!Number.isInteger(travelCells)||travelCells<0) throw Error('Invalid reel measurements');
  return -(travelCells*(viewportHeight/rows));
}
export function reelSnapErrorPx(travelPx,travelCells,viewportHeight,rows){
  return Math.abs(travelPx-reelTravelPx(travelCells,viewportHeight,rows));
}
