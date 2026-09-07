import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const width = Number(process.env.QA_WIDTH || 1440), height = width < 760 ? 844 : 900;
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
await mkdir('docs/qa/smoothness', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto('http://127.0.0.1:4321');
  await page.waitForFunction(() => document.querySelector('.preloader').hidden);
  await page.waitForTimeout(1000);
  const result = await page.evaluate(async () => {
    const range = window.__aeroScroll, root = document.querySelector('.experience'), samples = [];
    scrollTo({ top: 0, behavior: 'instant' });
    await new Promise(resolve => setTimeout(resolve, 700));
    const begin = performance.now(), startFrame = window.__aeroFrames.frames;
    await new Promise(resolve => {
      const step = now => {
        const elapsed = now - begin, raw = Math.min(1, elapsed / 10000);
        scrollTo({ top: range.start + (range.end - range.start) * raw, behavior: 'instant' });
        samples.push({ t: elapsed, raw, text: Number(root.dataset.journeyProgress), model: window.__aeroState.progress, frames: window.__aeroFrames.frames });
        if (raw < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
    await new Promise(resolve => setTimeout(resolve, 1100));
    const quiet = window.__aeroFrames.frames;
    await new Promise(resolve => setTimeout(resolve, 600));
    const gl = document.querySelector('canvas').getContext('webgl2'), extension = gl.getExtension('WEBGL_debug_renderer_info');
    return { samples, frames: quiet - startFrame, idleFrames: window.__aeroFrames.frames - quiet,
      renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'unknown' };
  });
  const intervals = [], pauses = [];
  let lastFrame = result.samples[0].t, pause = 0;
  for (let i = 1; i < result.samples.length; i++) {
    const sample = result.samples[i], previous = result.samples[i - 1];
    if (sample.frames !== previous.frames) {
      if (sample.t - lastFrame < 100) intervals.push(sample.t - lastFrame);
      lastFrame = sample.t;
    }
    if (sample.model === previous.model) pause += sample.t - previous.t;
    else if (pause) { if (previous.raw > .15 && previous.raw < .96) pauses.push(pause); pause = 0; }
  }
  intervals.sort((a, b) => a - b);
  const summary = { width, height, sceneMedianMs: intervals[Math.floor(intervals.length * .5)], sceneP95Ms: intervals[Math.floor(intervals.length * .95)], pausesOver150ms: pauses.filter(value => value > 150), sceneFrames: result.frames, idleFrames: result.idleFrames, renderer: result.renderer };
  await writeFile(`docs/qa/smoothness/after-${width}.json`, JSON.stringify({ ...result, summary }));
  assert.deepEqual(summary.pausesOver150ms, [], 'No artificial model stops between reading chapters');
  assert.equal(result.idleFrames, 0, 'Rendering still stops when idle');
  for (const chapter of [.5, .69]) {
    const beat = result.samples.filter(sample => sample.text === chapter);
    assert.ok(beat.length > 10 && beat.at(-1).model - beat[0].model > .03, 'The model travels while the chapter text remains still');
  }
  console.log(JSON.stringify(summary, null, 2));
} finally { await browser.close(); }
