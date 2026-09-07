import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const folder = 'docs/qa/startup';
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  const page = await browser.newPage({viewport});
  await page.addInitScript(() => {
    window.__startup = [];
    const start = performance.now();
    const sample = () => {
      const canvas = document.querySelector('canvas');
      const r = canvas?.getBoundingClientRect();
      window.__startup.push({t:Math.round(performance.now()-start),scrollY,ready:document.querySelector('.product-canvas')?.className,rect:r ? {x:r.x,y:r.y,w:r.width,h:r.height}:null,state:window.__aeroState,loading:document.documentElement.className});
      if(performance.now()-start<6000) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.goto(process.env.QA_URL || 'http://127.0.0.1:4321', {waitUntil:'domcontentloaded'});
  for (const delay of [100,400,800,1500,2500]) {await page.waitForTimeout(delay);await page.screenshot({path:`${folder}/${viewport.width}-${delay}.png`});}
  const samples = await page.evaluate(()=>window.__startup);
  const frames = samples.filter(frame=>frame.state);
  assert.ok(frames.length>0,'WebGL rendered during startup');
  assert.ok(frames.every(frame=>frame.state.enhanced&&frame.state.progress===0&&frame.state.pose.plunger===0&&frame.state.pose.cap===0),'Every startup frame uses the assembled coastal pose');
  assert.ok(samples.every(frame=>frame.scrollY===0),'Startup never changes scroll position');
  await fs.writeFile(`${folder}/${viewport.width}.json`,JSON.stringify(samples,null,2));
  console.log(viewport,await page.evaluate(()=>({state:window.__aeroState,y:scrollY,last:window.__startup.at(-1)})));
  await page.close();
}
await browser.close();
