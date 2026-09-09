import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMerchSway, stepMerchSway, merchSwayAtRest, resetMerchSway } from '../src/lib/merch-sway.mjs';

const dt = 1 / 120;

test('garments respond differently to the same rail movement and brake at different times', () => {
  const garments = [0, 1, 2, 3].map(createMerchSway);
  const firstRebounds = garments.map(() => -1);
  let greatestSpread = 0;
  for (let step = 0; step < 180; step++) {
    const acceleration = step < 24 ? 18 : step < 54 ? -14.4 : 0;
    garments.forEach((sway, i) => {
      stepMerchSway(sway, acceleration, dt);
      if (step > 24 && sway.angle < 0 && firstRebounds[i] < 0) firstRebounds[i] = step;
    });
    const angles = garments.map(sway => sway.angle);
    greatestSpread = Math.max(greatestSpread, Math.max(...angles) - Math.min(...angles));
  }
  assert.ok(greatestSpread > .035, 'Visible variation, more than two degrees');
  assert.ok(firstRebounds.every(step => step > 0), 'Every garment swings back after braking');
  assert.ok(new Set(firstRebounds).size >= 3, 'Rebounds do not happen in lockstep');
  assert.notEqual(garments[0].angle, garments[3].angle, 'Repeated copies have individual motion');
});

test('sway remains bounded through rapid reversals, settles, and never starts by itself', () => {
  for (let seed = -3; seed <= 6; seed++) {
    const sway = createMerchSway(seed);
    for (let step = 0; step < 120; step++) stepMerchSway(sway, 0, dt);
    assert.equal(sway.angle, 0);
    for (let step = 0; step < 480; step++) {
      stepMerchSway(sway, Math.floor(step / 18) % 2 ? 70 : -70, dt);
      assert.ok(Number.isFinite(sway.velocity) && Math.abs(sway.angle) <= .2);
    }
    for (let step = 0; step < 1200; step++) stepMerchSway(sway, 0, dt);
    assert.ok(merchSwayAtRest(sway), `Garment ${seed} settles completely`);
    resetMerchSway(sway);
    assert.deepEqual([sway.angle, sway.velocity, sway.drive], [0, 0, 0]);
  }
});

test('reversing the rail reverses the sway and the same seed remains reproducible', () => {
  const right = createMerchSway(2), left = createMerchSway(2), repeat = createMerchSway(2);
  for (let step = 0; step < 300; step++) {
    const acceleration = step < 40 ? 12 : step < 80 ? -12 : 0;
    stepMerchSway(right, acceleration, dt);
    stepMerchSway(left, -acceleration, dt);
    stepMerchSway(repeat, acceleration, dt);
    assert.ok(Math.abs(right.angle + left.angle) < 1e-12);
    assert.equal(right.angle, repeat.angle);
  }
});
