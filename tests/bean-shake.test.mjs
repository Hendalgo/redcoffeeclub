import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createShakeDetector} from '../src/lib/bean-shake.mjs';

test('ordinary movement, isolated bumps and same-direction acceleration do not grind',()=>{
 const detector=createShakeDetector();
 for(let time=0;time<1200;time+=100)assert.equal(detector.sample(Math.sin(time)*5,3,9,time),0);
 assert.equal(detector.sample(25,0,0,1300),0);
 assert.equal(detector.sample(28,0,0,1450),0);
 assert.equal(detector.sample(-25,0,0,2300),0);
 assert.equal(detector.sample(NaN,0,0,2400),0);
});
test('strong opposing impulses trigger one bounded burst and obey the cooldown',()=>{
 const detector=createShakeDetector();
 assert.equal(detector.sample(26,0,0,100),0);
 assert.equal(detector.sample(-26,0,0,110),0,'Sensor noise in the same impulse');
 assert.equal(detector.sample(-26,0,0,220),26);
 assert.equal(detector.sample(26,0,0,350),0);
 assert.equal(detector.sample(-26,0,0,470),0);
 assert.equal(detector.sample(100,0,0,1300),0);
 assert.equal(detector.sample(-100,0,0,1420),45);
});
test('leaving the footer clears a half-finished shake',()=>{
 const detector=createShakeDetector();
 detector.sample(28,0,0,100);detector.reset();
 assert.equal(detector.sample(-28,0,0,240),0);
 assert.equal(detector.sample(28,0,0,360),28);
});
