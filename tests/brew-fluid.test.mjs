import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cupLevel,cupVolume,CUP_MAX_HEIGHT,fallingJet} from '../src/lib/brew-fluid.mjs';

test('a tapered cup fills by volume and leaves an air gap below the filter outlet',()=>{
 for(const fill of [0,.06,.25,.5,.75,1]){
  const level=cupLevel(fill);
  assert.ok(Math.abs(cupVolume(level.height)/cupVolume(CUP_MAX_HEIGHT)-fill)<1e-8);
  assert.ok(-2.86+.18+level.height < -1.55,'Coffee remains below the outlet');
 }
 assert.equal(cupLevel(-1).height,0);assert.equal(cupLevel(2).height,CUP_MAX_HEIGHT);
 assert.ok(cupLevel(.5).height>CUP_MAX_HEIGHT*.5,'A widening cup needs more height for its first half-volume');
});
test('a free falling jet accelerates and narrows while conserving flow',()=>{
 const initial=fallingJet(0,1),falling=fallingJet(.9,1);
 assert.ok(falling.speed>initial.speed);assert.ok(falling.radius<initial.radius);
 assert.ok(Math.abs(initial.radius**2*initial.speed-falling.radius**2*falling.speed)<1e-10);
 assert.ok(Math.abs(.8*falling.flight+4.905*falling.flight**2-.9)<1e-10);
 assert.equal(fallingJet(.9,0).radius,0);
 assert.ok(fallingJet(.9,.4).radius<falling.radius,'Releasing pressure tapers the stream');
});
