import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto('http://127.0.0.1:4321',{waitUntil:'networkidle'});await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
await page.waitForSelector('[data-scene="explore"].is-ready');await page.waitForTimeout(600);
await page.evaluate(()=>window.scrollTo(0,window.__aeroScroll.end));await page.waitForTimeout(900);
for(const rotation of [0,90,180,-90]){
 await page.locator('#product-rotation').fill(String(rotation));await page.waitForTimeout(250);
 const bounds=await page.locator('.annotation-note').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,part:e.parentElement.dataset.part};}));
 assert.ok(bounds.every(b=>b.left>=8&&b.right<=382),JSON.stringify({rotation,bounds}));
 await page.screenshot({path:'tmp/qa/rotation-'+rotation+'.png'});
}
console.log('Rotation labels stay within the viewport at 0°, ±90° and 180°.');await browser.close();
