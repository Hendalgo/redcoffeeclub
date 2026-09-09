import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const folder='docs/qa/shared-journey/startup';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const results=[],errors=[];
try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
 const cdp=await page.context().newCDPSession(page);if(viewport.width<760)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addInitScript(()=>{
  window.__startup=[];window.__sampling=true;
  const opacity=el=>{if(!el)return 0;let value=1;for(let e=el;e&&e!==document.body;e=e.parentElement){const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none')return 0;value*=Number(s.opacity);}return value;};
  function frame(){const poster=document.querySelector('.brew-poster'),canvas=document.querySelector('#aero-mount canvas');if(poster?.complete&&poster.naturalWidth&&document.documentElement.dataset.motionReady)window.__startup.push({ready:document.documentElement.dataset.sceneReady==='webgl',canvas:opacity(canvas),poster:opacity(poster),count:document.querySelectorAll('canvas').length});if(window.__sampling)requestAnimationFrame(frame);}requestAnimationFrame(frame);
 });
 await page.goto('http://127.0.0.1:4322/#prepara-cafe');await page.waitForFunction(()=>document.querySelector('.brew-workbench')?.dataset.ready==='true',null,{timeout:45000});await page.waitForTimeout(700);
 const samples=await page.evaluate(()=>{window.__sampling=false;return window.__startup;});
 assert.ok(samples.length>5);assert.ok(samples.every(s=>s.canvas+s.poster>.97),'A complete visual stays present while the first frame loads');assert.ok(samples.every(s=>s.count<=1),'A second canvas is never allocated');assert.ok(samples.every(s=>s.ready||s.canvas<.001),'No unprepared render is exposed');assert.ok(samples.at(-1).canvas>.99&&samples.at(-1).poster<.001);
 const y=await page.evaluate(()=>scrollY);await page.reload();await page.waitForFunction(()=>document.querySelector('.brew-workbench')?.dataset.ready==='true',null,{timeout:45000});await page.waitForTimeout(800);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-y)<2,'Reload keeps the reading position');
 await page.screenshot({path:`${folder}/${viewport.width}.png`});results.push({viewport,samples,reload:true});console.log('PASS shared startup',viewport);await page.close();
}assert.deepEqual(errors,[]);await writeFile(`${folder}/report.json`,JSON.stringify({results,errors},null,2));}finally{await browser.close();}
