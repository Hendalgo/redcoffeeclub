import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.QA_URL || 'http://127.0.0.1:4322';
const out = 'docs/qa/fast-scroll-scene';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = [], errors = [];
const ready = page => page.waitForFunction(() => document.documentElement.dataset.sceneReady === 'webgl'
  && document.getElementById('aero-mount')?.dataset.sceneVisible === 'true', null, { timeout: 45000 });
const jump = (page, selector, offset = 0) => page.locator(selector).evaluate((el, offset) =>
  scrollTo({ top: scrollY + el.getBoundingClientRect().top + offset, behavior: 'instant' }), offset);
async function sample(page) {
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__sceneSamples = [];
    window.__scenePhase = '';
    const tick = () => {
      const host = document.getElementById('aero-mount'), a = document.querySelector('.experience'), b = document.querySelector('.brew-section');
      if (window.__scenePhase && host?.querySelector('canvas') && a && b) {
        const inside = [a, b].some(el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
        const css = getComputedStyle(host);
        // Parent visibility alone is not sufficient: the ready canvas overrides it.
        window.__sceneSamples.push({ phase: window.__scenePhase, inside, opacity: Number(css.opacity), clip: css.clipPath, gate: host.dataset.sceneVisible });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
async function hidden(page, name) {
  await page.waitForFunction(() => Number(getComputedStyle(document.getElementById('aero-mount')).opacity) === 0, null, { timeout: 2500 });
  assert.equal(await page.locator('#aero-mount').evaluate(el => getComputedStyle(el).clipPath), 'inset(50%)', name + ': the entire layer is clipped');
}
async function result(page, label) {
  const samples = await page.evaluate(() => { window.__scenePhase = ''; return window.__sceneSamples; });
  const outside = samples.filter(s => !s.inside);
  assert.ok(outside.length > 5, label + ': sampled offscreen frames');
  assert.deepEqual(outside.filter(s => s.opacity > .001), [], label + ': no stale frame may cover later sections');
  report.push({ label, samples: samples.length, outsideFrames: outside.length, leaks: 0 });
  console.log('PASS', label, outside.length, 'offscreen frames');
}
try {
  for (const viewport of [{ width: 1880, height: 930 }, { width: 1440, height: 900 }, { width: 393, height: 852 }]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width < 760, hasTouch: viewport.width < 760 });
    await sample(page);
    if (viewport.width < 760) await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(url + '/#explora'); await ready(page); await page.waitForTimeout(350);
    await page.evaluate(() => {
      window.__canvas = document.querySelector('#aero-mount canvas');
      window.__model = document.getElementById('aero-mount').dataset.modelId;
      window.__exploreY = scrollY;
      window.__scenePhase = 'explore-jumps';
    });
    for (const selector of ['#equipo', '#programa', '#patrocinadores', '#aliados', '#contacto']) {
      await jump(page, selector, 100); await hidden(page, selector); await page.waitForTimeout(120);
      if (selector === '#programa') await page.screenshot({ path: `${out}/${viewport.width}-program.png` });
      await page.evaluate(() => scrollTo({ top: window.__exploreY, behavior: 'instant' })); await ready(page);
    }
    // Fast wheel bursts can finish after a scrub animation has already settled.
    await page.evaluate(() => window.__scenePhase = 'wheel-burst');
    for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 8000); await page.waitForTimeout(25); }
    await hidden(page, 'wheel burst'); await page.waitForTimeout(200);

    await page.evaluate(() => window.__scenePhase = 'brew-jump-during-assembly');
    await jump(page, '#prepara-cafe', -112);
    await page.waitForFunction(() => document.querySelector('.brew-workbench')?.dataset.ready === 'true', null, { timeout: 45000 });
    await page.getByRole('button', { name: 'Armar AeroPress', exact: true }).click(); await page.waitForTimeout(160);
    await jump(page, '#patrocinadores', 240); await hidden(page, 'brew jump'); await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${viewport.width}-sponsors.png` });
    await jump(page, '#prepara-cafe', -112); await ready(page);
    await page.waitForFunction(() => document.querySelector('.brew-workbench')?.dataset.step === '1', null, { timeout: 15000 });
    assert.ok(await page.evaluate(() => document.querySelector('#aero-mount canvas') === window.__canvas
      && document.getElementById('aero-mount').dataset.modelId === window.__model
      && document.querySelectorAll('canvas').length === 1), 'Return reuses the same canvas, model and preparation');
    await jump(page, '#faq'); await hidden(page, 'FAQ'); await result(page, `${viewport.width}-rapid-scroll`);
    await page.close();
  }
  // The import and shader warm-up may finish after the user has left both scenes.
  for (const viewport of [{ width: 1440, height: 900 }, { width: 393, height: 852 }]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width < 760, hasTouch: viewport.width < 760 });
    await sample(page);
    await page.route('**/_astro/mount-aero.*.js', async route => {
      await new Promise(resolve => setTimeout(resolve, 900)); await route.continue();
    });
    const requested = page.waitForRequest(request => /\/_astro\/mount-aero\.[^/]+\.js/.test(request.url()));
    await page.goto(url + '/#explora'); await requested;
    await page.evaluate(() => window.__scenePhase = 'late-initialization');
    await jump(page, '#programa');
    await page.waitForSelector('#aero-mount canvas', { state: 'attached', timeout: 45000 });
    await page.waitForFunction(() => document.querySelector('.brew-section')?.dataset.prepared === 'true', null, { timeout: 45000 });
    await page.waitForTimeout(800); await hidden(page, 'late warm-up');
    await page.evaluate(() => scrollTo({ top: innerHeight * 3.2, behavior: 'instant' })); await ready(page);
    await result(page, `${viewport.width}-late-initialization`); await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${out}/report.json`, JSON.stringify({ report, errors }, null, 2));
} finally { await browser.close(); }
