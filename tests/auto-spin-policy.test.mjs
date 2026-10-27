import test from 'node:test';import assert from 'node:assert/strict';
import {AUTO_PRESETS,AUTO_MAX_BONUS_SEARCH_SPINS,validAutoMode,bonusReached,shouldStopAuto} from '../web/src/auto-spin.mjs';
import {normalizeWins,scatterCells} from '../web/src/win-lines.mjs';

test('autospin supports 10/30/50/100 and bounded until-bonus only for games with bonuses',()=>{
 assert.deepEqual(AUTO_PRESETS,[10,30,50,100,'bonus']);
 for(const m of AUTO_PRESETS)assert.equal(validAutoMode(m,'A1-02'),true);
 assert.equal(validAutoMode('bonus','A1-01'),false);
 assert.equal(validAutoMode(50,'B2'),false);
 assert.equal(validAutoMode(200,'A1-02'),false);
 assert.equal(AUTO_MAX_BONUS_SEARCH_SPINS,500);
});
test('autospin bonus finder stops on scatter retrigger, pot, blast, or fusion feature',()=>{
 assert.equal(bonusReached('A1-02',{last:{free_spins_added:5}}),true);
 assert.equal(bonusReached('A1-02',{last:{free_spins_added:0}}),false);
 assert.equal(bonusReached('A1-03',{phase:'POT_CHOICE'}),true);
 assert.equal(bonusReached('A1-04',{last:{activated:true}}),true);
 assert.equal(bonusReached('A1-05',{last:{blast_activated:true}}),true);
 assert.equal(bonusReached('A1-05',{last:{unlocked:[{source:'activity'}]}}),true);
});
test('autospin never passes a pot selection, and stops after target or safety cap',()=>{
 assert.match(shouldStopAuto({mode:100,gameCode:'A1-05',session:{phase:'POT_CHOICE'},completed:1}),/Guci/);
 assert.equal(shouldStopAuto({mode:10,gameCode:'A1-01',session:{phase:'READY'},completed:9}),null);
 assert.match(shouldStopAuto({mode:10,gameCode:'A1-01',session:{phase:'READY'},completed:10}),/selesai/);
 assert.match(shouldStopAuto({mode:'bonus',gameCode:'A1-02',session:{phase:'READY',last:{}},completed:500}),/500/);
 assert.match(shouldStopAuto({mode:'bonus',gameCode:'A1-02',session:{phase:'BONUS',last:{free_spins_added:10}},completed:1}),/Bonus/);
});
test('win overlay renders only confirmed horizontal lines with server payouts',()=>{
 const x=normalizeWins({lines:[{row:2,count:4,symbol:'🍒',payout:80},{row:4,count:3,symbol:'⚡',payout:120},{row:5,count:6,symbol:'🍋',payout:900}]},4,6);
 assert.deepEqual(x,[{row:2,start:1,direction:'left',count:4,symbol:'🍒',payout:80},{row:4,start:1,direction:'left',count:3,symbol:'⚡',payout:120}]);
 assert.deepEqual(normalizeWins({matches:[{row:1,symbol:'🍋',payout:30}]},3,3),[{row:1,start:1,direction:'left',count:3,symbol:'🍋',payout:30}]);
 assert.deepEqual(scatterCells([['✨','⭐','✨'],['🍒','✨','🍋']]),[[0,0],[0,2],[1,1]]);
});
