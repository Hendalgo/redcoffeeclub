import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
const folder = 'docs/qa/island-lines/after', report = [], errors = [];
await mkdir(folder, { recursive: true });
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:4322');
    await page.waitForFunction(() => document.querySelector('.preloader').hidden);
    const range = await page.locator('.territory').evaluate(element => {
      const top = element.getBoundingClientRect().top + scrollY;
      const map = element.querySelector('.island-map').getBoundingClientRect();
      return innerWidth > 760
        ? { start: top, end: top + innerHeight * 1.9 }
        : { start: map.top + scrollY - innerHeight * .85, end: map.bottom + scrollY - innerHeight * .55 };
    });
    const snapshots = [];
    for (const progress of [0, .25, .4, .55, .7, 1, .4]) {
      await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), range.start + (range.end - range.start) * progress);
      await page.waitForTimeout(1300);
      const state = await page.locator('.island-map').evaluate(element => ({
        rect: element.getBoundingClientRect().toJSON(),
        copyTop: document.querySelector('.territory-copy').getBoundingClientRect().top,
        strokes: [...element.querySelectorAll('[pathLength]')].map(path => ({ offset: Number.parseFloat(getComputedStyle(path).strokeDashoffset), opacity: Number(getComputedStyle(path).opacity) })),
        location: Number(getComputedStyle(element.querySelector('.island-location')).opacity),
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert.ok(!state.overflow && state.rect.left >= 0 && state.rect.right <= viewport.width, 'The entire map fits horizontally');
      if (progress === 0) assert.equal(state.location, 0, 'The marker waits for the map');
      if (progress === .4) assert.ok(state.strokes[0].offset > 0 && state.strokes[0].offset < 1, 'The contour interpolates continuously instead of switching on/off');
      if (progress === 1) {
        assert.ok(state.strokes.every(stroke => stroke.offset === 0 && stroke.opacity === 1) && state.location === 1, 'The drawing finishes before leaving the screen');
        assert.ok(state.rect.top >= 0 && state.rect.bottom <= viewport.height, 'The complete island is still visible');
        if (viewport.width <= 760) assert.ok(state.rect.bottom < state.copyTop, 'The map has its own space above the text');
      }
      if (progress === 1) assert.ok(state.strokes.every(stroke => stroke.offset === 0 && stroke.opacity === 1), 'The complete map remains visible at the end');
      if (progress === .4 && snapshots.some(snapshot => snapshot.progress === .4)) {
        const previous = snapshots.find(snapshot => snapshot.progress === .4).state;
        assert.deepEqual(state.strokes, previous.strokes, 'Scrolling back restores exactly the same drawing');
        assert.equal(state.location, previous.location);
      }
      snapshots.push({ progress, state });
      await page.screenshot({ path: `${folder}/${viewport.width}-${progress}.png` });
    }
    const before = await page.evaluate(() => scrollY);
    const drawn = snapshots.at(-1).state;
    await page.reload();
    await page.waitForFunction(() => document.querySelector('.preloader').hidden);
    await page.waitForTimeout(1400);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - before) < 2, 'Reload preserves the drawing position');
    const reloaded = await page.locator('.island-map [pathLength]').evaluateAll(paths => paths.map(path => ({ offset: Number.parseFloat(getComputedStyle(path).strokeDashoffset), opacity: Number(getComputedStyle(path).opacity) })));
    // Refresh may differ at the sixth decimal: much less than one screen pixel.
    assert.ok(reloaded.every((stroke, index) => Math.abs(stroke.offset - drawn.strokes[index].offset) < .00001 && Math.abs(stroke.opacity - drawn.strokes[index].opacity) < .0001), 'Reload keeps the same partial strokes within subpixel precision');
    report.push({ viewport, snapshots, reload: true });
    await page.close();
    console.log('PASS island drawing', viewport);
  }
  assert.deepEqual(errors, []);
  await writeFile(`${folder}/report.json`, JSON.stringify({ report, errors }, null, 2));
} finally { await browser.close(); }
