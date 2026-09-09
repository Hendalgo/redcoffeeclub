import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.env.QA_LABEL||'before',folder=`docs/qa/iphone-transition/${label}`;await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const report=[];
try{for(const viewport of [{width:1440,height:900},{width:393,height:659},{width:393,height:852}]){
 const page=await browser.newPage({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__transition={long:[],frames:[],gpu:[]};let last=0;const phase=()=>({bridge:document.getElementById('aero-mount')?.dataset.bridge,progress:document.querySelector('.experience')?.dataset.sceneProgress});new PerformanceObserver(list=>list.getEntries().forEach(e=>window.__transition.long.push({duration:e.duration,start:e.startTime,...phase()}))).observe({type:'longtask',buffered:true});function sample(t){if(last&&window.__measure)window.__transition.frames.push({dt:t-last,...phase()});last=t;requestAnimationFrame(sample)}requestAnimationFrame(sample);for(const name of ['compileShader','linkProgram','getProgramParameter','texImage2D']){const original=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...args){const t=performance.now(),r=original.apply(this,args),dt=performance.now()-t;if(dt>2)window.__transition.gpu.push({name,dt,...phase()});return r;};}});
 await page.goto('http://127.0.0.1:4322/');await page.waitForFunction(()=>document.documentElement.dataset.heroEntrance==='complete');await page.screenshot({path:`${folder}/${viewport.width}-${viewport.height}-hero.png`});
 await page.locator('.hero-scroll').click();await page.waitForFunction(()=>document.documentElement.dataset.sceneReady==='webgl');
 for(const p of [.5,.69,.94]){await page.locator(`[data-journey="${p}"]`).click();await page.waitForTimeout(1400);await page.screenshot({path:`${folder}/${viewport.width}-${viewport.height}-${p}.png`});}
 const top=await page.locator('#prepara-cafe').evaluate(e=>e.getBoundingClientRect().top+scrollY);
 await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top-viewport.height);await page.waitForTimeout(700);
 await page.evaluate(()=>{window.__measure=true;window.__transition.frames=[];});
 for(let i=0;i<=60;i++){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top-viewport.height+(viewport.height-100)*i/60);await page.waitForTimeout(25);}
 await page.evaluate(()=>window.__measure=false);await page.waitForTimeout(600);await page.screenshot({path:`${folder}/${viewport.width}-${viewport.height}-brew.png`});
 const data=await page.evaluate(()=>({stats:window.__transition,overflow:document.documentElement.scrollWidth>innerWidth,ready:document.querySelector('.brew-workbench').dataset.ready}));report.push({viewport,...data,errors});console.log(JSON.stringify({viewport,ready:data.ready,maxFrame:Math.max(...data.stats.frames.map(f=>f.dt)),long:data.stats.long.filter(x=>Number(x.bridge)>0),gpu:data.stats.gpu.filter(x=>Number(x.bridge)>0)}));await page.close();
}await writeFile(`${folder}/report.json`,JSON.stringify(report,null,2));}finally{await browser.close();}
