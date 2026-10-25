import test from 'node:test';
import assert from 'node:assert/strict';
import {animationDuration,isNewVersion,preferReducedMotion,saveMotionPreference,GAME_MOTION_MS} from '../web/src/animation.mjs';

test('Animation durations are presentation-only; reduced-motion is instantaneous',()=>{
 assert.equal(animationDuration('A1-01'),1800);
 assert.equal(animationDuration('A1-02'),2200);
 assert.equal(animationDuration('B1'),2400);
 assert.equal(animationDuration('B2'),850);
 assert.equal(animationDuration('B2',true),0);
 assert.equal(animationDuration('unknown'),600);
 assert.ok(Object.values(GAME_MOTION_MS).every(Number.isInteger));
});
test('React animation only triggers on increasing version of same game session',()=>{
 assert.equal(isNewVersion({id:'one',version:4},{id:'one',version:5}),true);
 assert.equal(isNewVersion({id:'one',version:5},{id:'one',version:5}),false);
 assert.equal(isNewVersion({id:'one',version:6},{id:'one',version:5}),false);
 assert.equal(isNewVersion({id:'one',version:4},{id:'two',version:5}),false);
});
test('Motion user preference overrides OS reduced-motion when explicitly chosen',()=>{
 const storage=new Map();const win={localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},matchMedia:()=>({matches:true})};
 assert.equal(preferReducedMotion(win),true);
 saveMotionPreference(false,win);assert.equal(preferReducedMotion(win),false);
 saveMotionPreference(true,win);assert.equal(preferReducedMotion(win),true);
});
