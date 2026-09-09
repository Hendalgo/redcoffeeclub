import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.QA_URL || 'http://127.0.0.1:4322';
const label = process.env.QA_LABEL || 'development';
const folder = `docs/qa/brew/${label}`;
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
const report = [], errors = [];
const viewports = [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:667,height:375}].filter(viewport=>!process.env.QA_WIDTH || viewport.width===Number(process.env.QA_WIDTH));
try {
 for(const viewport of viewports){
  const page=await browser.newPage({viewport});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url+'/#prepara-cafe');
  await page.waitForFunction(()=>document.querySelector('.brew-workbench')?.dataset.ready==='true');
  assert.equal(await page.locator('dialog[open]').count(),0,'Preparation is in the page, without a modal');
  assert.equal(await page.evaluate(()=>document.activeElement.tagName),'BODY','Arrival never steals focus');
  const sectionHeight=await page.locator('#prepara-cafe').evaluate(e=>e.clientHeight);
  const moment=async(delay,name)=>{if(process.env.QA_MOMENTS){await page.waitForTimeout(delay);await page.screenshot({path:`${folder}/${viewport.width}-motion-${name}.png`});}};
  const stage=async(step,name)=>{
   await page.waitForFunction(step=>document.querySelector('.brew-workbench')?.dataset.step===String(step),step);
   await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>document.querySelector('.brew-workbench').scrollWidth>innerWidth),false);
   await page.screenshot({path:`${folder}/${viewport.width}-${name}.png`});
  };
  await stage(0,'assembly');
  assert.equal(await page.locator('canvas').count(),1,'Direct preparation loads the shared scene only once');
  await page.getByRole('button',{name:'Armar AeroPress',exact:true}).click();await moment(1100,'assembly');await stage(1,'assembled');
  await page.getByRole('button',{name:'Añadir café',exact:true}).click();await moment(1150,'grounds');await stage(2,'coffee');
  await page.locator('.brew-pour').focus();await page.keyboard.down('Space');await page.waitForTimeout(850);await moment(0,'water');await page.keyboard.up('Space');
  const water=await page.locator('.brew-meter progress').evaluate(element=>element.value);
  assert.ok(water>.1&&water<.7,'Holding pours only part of the water');
  await page.waitForTimeout(500);assert.equal(await page.locator('.brew-meter progress').evaluate(element=>element.value),water,'Releasing pauses the pour');
  await stage(2,'pour-paused');
  await page.evaluate(()=>document.getElementById('contacto').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(800);
  assert.equal(await page.locator('.brew-meter progress').evaluate(element=>element.value),water,'Leaving preserves the water already poured');
  await page.locator('.brew-pour').scrollIntoViewIfNeeded();await page.waitForTimeout(500);await page.locator('.brew-pour').focus();
  await page.keyboard.down('Space');await page.waitForTimeout(3100);await page.keyboard.up('Space');await stage(3,'water');
  await page.getByRole('button',{name:'Remover y preparar',exact:true}).click();await moment(1700,'stir');await stage(4,'press-ready');
  await page.locator('.brew-handle').scrollIntoViewIfNeeded();await page.waitForTimeout(500);
  const handle=await page.locator('.brew-handle').boundingBox();
  await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();
  await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2+(viewport.height<650?16:35),{steps:15});await page.mouse.up();
  const pressure=Number(await page.locator('.brew-pressure input').inputValue());
  assert.ok(pressure>5&&pressure<95,'Dragging the actual plunger controls extraction');
  await stage(4,'press-partial');
  await page.locator('.brew-pressure input').focus();await page.keyboard.press('End');await stage(5,'extracted');
  await page.getByRole('button',{name:'Servir mi café',exact:true}).click();await moment(1000,'serve');await stage(6,'served');
  await page.waitForTimeout(400);
  const frames=await page.evaluate(()=>window.__brewState?.frames);
  await page.waitForTimeout(650);if(frames)assert.equal(await page.evaluate(()=>window.__brewState.frames),frames,'The workbench stops rendering when idle');
  await page.getByRole('button',{name:'Preparar otro',exact:true}).click();await stage(0,'replay');
  const pose=await page.evaluate(()=>window.__brewState?.pose);
  if(pose){assert.equal(pose.cupLiquid,0);assert.equal(pose.dose,0);}
  assert.equal(await page.locator('#prepara-cafe').evaluate(e=>e.clientHeight),sectionHeight,'All steps preserve section height');
  await page.evaluate(()=>document.getElementById('contacto').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(600);
  assert.equal(await page.locator('.brew-workbench').getAttribute('data-step'),'0','Leaving preserves the preparation');
  await page.evaluate(()=>document.getElementById('prepara-cafe').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(600);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.brew-workbench').count(),1,'Escape does not dismiss the section');
  assert.notEqual(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
  report.push({viewport,water,pressure,inline:true,replayed:true});await page.close();console.log('PASS brewing',viewport);
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${folder}/report.json`,JSON.stringify({report,errors},null,2));
}finally{await browser.close();}
