import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
for(const viewport of [{width:320,height:568},{width:390,height:844},{width:667,height:375},{width:844,height:390},{width:1440,height:900}]){
 const page=await browser.newPage({viewport});await page.goto(process.env.QA_URL || 'http://127.0.0.1:4322');await page.waitForFunction(()=>document.querySelector('.preloader').hidden);await page.waitForTimeout(1600);
 await page.locator('.hero-scroll').click();await page.waitForTimeout(1600);await page.locator('[data-journey="0.94"]').click();await page.waitForTimeout(1800);
 await page.screenshot({path:`docs/qa/experience/${viewport.width}-exploded.png`});
 const notes=await page.locator('.annotation-note').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom};}));
 const model = await page.evaluate(()=>window.__aeroState?.bounds);
 if(model) assert.ok(model.top>=60&&model.bottom<=viewport.height-35&&model.left>=0&&model.right<=viewport.width,`Complete model fits ${JSON.stringify({viewport,model})}`);
 assert.ok(notes.every(r=>r.x>=0&&r.right<=viewport.width&&r.y>=60&&r.bottom<=viewport.height),`Labels fit ${JSON.stringify({viewport,notes})}`);
 await page.evaluate(()=>document.querySelector('a[href="#equipo"]').click());await page.waitForTimeout(1800);
 await page.screenshot({path:`docs/qa/experience/${viewport.width}-team.png`});
 assert.equal(await page.locator('.team-person h3').first().textContent(),'Hernán Velásquez');
 await page.locator('[data-team-step="1"]').click();await page.waitForTimeout(1600);assert.match(await page.locator('[data-team-count]').textContent(),/02/);
 console.log('PASS scene and team',viewport);await page.close();
}
await browser.close();
