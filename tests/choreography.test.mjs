import test from 'node:test';
import assert from 'node:assert/strict';
import {poseAt,journeyAt} from '../src/lib/choreography.mjs';
test('assembly dwells for the first 15% and the open pose dwells for the last 10%',()=>{
  assert.deepEqual(poseAt(0),poseAt(.15));
  assert.deepEqual(poseAt(.9),poseAt(1));
});
test('scroll reversal returns exactly to every prior absolute pose',()=>{
  const forward=Array.from({length:101},(_,i)=>poseAt(i/100));
  for(let i=100;i>=0;i--)assert.deepEqual(poseAt(i/100),forward[i]);
});
test('plunger withdraws before lower pieces release and the cap stays below the paper',()=>{
  for(let i=0;i<=100;i++){
    const p=i/100,pose=poseAt(p);
    assert.ok(-1.55+pose.cap < -1.327+pose.filter);
    if(p<=.35){assert.ok(Math.abs(pose.filter)<1e-12);assert.ok(Math.abs(pose.cap)<1e-12);}
    if(p>=.35)assert.equal(pose.plunger,2.58);
    assert.ok(pose.zoom>=.64&&pose.zoom<=1);
  }
});
test('out of range scroll values clamp to valid poses',()=>{
  assert.deepEqual(poseAt(-1),poseAt(0));assert.deepEqual(poseAt(2),poseAt(1));
});

test('the coastal camera move completes before the plunger starts withdrawing',()=>{
  for(let i=0;i<=34;i++)assert.equal(journeyAt(i/100).plunger,0);
  assert.equal(journeyAt(.34).transition,1);
  assert.equal(journeyAt(1).disassembly,1);
});
test('jumping between chapters and reversing returns the same complete camera and part pose',()=>{
  const chapters=[0,.15,.33,.5,.69,.94,1];
  const reference=chapters.map(journeyAt);
  for(const i of [6,2,4,1,5,3,0])assert.deepEqual(journeyAt(chapters[i]),reference[i]);
  for(let i=0;i<=100;i++){
    const pose=journeyAt(i/100);
    Object.values(pose).forEach(value=>assert.ok(Number.isFinite(value)));
    assert.ok(pose.scale>=1&&pose.scale<=1.1);
    assert.ok(pose.mobileX>=0&&pose.mobileX<=.15);
  }
});
