import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const url=process.env.QA_URL || 'http://127.0.0.1:4322', results=[];
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
await mkdir('docs/qa/reading',{recursive:true});
const settle = page => page.waitForTimeout(1700);
const ready = async page => {await page.waitForFunction(()=>document.querySelector('.preloader').hidden);await settle(page);};
try {
 for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await ready(page);
  assert.equal(await page.locator('.preloader-orbit').count(),0);
  await page.locator('.hero-scroll').click();await settle(page);
  await page.goBack();await settle(page);
  assert.ok(await page.evaluate(()=>scrollY<2),'Back returns to the initial entry');
  await page.goForward();await settle(page);
  assert.ok(Math.abs(await page.locator('.experience').evaluate(e=>Number(e.dataset.journeyProgress))-.33)<.001);
  for(const chapter of [.33,.5,.69,.94]) {
   if(chapter!==.33){await page.locator(`[data-journey="${chapter}"]`).click();await settle(page);}
   const before=await page.locator('.experience').evaluate(e=>Number(e.dataset.journeyProgress));
   await page.mouse.wheel(0,300);await settle(page);
   const after=await page.locator('.experience').evaluate(e=>Number(e.dataset.journeyProgress));
   assert.ok(Math.abs(after-before)<.001,`Reading beat remains still after scrolling 300px: ${chapter}`);
   const visible=await page.locator('.explore-intro,.explore-story').evaluateAll(els=>els.filter(e=>Number(getComputedStyle(e).opacity)>.01));
   assert.equal(visible.length,1,'Only one narrative is visible during each reading beat');
  }
  await page.locator('[data-journey="0.69"]').click();await settle(page);
  const chapterY=await page.evaluate(()=>scrollY);
  await page.reload();await ready(page);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-chapterY)<2,'Reload preserves position inside the 3D pin');
  assert.equal(await page.locator('.experience').evaluate(e=>Number(e.dataset.journeyProgress)),.69);
  await page.evaluate(()=>document.querySelector('a[href="#equipo"]').click());await settle(page);
  await page.locator('[data-team-step="1"]').click();await settle(page);
  const teamY=await page.evaluate(()=>scrollY);
  await page.reload();await ready(page);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-teamY)<2,'Reload keeps the team position');
  if(viewport.width>760) assert.match(await page.locator('[data-team-count]').textContent(),/02/);
  await page.goto(url+'/404.html');await page.goBack();await ready(page);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-teamY)<2,'Back from another document keeps the section position');
  assert.equal(await page.locator('.pin-spacer').count(),viewport.width>760?3:1);
  assert.equal(await page.locator('.product-canvas canvas').count(),0,'Restoring a later section does not load the unseen 3D');
  assert.deepEqual(errors,[]);
  results.push({viewport,pass:true});console.log('PASS navigation',viewport);await page.close();
 }
 await writeFile('docs/qa/reading/navigation-report.json',JSON.stringify(results,null,2));
} finally {await browser.close();}
