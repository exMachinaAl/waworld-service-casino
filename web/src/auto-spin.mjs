/** UI-only sequential auto-spin policy. All outcomes are authoritative WAE results. */
export const AUTO_PRESETS=Object.freeze([10,30,50,100,'bonus']);
export const AUTO_MAX_BONUS_SEARCH_SPINS=500; // prevent runaway resource usage even if no bonus occurs
export const AUTO_MIN_GAP_MS=1000;
export const AUTO_GAMES=new Set(['A1-01','A1-02','A1-03','A1-04','A1-05']);
export const BONUS_GAMES=new Set(['A1-02','A1-03','A1-04','A1-05']);
export function validAutoMode(mode,gameCode){return AUTO_GAMES.has(gameCode)&&AUTO_PRESETS.includes(mode)&&(mode!=='bonus'||BONUS_GAMES.has(gameCode));}
export function bonusReached(gameCode,session){
 const last=session?.last??{};
 if(gameCode==='A1-02')return (last.free_spins_added??0)>0;
 if(gameCode==='A1-03')return (last.unlocked?.length??0)>0 || session?.phase==='POT_CHOICE';
 if(gameCode==='A1-04')return Boolean(last.activated);
 if(gameCode==='A1-05')return (last.free_spins_added??0)>0||(last.unlocked?.length??0)>0||Boolean(last.blast_activated)||session?.phase==='POT_CHOICE';
 return false;
}
export function shouldStopAuto({mode,gameCode,session,completed}){
 if(session?.phase==='POT_CHOICE')return 'Guci menunggu pilihan manual';
 if(mode==='bonus' && bonusReached(gameCode,session))return 'Bonus ditemukan';
 if(mode==='bonus' && completed>=AUTO_MAX_BONUS_SEARCH_SPINS)return 'Batas keamanan 500 putaran tercapai';
 if(typeof mode==='number'&&completed>=mode)return 'Target putaran selesai';
 return null;
}
