import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const folder='docs/qa/mobile-performance';await mkdir(folder,{recursive:true});
const results=[],errors=[];
try {
 for(const [width,height] of [[320,568],[360,800],[390,844],[412,915],[768,1024],[820,1180],[1024,768],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<1024,hasTouch:width<1024});
  page.on('pageerror',e=>errors.push(e.message));const requests=[];
  page.on('request',r=>requests.push(r.url()));
  await page.goto('http://127.0.0.1:4322/');await page.waitForTimeout(3500);
  assert.equal(await page.locator('canvas').count(),0,'The cover never allocates WebGL without intent');
  assert.ok(!requests.some(url=>/mount-aero|mount-brew|BrewExperience|sponsor-/.test(url)),'3D and offscreen sponsor assets stay deferred');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const hero=await page.locator('.hero-scroll').boundingBox();assert.ok(hero.y+hero.height<=height);
  await page.screenshot({path:`${folder}/${width}-hero.png`});
  await page.getByRole('button',{name:'Sé parte',exact:true}).click();await page.waitForTimeout(650);
  assert.ok(await page.locator('#contact-dialog').evaluate(d=>d.open));
  await page.screenshot({path:`${folder}/${width}-modal.png`});await page.keyboard.press('Escape');await page.waitForTimeout(450);
  const menu=page.locator('.menu-toggle');
  if(await menu.isVisible()){
   await menu.click();await page.waitForTimeout(750);
   const link=page.locator('.mobile-menu a[href="#faq"]');await link.scrollIntoViewIfNeeded();
   await page.screenshot({path:`${folder}/${width}-menu.png`});await link.click();
  }else await page.locator('.desktop-nav a[href="#faq"]').click();
  await page.waitForTimeout(1600);
  assert.equal(await page.locator('canvas').count(),0,'A direct jump to FAQ avoids mounting the 3D');
  await page.locator('.faq-list details').first().locator('summary').click();await page.waitForTimeout(400);
  assert.ok(await page.locator('.faq-list details').first().evaluate(d=>d.open));
  await page.screenshot({path:`${folder}/${width}-faq.png`});
  await page.evaluate(()=>document.querySelector('a[href="#programa"]').click());await page.waitForTimeout(1800);
  await page.screenshot({path:`${folder}/${width}-program.png`});
  const overflow=await page.locator('.program-list article h3,.program-list article p').evaluateAll(els=>els.some(e=>e.getBoundingClientRect().right>innerWidth||e.getBoundingClientRect().left<0));assert.equal(overflow,false);
  await page.evaluate(()=>document.querySelector('a[href="#patrocinadores"]').click());await page.waitForTimeout(1800);
  assert.equal(await page.locator('.sponsor-art').count(),27);
  await page.screenshot({path:`${folder}/${width}-sponsors.png`});
  results.push({width,height,pass:true,requestsDuringVisit:requests.length});console.log('PASS mobile layout',width,height);await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/report.json`,JSON.stringify({results,errors},null,2));
}finally{await browser.close();}
