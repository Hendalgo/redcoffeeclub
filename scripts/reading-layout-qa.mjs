import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
await mkdir('docs/qa/reading/layout',{recursive:true});
try {
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:667,height:375}]) {
  const page=await browser.newPage({viewport});await page.goto(process.env.QA_URL||'http://127.0.0.1:4321');await page.waitForFunction(()=>document.querySelector('.preloader').hidden);await page.waitForTimeout(1500);
  await page.locator('.hero-scroll').click();await page.waitForTimeout(1800);await page.screenshot({path:`docs/qa/reading/layout/${viewport.width}-intro.png`});
  for(const chapter of [.5,.69,.94]) {await page.locator(`[data-journey="${chapter}"]`).click();await page.waitForTimeout(1700);await page.screenshot({path:`docs/qa/reading/layout/${viewport.width}-${chapter}.png`});}
  await page.close();console.log('Captured readable chapters',viewport);
 }
} finally {await browser.close();}
