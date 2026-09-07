import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.QA_URL||'http://127.0.0.1:4321';
const folder=`docs/qa/motion-polish/${process.env.QA_LABEL||'development'}`;
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const report=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:667,height:375}]){
  const page=await browser.newPage({viewport});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(()=>document.documentElement.dataset.heroEntrance==='playing');
  await page.waitForTimeout(600);await page.screenshot({path:`${folder}/${viewport.width}-entrance.png`});
  await page.waitForFunction(()=>document.documentElement.dataset.heroEntrance==='complete');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.heroReveal),'1');
  assert.equal(await page.locator('.motion-toggle').count(),0);
  assert.equal(await page.locator('.hero-scroll .scroll-orbit').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.evaluate(()=>scrollY),0);
  const cta=await page.locator('.hero-scroll').boundingBox();
  assert.ok(cta.x>=0&&cta.y>=0&&cta.y+cta.height<=viewport.height,'The explore cue stays within the viewport');
  const logos=await page.locator('img[src*="/hidra-logo-"]').evaluateAll(elements=>elements.map(element=>getComputedStyle(element).filter));
  assert.equal(logos.length,2);assert.ok(logos.every(filter=>filter==='brightness(0) invert(1)'));
  await page.screenshot({path:`${folder}/${viewport.width}-hero.png`});
  assert.equal(await page.locator('canvas').count(),0,'The initial cover does not allocate WebGL');
  await page.locator('.hero-scroll').click();
  await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='webgl');
  await page.waitForFunction(()=>Math.abs(Number(document.querySelector('.experience').dataset.journeyProgress)-.33)<.001);
  await page.waitForTimeout(1000);const y=await page.evaluate(()=>scrollY);
  await page.reload();await page.waitForFunction(()=>document.querySelector('.preloader').hidden);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.heroEntrance),'skipped');
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-y)<2,'Reload never replays the entrance over a later chapter');
  report.push({viewport,cta,logos,reload:true});await page.close();console.log('PASS hero',viewport);
 }
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 reduced.on('pageerror',error=>errors.push(error.message));await reduced.goto(url);
 await reduced.waitForFunction(()=>document.querySelector('.preloader').hidden);
 assert.equal(await reduced.locator('.experience.is-enhanced').count(),0);
 assert.equal(await reduced.evaluate(()=>document.documentElement.dataset.heroEntrance),'skipped');
 assert.equal(await reduced.locator('.motion-toggle').count(),0);
 await reduced.screenshot({path:`${folder}/reduced-motion.png`});await reduced.close();
 assert.deepEqual(errors,[]);await writeFile(`${folder}/report.json`,JSON.stringify({report,reducedMotion:true,errors},null,2));
}finally{await browser.close();}
