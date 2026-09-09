import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const mobile of [false,true]){
 const page=await browser.newPage({viewport:{width:mobile?393:1440,height:852},isMobile:mobile,hasTouch:mobile});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(mobile)await page.addInitScript(()=>Object.defineProperty(DeviceMotionEvent,'requestPermission',{value:async()=>'granted'}));
 await page.goto('http://127.0.0.1:4322/#contacto');await page.waitForSelector('[data-physics-ready]');
 await page.locator('.bean-stage').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-320,behavior:'instant'}));
 const idle=()=>page.waitForFunction(()=>document.querySelector('[data-bean-playground]').dataset.physicsState==='sleeping',null,{timeout:25000});await idle();
 const total=mobile?16:44;
 for(let i=0;i<total;i++){
  await page.locator('.coffee-bean[tabindex="0"]').focus();await page.keyboard.press('Shift+Enter');
 }
 await idle();
 assert.ok(await page.locator('.coffee-handful:visible').count()>0);
 const handle=page.locator('.coffee-handful:visible').first();const box=await handle.boundingBox();
 const start={x:box.x+22,y:box.y+22};
 await page.mouse.move(start.x,start.y);await page.mouse.down();
 await page.waitForFunction(()=>Number(document.querySelector('.bean-stage').dataset.dustHeld)>0);
 const held=await page.locator('.bean-stage').getAttribute('data-dust-held');
 for(let i=1;i<=15;i++){await page.mouse.move(start.x+80*i/15,start.y-160*i/15);await page.waitForTimeout(20);}
 await page.mouse.up();await page.waitForTimeout(100);
 assert.equal(await page.locator('.bean-stage').getAttribute('data-dust-held'),'0');
 assert.ok(Number(await page.locator('.bean-stage').getAttribute('data-dust-particles'))>0);
 await idle();
 await page.locator('[data-bean-shuffle]').click();await page.waitForTimeout(80);
 assert.ok(Number(await page.locator('.bean-stage').getAttribute('data-dust-particles'))>0,'Revolver works with no whole beans');await idle();
 if(mobile){
  await page.locator('[data-bean-motion]').click();
  for(const x of [28,-28]){await page.evaluate(x=>{const e=new Event('devicemotion');Object.defineProperty(e,'acceleration',{value:{x,y:0,z:0}});dispatchEvent(e);},x);await page.waitForTimeout(140);}
  assert.ok(Number(await page.locator('.bean-stage').getAttribute('data-dust-particles'))>0,'Phone shake wakes grounds with no whole beans');await idle();
  const session=await page.context().newCDPSession(page);const h=await page.locator('.coffee-handful:visible').first().boundingBox();
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:h.x+22,y:h.y+22}]});
  for(let i=1;i<=12;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:h.x+22+50*i/12,y:h.y+22-140*i/12}]});await page.waitForTimeout(25);}
  assert.ok(Number(await page.locator('.bean-stage').getAttribute('data-dust-held'))>0,'Touch drag is retained');
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await idle();
 }
 await page.locator('.coffee-handful:visible').first().focus();await page.keyboard.press('Enter');await page.waitForTimeout(80);assert.ok(Number(await page.locator('.bean-stage').getAttribute('data-dust-particles'))>0);await idle();
 const cancelBox=await page.locator('.coffee-handful:visible').first().boundingBox();
 await page.mouse.move(cancelBox.x+22,cancelBox.y+22);await page.mouse.down();
 await page.waitForFunction(()=>Number(document.querySelector('.bean-stage').dataset.dustHeld)>0);
 await page.evaluate(()=>dispatchEvent(new Event('blur')));assert.equal(await page.locator('.bean-stage').getAttribute('data-dust-held'),'0');await page.mouse.up();await idle();
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>document.querySelector('[data-bean-playground]').dataset.physicsState==='paused');
 await page.locator('.bean-stage').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-320,behavior:'instant'}));await idle();
 await page.locator('[data-bean-reset]').click();await idle();assert.equal(await page.locator('.bean-stage').getAttribute('data-dust-bodies'),'0');
 assert.equal(await page.locator('.coffee-handful:visible').count(),0);assert.deepEqual(errors,[]);console.log({mobile,held,shuffle:true,keyboard:true,reset:true});await page.close();
}}finally{await browser.close();}
