import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const url=process.env.QA_URL||'http://127.0.0.1:4322';
const folder='docs/qa/footer-grinding';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[],report=[];
const count=page=>page.locator('[data-bean-playground]').evaluate(el=>Number(el.dataset.groundCount));
const idle=page=>page.waitForFunction(()=>document.querySelector('[data-bean-playground]')?.dataset.physicsState==='sleeping',null,{timeout:20000});
const reveal=page=>page.locator('.bean-stage').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-280,behavior:'instant'}));
async function open(page){
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'/#contacto');await page.waitForSelector('[data-physics-ready]');await reveal(page);await idle(page);
}
async function impulse(page,x,linear=true){
 await page.evaluate(({x,linear})=>{
  const event=new Event('devicemotion');
  Object.defineProperties(event,{acceleration:{value:linear?{x,y:0,z:0}:null},accelerationIncludingGravity:{value:{x,y:0,z:9.81}}});
  dispatchEvent(event);
 },{x,linear});
}
async function shake(page,strength=26){await impulse(page,strength);await page.waitForTimeout(140);await impulse(page,-strength);}
async function permission(page,outcome){
 await page.addInitScript(outcome=>{
  window.motionRequests=0;
  Object.defineProperty(window.DeviceMotionEvent,'requestPermission',{configurable:true,value:async()=>{window.motionRequests++;return outcome;}});
 },outcome);
}
try{
 const desktop=await browser.newPage({viewport:{width:1440,height:900}});await open(desktop);
 assert.equal(await count(desktop),0,'Initial gravity does not grind beans');
 assert.ok(await desktop.locator('[data-bean-motion]').isHidden());
 await desktop.locator('[data-bean="0"]').focus();await desktop.keyboard.press('Enter');await idle(desktop);
 assert.equal(await count(desktop),0,'An ordinary toss remains a bean');
 const bean=await desktop.locator('.coffee-bean:not(:disabled)').evaluateAll(elements=>{
  for(const element of [...elements].reverse()){
   const r=element.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
   if(document.elementFromPoint(x,y)?.closest('[data-bean]')===element)return {x,y};
  }throw Error('No exposed bean');
 });
 const stage=await desktop.locator('.bean-stage').boundingBox();
 await desktop.mouse.move(bean.x,bean.y);await desktop.mouse.down();
 for(let i=1;i<=20;i++){
  await desktop.mouse.move(bean.x+(stage.x+110-bean.x)*i/20,bean.y+(stage.y+110-bean.y)*i/20);await desktop.waitForTimeout(22);
 }
 await desktop.waitForTimeout(250);
 await desktop.mouse.move(stage.x+75,stage.y+110);await desktop.waitForTimeout(16);
 await desktop.mouse.move(stage.x+6,stage.y+110);await desktop.waitForTimeout(16);await desktop.mouse.up();
 await desktop.waitForFunction(()=>Number(document.querySelector('[data-bean-playground]').dataset.groundCount)>0);
 await desktop.screenshot({path:folder+'/desktop-impact.png'});await idle(desktop);
 assert.ok(await desktop.locator('[data-dust-pile]').getAttribute('d'),'Powder lands in a permanent pile');
 assert.equal(await desktop.locator('.is-grabbed').count(),0,'Breaking a held bean releases pointer capture');
 const first=await count(desktop);
 await desktop.locator('[data-bean-reset]').click();await idle(desktop);assert.equal(await count(desktop),0);
 assert.equal(await desktop.locator('.coffee-bean:not(:disabled)').count(),44);
 assert.equal(await desktop.locator('[data-dust-pile]').getAttribute('d'),'');
 // Grinding every bean checks removal, keyboard focus and bounded particle reuse.
 while(await count(desktop)<44){
  const previous=await count(desktop);
  await desktop.locator('.coffee-bean[tabindex="0"]').focus();await desktop.keyboard.press('Shift+Enter');
  try{await desktop.waitForFunction(previous=>Number(document.querySelector('[data-bean-playground]').dataset.groundCount)>previous,previous,{timeout:4000});}
  catch(error){console.log('Grind stalled',previous,await desktop.locator('[data-bean-playground]').evaluate(el=>({state:el.dataset,focus:document.activeElement.outerHTML})));await desktop.screenshot({path:folder+'/stalled.png'});throw error;}
 }
 await idle(desktop);await desktop.screenshot({path:folder+'/desktop-all-ground.png'});
 assert.ok(await desktop.locator('.coffee-ground').count()<=160,'Particle nodes stay bounded');
 assert.equal(await desktop.locator('.bean-stage [tabindex="0"]').count(),0);
 assert.equal(await desktop.evaluate(()=>document.activeElement.hasAttribute('data-bean-reset')),true,'Empty state keeps keyboard focus usable');
 assert.equal(await desktop.locator('.bean-stage').getAttribute('data-dust-particles'),'0');
 const resting=await desktop.locator('[data-dust-pile]').getAttribute('d');await desktop.waitForTimeout(400);
 assert.equal(await desktop.locator('[data-dust-pile]').getAttribute('d'),resting,'Settled powder stops updating');
 report.push({desktop:true,strongPointerImpact:first,allGround:44,boundedParticles:true,sleep:true});await desktop.close();

 const mobile=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});await permission(mobile,'granted');await open(mobile);
 assert.equal(await count(mobile),0);await shake(mobile);assert.equal(await count(mobile),0,'No sensor handling before opt-in');
 assert.equal(await mobile.evaluate(()=>window.motionRequests),0);
 await mobile.locator('[data-bean-motion]').click();assert.equal(await mobile.evaluate(()=>window.motionRequests),1);
 await shake(mobile,5);assert.equal(await count(mobile),0,'Ordinary phone movement does not grind');
 await shake(mobile,26);await mobile.waitForTimeout(100);const shaken=await count(mobile);assert.ok(shaken>=2&&shaken<16);
 await mobile.screenshot({path:folder+'/mobile-shake.png'});await idle(mobile);
 assert.ok(await mobile.locator('.coffee-ground').count()<=96);
 await mobile.locator('[data-bean-motion]').click();await shake(mobile);assert.equal(await count(mobile),shaken,'Turning the sensor off stops shakes');
 await mobile.locator('[data-bean-motion]').click();
 await mobile.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 await mobile.waitForFunction(()=>document.querySelector('[data-bean-playground]').dataset.physicsState==='paused');
 await shake(mobile);assert.equal(await count(mobile),shaken,'Sensors are detached offscreen');
 await reveal(mobile);await idle(mobile);await mobile.waitForTimeout(1100);
 await impulse(mobile,0,false);await mobile.waitForTimeout(100);await impulse(mobile,35,false);await mobile.waitForTimeout(140);await impulse(mobile,-35,false);
 assert.ok(await count(mobile)>shaken,'Gravity-only acceleration is supported');await idle(mobile);
  await mobile.setViewportSize({width:320,height:568});await reveal(mobile);await idle(mobile);
  assert.equal(await count(mobile),0);assert.equal(await mobile.locator('[data-bean-status]').textContent(),'','Resizing clears the previous pile and its count together');
  await mobile.locator('.bean-playground-heading').scrollIntoViewIfNeeded();await mobile.waitForTimeout(300);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mobile.screenshot({path:folder+'/mobile-320-controls.png'});
 report.push({mobile:true,optIn:true,shake:shaken,offscreen:true,gravityFallback:true});await mobile.close();

 for(const state of ['denied','unsupported']){
  const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  if(state==='denied')await permission(page,'denied');
  else await page.addInitScript(()=>Object.defineProperty(window,'DeviceMotionEvent',{value:undefined}));
  await open(page);
  if(state==='denied')await page.locator('[data-bean-motion]').click();
  else assert.ok(await page.locator('[data-bean-motion]').isDisabled());
  await shake(page);assert.equal(await count(page),0);
  await page.locator('.coffee-bean[tabindex="0"]').focus();await page.keyboard.press('Shift+Enter');
  await page.waitForFunction(()=>Number(document.querySelector('[data-bean-playground]').dataset.groundCount)>0);
  report.push({state,manualGrindingWorks:true});await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile(folder+'/report.json',JSON.stringify({report,errors},null,2));console.log('PASS grinding and motion',report);
}finally{await browser.close();}
