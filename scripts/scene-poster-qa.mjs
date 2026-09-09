import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const url=process.env.QA_URL||'http://127.0.0.1:4322';
const out='docs/qa/scene-posters';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report=[],errors=[];
const measure=()=>{
 const opacity=element=>{
  if(!element)return 0;
  let opacity=1;
  for(let node=element;node;node=node.parentElement){
   const css=getComputedStyle(node);
   if(css.visibility==='hidden'||css.display==='none')return 0;
   opacity*=Number(css.opacity);
  }
  return opacity;
 };
 return {
  owner:document.documentElement.dataset.scenePoster,
  ready:document.documentElement.dataset.sceneReady,
  explore:opacity(document.querySelector('.scene-poster')),
  brew:opacity(document.querySelector('.brew-poster')),
  canvas:opacity(document.querySelector('#aero-mount canvas')),
  count:document.querySelectorAll('#aero-mount canvas').length,
 };
};
try{
 for(const viewport of [{width:1838,height:953},{width:393,height:852}]){
  const page=await browser.newPage({viewport});page.on('pageerror',error=>errors.push(error.message));
  const cdp=await page.context().newCDPSession(page);
  if(viewport.width<760)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.addInitScript(`window.measurePosters=${measure.toString()};
   window.posterFrames=[];
   function sample(){
    if(document.documentElement.dataset.motionReady&&document.documentElement.dataset.scenePoster){
     window.posterFrames.push(window.measurePosters());
    }
    requestAnimationFrame(sample);
   }
   requestAnimationFrame(sample);`);
  await page.goto(url+'/#prepara-cafe');
  await page.waitForFunction(()=>document.querySelector('.brew-workbench')?.dataset.ready==='true',null,{timeout:45000});
  // Keep the heavy module pending to expose the reload/up-scroll race reliably.
  let release;const gate=new Promise(resolve=>release=resolve);
  await page.route('**/_astro/mount-aero.*.js',async route=>{await gate;await route.continue();});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.motionReady);
  const samples=[];
  const jump=async(fraction,label)=>{
   await page.locator('#prepara-cafe').evaluate((element,fraction)=>scrollTo({top:scrollY+element.getBoundingClientRect().top-innerHeight*fraction,behavior:'instant'}),fraction);
   await page.waitForTimeout(450);
   const sample=await page.evaluate(measure);samples.push({label,...sample});
   assert.ok(sample.explore<.001||sample.brew<.001,label+': no duplicate posters');
   assert.ok(Math.max(sample.explore,sample.brew)>.99,label+': a complete fallback remains');
   await page.screenshot({path:`${out}/${viewport.width}-${label}.png`});
  };
  await jump(.6,'reload-scroll-up');
  await jump(1,'explore');await jump(.1,'brew');await jump(.6,'return');
  release();
  await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='webgl',null,{timeout:45000});
  await page.waitForTimeout(600);
  const live=await page.evaluate(measure);
  assert.equal(live.explore,0);assert.equal(live.brew,0);assert.equal(live.canvas,1);assert.equal(live.count,1);
  await page.screenshot({path:`${out}/${viewport.width}-live.png`});
  const frames=await page.evaluate(()=>window.posterFrames);
  assert.ok(frames.length>10);
  assert.deepEqual(frames.filter(frame=>frame.explore>.001&&frame.brew>.001),[],'No frame shows both loading images');
  assert.deepEqual(frames.filter(frame=>frame.canvas>.001&&(frame.explore>.001||frame.brew>.001)),[],'No poster ghosts over the live model');
  // A lost WebGL context must restore one useful fallback, including on return.
  await page.evaluate(()=>document.querySelector('#aero-mount canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='fallback');
  await jump(.1,'failed-brew');await jump(.6,'failed-explore');
  report.push({viewport,frames:frames.length,samples,live,duplicates:0});
  console.log('PASS reload/poster handoff',viewport,frames.length,'frames');await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({report,errors},null,2));
}finally{await browser.close();}
