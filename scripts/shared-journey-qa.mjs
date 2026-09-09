import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const folder='docs/qa/shared-journey';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const report=[],errors=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568}]){
  const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4322/#explora');await page.waitForFunction(()=>document.documentElement.dataset.motionReady);
  await page.getByRole('button',{name:'Explorar todas las piezas'}).click();await page.waitForFunction(()=>Number(document.querySelector('.experience').dataset.journeyProgress)>.93);
  await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='webgl');await page.waitForTimeout(500);
  await page.evaluate(()=>{window.__originalCanvas=document.querySelector('#aero-mount canvas');window.__originalModel=document.getElementById('aero-mount').dataset.modelId;});
  const top=await page.locator('#prepara-cafe').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  const go=async p=>{await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top-(viewport.height+(112-viewport.height)*p));await page.waitForTimeout(500);};
  const samples=[];
  for(const p of [0,.2,.4,.6,.8,1,.6,0,1]){
   await go(p);
   const sample=await page.evaluate(()=>({oneCanvas:document.querySelectorAll('canvas').length===1,sameCanvas:document.querySelector('#aero-mount canvas')===window.__originalCanvas,sameModel:document.getElementById('aero-mount').dataset.modelId===window.__originalModel,sharedModel:document.getElementById('aero-mount').dataset.modelId===document.querySelector('.brew-section').dataset.modelId,opacity:getComputedStyle(document.querySelector('#aero-mount>.product-canvas>div')).opacity,overflow:document.documentElement.scrollWidth>innerWidth}));
   assert.ok(sample.oneCanvas&&sample.sameCanvas&&sample.sameModel&&sample.sharedModel);assert.equal(sample.opacity,'1');assert.equal(sample.overflow,false);samples.push({p,...sample});
   if([.4,.8,1].includes(p))await page.screenshot({path:`${folder}/${viewport.width}-bridge-${p}.png`});
  }
  await page.getByRole('button',{name:'Armar AeroPress',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.brew-workbench').dataset.step==='1');
  await go(0);await go(1);assert.equal(await page.locator('.brew-workbench').getAttribute('data-step'),'1');
  report.push({viewport,samples,preservedPreparation:true});console.log('PASS shared timeline',viewport);await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/report.json`,JSON.stringify({report,errors},null,2));
}finally{await browser.close();}
