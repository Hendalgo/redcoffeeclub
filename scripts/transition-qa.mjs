import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const label=process.env.QA_LABEL || 'after';
const folder=`docs/qa/transition/${label}`;
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const results=[], errors=[], reloads=[];
const inset = clip => {
 const sides=clip.match(/[\d.]+(?=%)/g) || [];
 return Number(sides[1] ?? sides[0]);
};
try {
for(const viewport of [{width:1440,height:900},{width:500,height:900},{width:390,height:844},{width:320,height:568},{width:667,height:375}]){
 const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.QA_URL || 'http://127.0.0.1:4321');await page.waitForFunction(()=>document.querySelector('.preloader').hidden);
 const start=await page.locator('.territory').evaluate(e=>e.getBoundingClientRect().top+scrollY);
 for(const step of [-.8,-.45,0,.45,0,-.45]){
  await page.evaluate(top=>scrollTo({top,behavior:'instant'}),start+viewport.height*step);await page.waitForTimeout(1400);
  await page.screenshot({path:`${folder}/${viewport.width}-${step}.png`});
  const state=await page.evaluate(({viewport,step})=>({viewport,step,overflow:document.documentElement.scrollWidth>innerWidth,landscape:getComputedStyle(document.querySelector('.territory-landscape')).transform,clip:getComputedStyle(document.querySelector('.territory-visual')).clipPath,orbit:document.querySelector('.manifesto-orbit').getBoundingClientRect().toJSON(),territory:document.querySelector('.territory').getBoundingClientRect().toJSON(),backdropLoaded:document.querySelector('.manifesto-backdrop img').naturalWidth>0}),{viewport,step});
  assert.equal(state.overflow,false,'The transition fits the viewport');
  assert.ok(state.backdropLoaded,'The coast behind the manifesto is loaded');
  if(step===-.8) assert.ok(inset(state.clip)<(viewport.width>760?12:4),'The photo is already opening before reaching the top');
  if(step===.45) assert.equal(inset(state.clip),0,'The landscape opens completely');
  const previous=results.find(result=>result.viewport.width===viewport.width && result.step===step);
  if(previous) assert.ok(Math.abs(inset(state.clip)-inset(previous.clip))<.0001,'Reverse scrolling restores the same aperture');
  results.push(state);
 }
 const before=await page.evaluate(()=>({y:scrollY,clip:getComputedStyle(document.querySelector('.territory-visual')).clipPath}));
 await page.reload();await page.waitForFunction(()=>document.querySelector('.preloader').hidden);await page.waitForTimeout(1400);
 const after=await page.evaluate(()=>({y:scrollY,clip:getComputedStyle(document.querySelector('.territory-visual')).clipPath}));
 assert.ok(Math.abs(before.y-after.y)<2,'Reload preserves the approach to the island');
 assert.ok(Math.abs(inset(before.clip)-inset(after.clip))<.0001,'Reload restores the opening without restarting it');
 reloads.push({viewport,before,after});
 await page.close();console.log('Captured',viewport);
}
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
page.on('pageerror',error=>errors.push(error.message));
await page.goto(process.env.QA_URL || 'http://127.0.0.1:4321');await page.waitForFunction(()=>document.querySelector('.preloader').hidden);
await page.locator('.manifesto').evaluate(element=>scrollTo({top:element.getBoundingClientRect().top+scrollY-90,behavior:'instant'}));
await page.screenshot({path:`${folder}/390-reduced-motion.png`});
const reduced=await page.evaluate(()=>({clip:getComputedStyle(document.querySelector('.territory-visual')).clipPath,backdropTransform:getComputedStyle(document.querySelector('.manifesto-backdrop img')).transform,copyOpacity:getComputedStyle(document.querySelector('.territory-copy')).opacity,overflow:document.documentElement.scrollWidth>innerWidth}));
assert.deepEqual(reduced,{clip:'none',backdropTransform:'none',copyOpacity:'1',overflow:false},'Reduced motion keeps the complete composition visible');
assert.deepEqual(errors,[]);
await writeFile(`${folder}/report.json`,JSON.stringify({results,reloads,reduced,errors},null,2));
} finally { await browser.close(); }
