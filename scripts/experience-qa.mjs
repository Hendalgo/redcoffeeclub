import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url = process.env.QA_URL || 'http://127.0.0.1:4322';
const folder = 'docs/qa/experience';
await fs.mkdir(folder, {recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const errors = [], results = [];
const ready = async page => {await page.waitForFunction(()=>document.documentElement.dataset.siteReady === 'true');await page.waitForFunction(()=>document.querySelector('.preloader').hidden);await page.waitForTimeout(1500);};
for (const viewport of [{width:320,height:568},{width:360,height:667},{width:390,height:844},{width:500,height:900},{width:768,height:1024},{width:1024,height:768},{width:1440,height:900},{width:844,height:390},{width:667,height:375}]) {
  const page = await browser.newPage({viewport});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});await ready(page);
  assert.equal(await page.locator('.product-canvas.is-ready').count(),1);
  assert.equal(await page.evaluate(()=>scrollY),0);
  const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow,false,`Horizontal overflow ${viewport.width}`);
  await page.screenshot({path:`${folder}/${viewport.width}-hero.png`});
  await page.locator('.header-cta').click();
  const entering = await page.locator('#contact-dialog').evaluate(e=>({open:e.open,opacity:Number(getComputedStyle(e).opacity)}));
  assert.ok(entering.open && entering.opacity<1,'Modal begins animated');
  await page.waitForTimeout(1000);
  await page.screenshot({path:`${folder}/${viewport.width}-modal.png`});
  const modal = await page.locator('#contact-dialog').boundingBox();
  assert.ok(modal.x>=0&&modal.y>=0&&modal.x+modal.width<=viewport.width&&modal.y+modal.height<=viewport.height,`Modal fits ${viewport.width}`);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#contact-dialog').evaluate(e=>e.open),true,'Exit remains visible while animating');
  await page.waitForFunction(()=>!document.querySelector('#contact-dialog').open);
  assert.equal(await page.locator('.header-cta').evaluate(e=>document.activeElement===e),true);
  const sectionTop = selector => page.locator(selector).evaluate(e=>e.getBoundingClientRect().top+scrollY-85);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),await sectionTop('#patrocinadores'));
  await page.evaluate(()=>{const grid=document.querySelector('.sponsors-grid');if(grid.getBoundingClientRect().top>innerHeight*.85)scrollBy({top:grid.getBoundingClientRect().top-innerHeight*.8,behavior:'instant'});});
  await page.waitForTimeout(2000);
  await page.locator('#patrocinadores').screenshot({path:`${folder}/${viewport.width}-sponsors.png`});
  assert.equal(await page.locator('.sponsor-mark').count(),27);
  assert.deepEqual(await page.locator('.team-person h3').allTextContents(),['Yoshio Kayo','Andrés García','Luis Tovar','Hernán Velásquez']);
  const centers = await page.locator('.team-controls button').evaluateAll(els=>els.map(e=>{const b=e.getBoundingClientRect(),s=e.querySelector('svg').getBoundingClientRect();return [Math.abs(b.x+b.width/2-s.x-s.width/2),Math.abs(b.y+b.height/2-s.y-s.height/2)];}));
  assert.ok(centers.every(([x,y])=>x<.6&&y<.6),'Arrow geometrically centered');
  await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(500);
  assert.ok(await page.locator('.hidra-credit img').evaluate(e=>e.complete&&e.naturalWidth>0));
  await page.screenshot({path:`${folder}/${viewport.width}-footer.png`});
  results.push({viewport,overflow,modal,centers});
  console.log('PASS',viewport);
  await page.close();
}
// Real readiness, a delayed logo, an image error, WebGL absence and a stalled JS bundle.
for (const scenario of ['delayed-logo','failed-logo','no-webgl','stalled-scene','no-js','reduced']) {
  const page=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:scenario!=='no-js',reducedMotion:scenario==='reduced'?'reduce':'no-preference'});
  if(scenario==='delayed-logo') await page.route('**/images/logo.png',async route=>{await new Promise(resolve=>setTimeout(resolve,2200));await route.continue();});
  if(scenario==='failed-logo') await page.route('**/images/logo.png',route=>route.abort());
  if(scenario==='stalled-scene') await page.route('**/AeroScene*.js',async route=>{await new Promise(resolve=>setTimeout(resolve,10000));await route.abort();});
  if(scenario==='no-webgl') await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args);};});
  await page.goto(url,{waitUntil:'domcontentloaded'});
  if(scenario==='no-js'){assert.equal(await page.locator('.preloader').isVisible(),false);assert.equal(await page.locator('.hero-content').isVisible(),true);}
  else {
    if(scenario==='delayed-logo') {await page.waitForTimeout(800);assert.equal(await page.locator('.preloader').isVisible(),true);await page.screenshot({path:`${folder}/preloader.png`});}
    await ready(page);
    if(['failed-logo','no-webgl'].includes(scenario)) assert.equal(await page.locator('.experience.has-fallback').count(),1);
    assert.equal(await page.locator('.hero-content').isVisible(),true);
  }
  results.push({scenario,pass:true});console.log('PASS',scenario);await page.close();
}
assert.deepEqual(errors,[]);
await fs.writeFile(`${folder}/report.json`,JSON.stringify({results,errors},null,2));
await browser.close();
