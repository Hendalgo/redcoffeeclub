import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const label=process.env.QA_LABEL||'after', folder=`docs/qa/reading/${label}`;
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const report=[],errors=[];
try {
for(const viewport of [{width:1440,height:900},{width:500,height:900},{width:390,height:844}]){
 const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__reloadFrames=[];const sample=()=>{window.__reloadFrames.push({y:scrollY,t:performance.now(),visible:document.documentElement.dataset.siteReady==='true',p:document.querySelector('.experience')?.dataset.journeyProgress,pins:document.querySelectorAll('.pin-spacer').length});if(performance.now()<6500)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:4322');await page.waitForFunction(()=>document.querySelector('.preloader').hidden);await page.waitForTimeout(1200);
 await page.locator('.hero-scroll').click();await page.waitForTimeout(1800);
 await page.screenshot({path:`${folder}/${viewport.width}-intro.png`});
 const text=await page.locator('#explore-title').evaluate(e=>({html:e.innerHTML,font:getComputedStyle(e).fontSize,line:getComputedStyle(e).lineHeight,em:getComputedStyle(e.querySelector('em')).cssText,rect:e.getBoundingClientRect().toJSON()}));
 for(const selector of ['#evento','#patrocinadores']){
  await page.locator(selector).evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-100,behavior:'instant'}));await page.waitForTimeout(1600);
  const before=await page.locator(selector).evaluate(e=>({top:e.getBoundingClientRect().top,y:scrollY,hash:location.hash,saved:history.state}));
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.preloader').hidden);await page.waitForTimeout(2300);
  const after=await page.locator(selector).evaluate(e=>({top:e.getBoundingClientRect().top,y:scrollY,hash:location.hash,p:document.querySelector('.experience').dataset.journeyProgress,reading:window.__readingState?.(),saved:history.state}));
  report.push({viewport,selector,before,after,text,frames:await page.evaluate(()=>window.__reloadFrames)});
  await writeFile(`${folder}/report.json`,JSON.stringify({report,errors},null,2));
  await page.screenshot({path:`${folder}/${viewport.width}-${selector.slice(1)}-reload.png`});
  if(label!=='before') {
   assert.ok(Math.abs(before.top-after.top)<2,`Reload keeps ${selector} at the same position: ${JSON.stringify({before,after})}`);
   assert.equal(Number(after.p),1,`The offscreen 3D is synchronized with the end of the journey: ${JSON.stringify(after)}`);
   const visible=(await page.evaluate(()=>window.__reloadFrames)).filter(frame=>frame.visible);
   assert.ok(Math.max(...visible.map(f=>f.y))-Math.min(...visible.map(f=>f.y))<2,'No scroll jump after the preloader reveals the page');
   assert.ok(visible.every(frame=>Number(frame.p)===1),'The 3D remains synchronized from the first visible frame');
  }
 }
 await page.close();console.log('Checked',viewport);
}
await writeFile(`${folder}/report.json`,JSON.stringify({report,errors},null,2));
assert.deepEqual(errors,[]);
} finally { await browser.close(); }
