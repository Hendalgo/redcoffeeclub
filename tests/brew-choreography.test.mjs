import test from 'node:test';
import assert from 'node:assert/strict';
import {brewAt,pourAmount,pressureFromDrag} from '../src/lib/brew-choreography.mjs';

test('the filter seats before the cap locks and all parts return to their assembled offsets',()=>{
  assert.equal(brewAt(.3).filter,brewAt(.3).cap);
  assert.equal(brewAt(.3).cap,-1.65);
  const assembled=brewAt(1);
  assert.ok(Math.abs(assembled.cap)<1e-10);assert.ok(Math.abs(assembled.filter)<1e-10);assert.ok(Math.abs(assembled.capTurn)<1e-10);
  assert.ok(assembled.plungerX>2,'The plunger leaves space for pouring');
  for(let p=.62;p<=.82;p+=.01)assert.ok(-1.55+brewAt(p).cap+brewAt(p).bodyY>-1.17,'The base clears the rim while the cup slides beneath it');
  for(let p=3.73;p<3.93;p+=.01)assert.ok(brewAt(p).plunger>1.24,'The piston crosses above the chamber rim before descending');
  for(let p=3.12;p<3.69;p+=.01)assert.ok(brewAt(p).plungerX>2,'Stirring finishes before the plunger returns');
  for(let p=5.4;p<=6;p+=.01)assert.ok(brewAt(p).bodyY-1.55>-1.17,'The base lifts clear of the cup before moving away');
});
test('pressing transfers coffee to the cup while stopping above the filter',()=>{
  let previous=0;
  for(let i=0;i<=100;i++){
    const pose=brewAt(4+i/100);
    assert.ok(pose.cupLiquid>=previous);previous=pose.cupLiquid;
    assert.ok(Math.abs(pose.chamberLiquid*.94+pose.cupLiquid-1)<1e-10);
    assert.ok(pose.plunger+.015>-1.24,'The piston cannot pass through the coffee bed or filter');
  }
  assert.equal(brewAt(5).cupLiquid,1);assert.equal(brewAt(5).chamberLiquid,0);
});
test('replaying resets every material and transform; elapsed time and drag clamp safely',()=>{
  assert.deepEqual(brewAt(-1),brewAt(0));assert.deepEqual(brewAt(8),brewAt(6));
  assert.equal(brewAt(0).cupLiquid,0);assert.equal(brewAt(0).dose,0);
  assert.equal(pourAmount(.5,100),pourAmount(.5,.05));
  assert.equal(pourAmount(1,.01),1);
  assert.equal(pressureFromDrag(0,200,100),1);assert.equal(pressureFromDrag(0,-10,100),0);
});
