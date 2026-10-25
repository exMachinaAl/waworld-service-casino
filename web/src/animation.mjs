/** Presentation-only timing. No RNG, balance edits, or game decision logic here. */
export const GAME_MOTION_MS = Object.freeze({'A1-01':1800,'A1-02':2200,'B1':2400,'B2':850});
export function animationDuration(gameCode, reducedMotion=false) {
  return reducedMotion ? 0 : (GAME_MOTION_MS[gameCode] ?? 600);
}
export function isNewVersion(previous, incoming) {
  return !!previous && !!incoming && previous.id===incoming.id &&
    Number.isInteger(previous.version) && Number.isInteger(incoming.version) && incoming.version>previous.version;
}
export function preferReducedMotion(win=typeof window !== 'undefined' ? window : null) {
  if(!win) return false;
  try {
    const override=win.localStorage.getItem('wae_reduce_motion');
    if(override==='1')return true;
    if(override==='0')return false;
    return Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }catch { return Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches); }
}
export function saveMotionPreference(reduced,win=typeof window !== 'undefined' ? window : null){
  try {win?.localStorage.setItem('wae_reduce_motion',reduced?'1':'0');}catch {}
}
