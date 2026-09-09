import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const out='docs/qa/footer-beans';await mkdir(out,{recursive:true});
const report=[],errors=[];
const sleep=(page)=>page.waitForFunction(()=>document.querySelector('[data-bean-playground]')?.dataset.physicsState==='sleeping',null,{timeout:18000});
const poses=(page)=>page.locator('.coffee-bean:not(:disabled)').evaluateAll(els=>els.map(el=>el.style.transform));
const center=async(page,id)=>page.locator(`[data-bean="${id}"]`).evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
const pick=async(page)=>page.locator('.coffee-bean:not(:disabled)').evaluateAll(els=>{
 for(const el of [...els].reverse()){const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(x<16||x>innerWidth-16||y<100||y>innerHeight-16)continue;if(document.elementFromPoint(x,y)?.closest('[data-bean]')===el)return{id:el.dataset.bean,x,y};}throw Error('No exposed bean');
});
async function open(page){
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4322/#contacto');await page.waitForSelector('[data-physics-ready]');
 await page.locator('.bean-stage').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-180,behavior:'instant'}));await sleep(page);
}
try{
 // The initial page must not download the physics engine.
 const landing=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const requested=[];landing.on('request',r=>requested.push(r.url()));
 await landing.goto('http://127.0.0.1:4322/');await landing.waitForFunction(()=>document.documentElement.dataset.siteReady==='true');await landing.waitForTimeout(350);
 assert.ok(!requested.some(url=>/\/footer-beans\.[^/]+\.js/.test(url)),'Physics remains deferred at the hero');await landing.close();
 for(const [width,height] of [[1440,900],[393,852],[320,568]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<761,hasTouch:width<761});await open(page);
  assert.equal(await page.locator('.coffee-bean:not(:disabled)').count(),width>1100?44:16);
  assert.equal(await page.locator('.bean-stage [tabindex="0"]').count(),1,'One keyboard stop for the collection');
  const idle=await poses(page);await page.waitForTimeout(250);assert.deepEqual(await poses(page),idle,'Resting beans stop updating');
  const bean=await pick(page),stage=await page.locator('.bean-stage').boundingBox();
  const target={x:Math.max(60,Math.min(width-70,bean.x+(bean.x>width/2?-140:140))),y:stage.y+60};
  const scrollBefore=await page.evaluate(()=>scrollY);
  const cdp=await page.context().newCDPSession(page);
  if(width>760){await page.mouse.move(bean.x,bean.y);await page.mouse.down();}
  else await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bean.x,y:bean.y,id:1}]});
  await page.waitForSelector('.is-grabbed');
  for(let i=1;i<=12;i++){
   const x=bean.x+(target.x-bean.x)*i/12,y=bean.y+(target.y-bean.y)*i/12;
   if(width>760)await page.mouse.move(x,y);
   else await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y,id:1}]});
   await page.waitForTimeout(18);
  }
  const dragged=await center(page,bean.id);assert.ok(Math.hypot(dragged.x-bean.x,dragged.y-bean.y)>50,'Drag physically moves the picked bean');
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scrollBefore)<2,'Dragging a bean does not scroll the page');
  if(width>760)await page.mouse.up();else await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await page.locator('.is-grabbed').count(),0);
  const released=await center(page,bean.id),trajectory=[];
  // Sample the path: a ceiling bounce can return near the release point.
  for(let i=0;i<8;i++){await page.waitForTimeout(40);trajectory.push(await center(page,bean.id));}
  assert.ok(trajectory.some(point=>Math.hypot(released.x-point.x,released.y-point.y)>12),'Release continues with momentum and gravity');
  await page.screenshot({path:`${out}/${width}-throw.png`});await sleep(page);
  assert.notDeepEqual(await poses(page),idle,'Thrown bean has a new resting pose');
  await page.locator('[data-bean="0"]').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-bean')),'1');
  const keyBefore=await center(page,'1');await page.keyboard.press('Enter');const keyPath=[];
  for(let i=0;i<8;i++){await page.waitForTimeout(40);keyPath.push(await center(page,'1'));}
  if(!keyPath.some(point=>Math.hypot(point.x-keyBefore.x,point.y-keyBefore.y)>8))console.log('Keyboard motion',width,keyBefore,keyPath,await page.locator('[data-bean-playground]').evaluate(el=>({state:el.dataset,bean:el.querySelector('[data-bean="1"]').outerHTML,active:document.activeElement?.outerHTML})));
  assert.ok(keyPath.some(point=>Math.hypot(point.x-keyBefore.x,point.y-keyBefore.y)>8),'Keyboard launches a bean even when a collision redirects it');await sleep(page);
  const beforeShuffle=await poses(page);await page.locator('[data-bean-shuffle]').click();await page.waitForTimeout(200);assert.notDeepEqual(await poses(page),beforeShuffle);
  await page.screenshot({path:`${out}/${width}-shuffle.png`});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>document.querySelector('[data-bean-playground]').dataset.physicsState==='paused');const paused=await poses(page);await page.waitForTimeout(250);assert.deepEqual(await poses(page),paused,'No physics frames off screen');
  await page.locator('.bean-stage').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-180,behavior:'instant'}));await sleep(page);
  if(width<761){
   const area=await page.locator('.bean-stage').boundingBox(),x=width/2,y=area.y+20;
   assert.equal(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('[data-bean]'),{x,y}),false);
   const before=await page.evaluate(()=>scrollY);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:2}]});
   for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+i*14,id:2}]});await page.waitForTimeout(18);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
   assert.ok(await page.evaluate(()=>scrollY)<before-30,'Empty arena space allows page scrolling');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.locator('.footer-instagram').getAttribute('href'),'https://www.instagram.com/redcoffeeclub____/');
  report.push({width,height,drag:true,inertia:true,keyboard:true,shuffle:true,sleep:true,offscreenPause:true,touchScroll:width<761});console.log('PASS footer physics',width);await page.close();
 }
 const reduced=await browser.newPage({viewport:{width:393,height:852},reducedMotion:'reduce'});await open(reduced);const still=await poses(reduced);await reduced.waitForTimeout(300);assert.deepEqual(await poses(reduced),still);await reduced.locator('[data-bean-shuffle]').click();await reduced.waitForTimeout(150);assert.notDeepEqual(await poses(reduced),still);await reduced.close();
 const plain=await browser.newPage({javaScriptEnabled:false});await plain.goto('http://127.0.0.1:4322/#contacto');assert.equal(await plain.locator('.coffee-bean:disabled').count(),44);assert.ok(await plain.locator('.footer-instagram').isVisible());await plain.close();
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({report,lazy:true,reducedMotion:true,noJavaScript:true,errors},null,2));
}finally{await browser.close();}
