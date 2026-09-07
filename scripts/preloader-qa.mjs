import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const folder='docs/qa/restored-preloader',report=[],errors=[];
await mkdir(folder,{recursive:true});
try {
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,recordVideo:{dir:folder,size:viewport}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__loaderFrames=[];const sample=()=>{const loader=document.querySelector('.preloader'),brand=loader?.querySelector('img'),content=loader?.querySelector('.preloader-content');window.__loaderFrames.push({t:performance.now(),shown:!!loader&&!loader.hidden,logo:!!brand?.complete&&brand.naturalWidth>0,opacity:content?Number(getComputedStyle(content).opacity):0,phase:document.documentElement.dataset.preloader});if(performance.now()<4000)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
  await page.goto(process.env.QA_URL||'http://127.0.0.1:4322/',{waitUntil:'commit'});
  await page.locator('.preloader-content img').waitFor({state:'attached'});
  await page.screenshot({path:`${folder}/${viewport.width}-loading.png`});
  await page.waitForFunction(()=>document.documentElement.dataset.heroEntrance==='complete');
  assert.equal(await page.locator('.preloader-orbit').count(),0);
  assert.ok(await page.locator('.preloader').evaluate(e=>e.hidden));
  await page.waitForTimeout(600);
  const frames=await page.evaluate(()=>window.__loaderFrames);
  assert.ok(frames.some(f=>f.shown&&f.logo&&f.opacity>.3),'The original logo is visibly present during loading');
  assert.ok(frames.some(f=>f.phase==='revealing'),'The curtains animate out');
  assert.equal(await page.evaluate(()=>scrollY),0);
  await page.screenshot({path:`${folder}/${viewport.width}-hero.png`});
  report.push({viewport,frames});const video=page.video();await context.close();await video.saveAs(`${folder}/${viewport.width}-entrance.webm`);
  console.log('PASS preloader',viewport.width);
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/report.json`,JSON.stringify({report,errors},null,2));
}finally{await browser.close();}
