import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const label=process.env.QA_LABEL||'after', folder=`docs/qa/first-scroll/${label}`;
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const results=[],errors=[];
try {
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,recordVideo:{dir:folder,size:viewport}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(process.env.QA_URL||'http://127.0.0.1:4322/');
  await page.waitForFunction(()=>document.documentElement.dataset.heroEntrance==='complete');
  assert.equal(await page.locator('.product-canvas canvas').count(),0,'First scroll starts from the lightweight cover');
  const cdp=await context.newCDPSession(page);
  if(viewport.width<760)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.evaluate(()=>{
    window.__handoff=[];window.__sampleHandoff=true;
    const opacityOf=element=>{
      let opacity=1;
      for(let node=element;node&&node!==document.body;node=node.parentElement){const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden')return 0;opacity*=Number(style.opacity);}
      return element?opacity:0;
    };
    const sample=()=>{
      const canvas=document.querySelector('.product-canvas canvas');
      window.__handoff.push({t:performance.now(),ready:document.documentElement.dataset.sceneReady==='webgl',mounted:!!canvas,canvas:opacityOf(canvas),poster:opacityOf(document.querySelector('.hero-product')),scrollY});
      if(window.__sampleHandoff)requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
  });
  await page.mouse.wheel(0,80);
  await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='webgl');
  await page.screenshot({path:`${folder}/${viewport.width}-handoff.png`});
  await page.waitForTimeout(750);
  await page.screenshot({path:`${folder}/${viewport.width}-settled.png`});
  const samples=await page.evaluate(()=>{window.__sampleHandoff=false;return window.__handoff;});
  const premature=samples.filter(s=>s.mounted&&!s.ready&&s.canvas>.001);
  const maxComposite=Math.max(...samples.map(s=>s.canvas+s.poster));
  const result={viewport,prematureFrames:premature.length,maxComposite,samples};results.push(result);
  await writeFile(`${folder}/report.json`,JSON.stringify({results,errors},null,2));
  if(label!=='before'){
    assert.equal(premature.length,0,'The canvas is hidden until a prepared frame has been rendered');
    assert.ok(maxComposite<=1.025,'The poster and 3D never add two fully visible layers');
    assert.ok(samples.at(-1).canvas>.99&&samples.at(-1).poster<.001,'The handoff completes without leaving a poster over the 3D');
    assert.ok(samples.some(s=>s.canvas>.05&&s.canvas<.95),'The canvas fades into view');
  }
  console.log(JSON.stringify({viewport,prematureFrames:premature.length,maxComposite}));
  await context.close();
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
