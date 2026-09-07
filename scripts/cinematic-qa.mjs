import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { scrollAtJourney } from '../src/lib/reading-pace.mjs';
await mkdir('docs/qa/cinematic', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [], measurements = [];
page.on('pageerror', error => errors.push(error.message));
for (const device of ['desktop', 'mobile']) {
  if (device === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4321', { waitUntil: 'networkidle' });
  await page.waitForSelector('.product-canvas.is-ready', {timeout:12000}).catch(async error => { await page.screenshot({path:'docs/qa/cinematic/error.png'}); console.log(JSON.stringify({errors,info:await page.evaluate(()=>({canvas:document.querySelector('.product-canvas')?.outerHTML,progress:document.querySelector('.experience')?.dataset,enhanced:document.querySelector('.experience')?.className}))}));throw error; });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const range = await page.evaluate(() => window.__aeroScroll);
  for (const progress of [0, .15, .33, .5, .69, .94, .69, .33, 0]) {
    await page.evaluate(({range, scroll}) => window.scrollTo({top:range.start + (range.end - range.start) * scroll, behavior:'instant'}), {range,scroll:scrollAtJourney(progress)});
    await page.waitForTimeout(1100);
    await page.screenshot({path:`docs/qa/cinematic/${device}-${Math.round(progress*100)}.png`});
    measurements.push(await page.evaluate(({device,progress}) => ({ device, progress, actual:window.__aeroState, overflow:document.documentElement.scrollWidth > innerWidth, labels:progress === .94 ? [...document.querySelectorAll('.annotation-note')].map(el => {const b=el.getBoundingClientRect();return {text:el.textContent,x:b.x,y:b.y,right:b.right,bottom:b.bottom};}) : [] }), {device,progress}));
  }
  for (const selector of ['.manifesto', '.territory', '.event', '#equipo', '#programa', '#aliados']) {
    await page.locator(selector).evaluate(el => window.scrollTo({top:el.getBoundingClientRect().top + scrollY - (el.id === 'equipo' ? 0 : 90),behavior:'instant'}));
    if (selector === '.territory' && device === 'desktop') await page.evaluate(() => window.scrollBy({top:innerHeight*.8,behavior:'instant'}));
    await page.waitForTimeout(1200);
    await page.screenshot({path:`docs/qa/cinematic/${device}-${selector.replace(/[.#]/g,'')}.png`});
  }
}
await writeFile('docs/qa/cinematic/visual-report.json', JSON.stringify({errors,measurements},null,2));
console.log(JSON.stringify({errors,overflows:measurements.filter(x=>x.overflow),finalStates:measurements.filter(x=>x.progress===.94)},null,2));
await browser.close();
