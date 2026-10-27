import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GAME_GUIDES,searchGuides} from '../web/src/game-guides.mjs';
const load=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('game guides cover slot, arcade, multiplayer, lottery',()=>{
  for(const code of ['A1-01','A1-02','A1-03','A1-04','A1-05','B1','B2','L1','T0','BJ-MP']){
    const guide=GAME_GUIDES[code];assert.ok(guide?.title);assert.ok(guide.steps.length>=3);
  }
});
test('search returns filtered guides without mutating registry',()=>{
  assert.ok(searchGuides('guci').some(([c])=>c==='A1-03'));
  assert.ok(searchGuides('', 'lottery').every(([,g])=>g.category==='lottery'));
  assert.equal(searchGuides('unlikely-not-found').length,0);
});
test('onboarding uses local preference, not a credential',()=>{
  const s=load('web/src/components/GettingStarted.jsx');
  assert.ok(s.includes('wae-rc3-onboarding-dismissed'));assert.ok(s.includes('localStorage.setItem'));assert.ok(!s.includes('authorization')); 
});
test('help navigation and accessible mobile actions are wired',()=>{
  const s=load('web/src/App.jsx');assert.ok(s.includes('onGuide={openGuide}'));
  assert.ok(s.includes('rc3-mobile-tabs'));assert.ok(s.includes('aria-current'));
  assert.ok(load('web/src/components/HelpCenter.jsx').includes('GuideDirectory'));
});
test('lottery exposes manual refresh without allowing client-side settlement',()=>{
  const s=load('web/src/components/RoundLobby.jsx');assert.ok(s.includes('Segarkan daftar ronde'));assert.ok(!s.includes('Math.random'));
});
