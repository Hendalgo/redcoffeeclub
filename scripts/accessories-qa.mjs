import { chromium } from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-sandbox']});
const folder='docs/qa/accessories', output='output/models-red';
await mkdir(folder,{recursive:true});await mkdir(output,{recursive:true});
const errors=[],report=[];
try {
 const page=await browser.newPage({viewport:{width:1000,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:4323/');
 await page.waitForFunction(()=>document.querySelector('.preloader').hidden);
 await page.evaluate(async()=>{const {openStudio}=await import('/scripts/brew-model-studio.ts');window.__accessoryStudio=await openStudio();});
 for(const name of ['cup','kettle','scoop']) {
  for(const [view,angle] of [['front',0],['three-quarter',-.45],['rear',2.8]]) {
   const stats=await page.evaluate(({name,angle})=>window.__accessoryStudio.show(name,angle),{name,angle});
   report.push({...stats,view});
   await page.screenshot({path:`${folder}/${name}-${view}.png`});
  }
  const binary=Buffer.from(await page.evaluate(name=>window.__accessoryStudio.exportPart(name),name));
  assert.equal(binary.toString('utf8',0,4),'glTF');
  const jsonLength=binary.readUInt32LE(12), manifest=JSON.parse(binary.toString('utf8',20,20+jsonLength));
  assert.ok(manifest.images?.length,'Official logo texture is embedded');
  if(name!=='scoop')assert.ok(manifest.extensionsUsed.includes('KHR_materials_transmission'));
  const filenames={cup:'taza-cristal-red.glb',kettle:'tetera-vidrio-red.glb',scoop:'cuchara-red.glb'};
  await writeFile(`${output}/${filenames[name]}`,binary);
  await writeFile(`${output}/${name}-manifest.json`,JSON.stringify(manifest,null,2));
  console.log('Exported',name,binary.length,'bytes');
 }
 await page.evaluate(()=>window.__accessoryStudio.show('cup',-.35,true));
 await page.screenshot({path:`${folder}/cup-with-coffee.png`});
 assert.deepEqual(errors,[]);await writeFile(`${folder}/report.json`,JSON.stringify({report,errors},null,2));
}finally{await browser.close();}
