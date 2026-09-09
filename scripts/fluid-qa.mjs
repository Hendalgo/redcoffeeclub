import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const folder='docs/qa/brew/fluid-behavior';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const errors=[],results=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{
   window.__drawCalls=0;
   for(const method of ['drawElements','drawArrays','drawElementsInstanced']){
    const original=WebGL2RenderingContext.prototype[method];
    WebGL2RenderingContext.prototype[method]=function(...args){window.__drawCalls++;return original.apply(this,args);};
   }
  });
  await page.goto('http://127.0.0.1:4322/#prepara-cafe');await page.waitForFunction(()=>document.querySelector('.brew-workbench')?.dataset.ready==='true');
  const step=n=>page.waitForFunction(n=>document.querySelector('.brew-workbench').dataset.step===String(n),n);
  await page.getByRole('button',{name:'Armar AeroPress',exact:true}).click();await step(1);
  await page.getByRole('button',{name:'Añadir café',exact:true}).click();await step(2);
  await page.locator('.brew-pour').focus();await page.keyboard.down('Space');await page.waitForTimeout(3200);await page.keyboard.up('Space');await step(3);
  await page.getByRole('button',{name:'Remover y preparar',exact:true}).click();await step(4);
  await page.locator('.brew-pressure input').focus();
  for(let i=0;i<45;i++){
   await page.keyboard.press('ArrowRight');await page.waitForTimeout(38);
   if(i===20)await page.screenshot({path:`${folder}/${viewport.width}-flow.png`});
  }
  await page.screenshot({path:`${folder}/${viewport.width}-released.png`});
  await page.waitForTimeout(2100);const stopped=await page.evaluate(()=>window.__drawCalls);await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>window.__drawCalls),stopped,'Fluid settles and releases the GPU after input stops');
  await page.screenshot({path:`${folder}/${viewport.width}-settled.png`});
  await page.locator('.brew-pressure input').focus();await page.keyboard.press('End');await step(5);
  await page.getByRole('button',{name:'Servir mi café',exact:true}).click();await step(6);
  await page.getByRole('button',{name:'Preparar otro',exact:true}).click();await step(0);
  await page.waitForTimeout(2200);const reset=await page.evaluate(()=>window.__drawCalls);await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>window.__drawCalls),reset,'Replay resets the flow and every settling animation');
  results.push({viewport,settles:true,replay:true});console.log('PASS fluid behavior',viewport);await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/report.json`,JSON.stringify({results,errors},null,2));
}finally{await browser.close();}
