import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url=process.env.QA_URL||'http://127.0.0.1:4322';
const folder='docs/qa/brew/inputs';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const errors=[],report=[];
try{
 for(const reducedMotion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url+'/#explora');await page.waitForFunction(()=>document.querySelector('.preloader').hidden);
  if(reducedMotion==='no-preference'){
   await page.getByRole('button',{name:'Explorar todas las piezas'}).click();
   await page.waitForFunction(()=>Number(document.querySelector('.experience').dataset.journeyProgress)>.93);
  }
  const entry=page.locator(reducedMotion==='reduce'?'.brew-entry-static':'[data-story="3"] [data-brew-start]');
  const ready=()=>page.waitForFunction(()=>document.querySelector('.brew-dialog')?.dataset.ready==='true');
  const stage=step=>page.waitForFunction(step=>document.querySelector('.brew-dialog')?.dataset.step===String(step),step);
  await entry.click();await ready();
  await page.getByRole('button',{name:'Armar AeroPress',exact:true}).click();await stage(1);
  await page.getByRole('button',{name:'Añadir café',exact:true}).click();await stage(2);
  const cdp=await context.newCDPSession(page);
  const touch=async(type,x=0,y=0)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1,radiusX:5,radiusY:5,force:1}]});
  let box=await page.locator('.brew-pour').boundingBox();
  await touch('touchStart',box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(700);await touch('touchEnd');
  const partial=await page.locator('.brew-meter progress').evaluate(element=>element.value);
  assert.ok(partial>.1&&partial<.6);
  await page.waitForTimeout(250);assert.equal(await page.locator('.brew-meter progress').evaluate(element=>element.value),partial);
  await touch('touchStart',box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(3100);await touch('touchEnd');await stage(3);
  await page.getByRole('button',{name:'Remover y preparar',exact:true}).click();await stage(4);
  box=await page.locator('.brew-handle').boundingBox();
  await touch('touchStart',box.x+box.width/2,box.y+box.height/2);
  for(let i=1;i<=12;i++){await touch('touchMove',box.x+box.width/2,box.y+box.height/2+i*2);await page.waitForTimeout(16);}
  await touch('touchEnd');
  const pressure=Number(await page.locator('.brew-pressure input').inputValue());assert.ok(pressure>5&&pressure<90);
  await page.locator('.brew-pressure input').focus();await page.keyboard.press('End');await stage(5);
  await page.getByRole('button',{name:'Servir mi café',exact:true}).click();await stage(6);
  await page.screenshot({path:`${folder}/${reducedMotion}-served.png`});
  await page.getByRole('button',{name:'Preparar otro',exact:true}).click();await stage(0);
  await page.getByRole('button',{name:'Armar AeroPress',exact:true}).click();await stage(1);
  await page.getByRole('button',{name:'Añadir café',exact:true}).click();await stage(2);
  await page.locator('.brew-pour').focus();await page.keyboard.down('Space');await page.waitForTimeout(200);
  await page.keyboard.press('Escape');await page.keyboard.up('Space');
  await page.waitForFunction(()=>!document.querySelector('.brew-dialog'));
  assert.equal(await page.locator('canvas').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('brew-open')),false);
  assert.notEqual(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
  await entry.click();await ready();
  await page.locator('.brew-scene canvas').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.getByRole('alert').filter({hasText:'La vista 3D no está disponible'}).waitFor();
  assert.ok(await page.getByRole('button',{name:'Armar AeroPress',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Volver al evento',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('.brew-dialog'));
  assert.equal(await page.locator('canvas').count(),1);
  assert.ok(await page.evaluate(()=>document.querySelector('.experience').classList.contains('has-webgl')));
  report.push({reducedMotion,touchPour:partial,touchPressure:pressure,closeDuringPour:true,contextLossRecovery:true});
  await context.close();console.log('PASS brewing inputs',reducedMotion);
 }
 assert.deepEqual(errors,[]);
 await writeFile(`${folder}/report.json`,JSON.stringify({report,errors},null,2));
}finally{await browser.close();}
