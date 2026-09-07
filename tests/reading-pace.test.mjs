import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyAtScroll, sceneAtScroll, scrollAtJourney } from '../src/lib/reading-pace.mjs';

test('each readable chapter holds still for at least 90% of a mobile screen of scroll', () => {
  for (const chapter of [.33, .5, .69, .94]) {
    const center = scrollAtJourney(chapter);
    for (let i = -30; i <= 30; i++) assert.equal(journeyAtScroll(center + i * .002), chapter);
  }
});

test('the model crosses reading beats continuously while the text stays still', () => {
  for (const chapter of [.33, .5, .69, .94]) {
    const center = scrollAtJourney(chapter);
    assert.ok(Math.abs(sceneAtScroll(center) - chapter) < 1e-12);
    assert.ok(sceneAtScroll(center - .04) < chapter && sceneAtScroll(center + .04) > chapter);
    const epsilon = 1e-5;
    const before = (sceneAtScroll(center) - sceneAtScroll(center - epsilon)) / epsilon;
    const after = (sceneAtScroll(center + epsilon) - sceneAtScroll(center)) / epsilon;
    assert.ok(Math.abs(before - after) < .001, 'No velocity jump at a chapter boundary');
  }
  let previous = 0;
  for (let i = 1; i <= 1000; i++) {
    const progress = sceneAtScroll(i / 1000);
    assert.ok(progress >= previous && progress <= 1);
    previous = progress;
  }
  assert.equal(sceneAtScroll(-1), 0); assert.equal(sceneAtScroll(2), 1);
});
test('chapter navigation inverts the paced scroll and reversal stays monotonic', () => {
  let previous = 0;
  for (let i = 0; i <= 100; i++) {
    const value = i / 100, progress = journeyAtScroll(value);
    assert.ok(progress >= previous && progress <= 1);
    assert.ok(Math.abs(journeyAtScroll(scrollAtJourney(value)) - value) < 1e-7);
    previous = progress;
  }
  assert.equal(journeyAtScroll(-1), 0); assert.equal(journeyAtScroll(2), 1);
});
