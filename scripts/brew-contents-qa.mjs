import {chromium} from '@playwright/test';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const url=process.env.QA_URL||'http://127.0.0.1:4322';
const folder='docs/qa/brew-contents';await mkdir(folder,{recursive:true});
// Exercise the real scene graph with browser canvas textures, without exposing
// test hooks in the production renderer or creating a second WebGL context.
const bundle=await build({bundle:true,write:false,format:'iife',globalName:'contentsQA',stdin:{
 resolveDir:process.cwd(),loader:'ts',contents:`
 import * as THREE from 'three';
 import {createAeroPress,disposeModel} from './src/lib/aeropress-model';
 import {createSharedBrewScene} from './src/lib/shared-brew-scene';
 import {brewSession} from './src/lib/brew-session';
 export async function verify(){
  const check=(ok,message)=>{if(!ok)throw new Error(message);};
  const logo=new Image();logo.src='/images/logo.png';await logo.decode();
  const scene=new THREE.Scene(),stage=new THREE.Group();scene.add(stage);
  const product=createAeroPress(logo);stage.add(product.root);
  const originalGeometry=product.chamber.children.find(node=>node.isMesh).geometry;
  const journey=createSharedBrewScene(logo,product,scene);
  const contents=journey.table.chamberContents;
  const grounds=contents.getObjectByName('Chamber_grounds');
  const infusion=contents.getObjectByName('Chamber_infusion');
  const surface=contents.getObjectByName('Chamber_liquid_surface');
  const point=new THREE.Vector3(),matrix=new THREE.Matrix4();
  let frames=0,vertices=0,maxRadius=0,time=0;
  const checkContained=()=>{
   scene.updateMatrixWorld(true);
   for(const mesh of [grounds,infusion,surface]){
    if(!contents.visible||!mesh.visible)continue;
    matrix.copy(product.chamber.matrixWorld).invert().multiply(mesh.matrixWorld);
    const positions=mesh.geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++){
     point.fromBufferAttribute(positions,i).applyMatrix4(matrix);
     const radius=Math.hypot(point.x,point.z);maxRadius=Math.max(maxRadius,radius);
     check(radius<.585,'Coffee escaped the chamber radially: '+radius);
     check(point.y>=-1.241&&point.y<=1.201,'Coffee escaped the chamber vertically: '+point.y);
     vertices++;
    }
   }
  };
  for(const reduced of [false,true])for(const yaw of [-.8,0,1.8]){
   for(const progress of [0,1.5,2,2.5,3,4,4.5,5,5.6,6]){
    brewSession.driver.value=progress;
    for(const blend of [0,.05,.2,.4,.55,.7,.9,1,.7,.4,0,1]){
     // Match AeroScene: restore the exploration pose before each handoff.
     stage.add(product.root);product.root.position.set(0,0,0);
     product.root.rotation.set(0,0,0);product.root.scale.setScalar(1);
     product.plunger.position.set(0,2.58,0);
     product.filter.position.y=-.87;product.cap.position.y=-1.65;
     stage.position.set(2.4,-.6,0);stage.rotation.set(.15,yaw,-.12);stage.scale.setScalar(.8);
     stage.updateMatrixWorld(true);
     journey.update(blend,1/60,time+=1/60,reduced);
     checkContained();frames++;
     check(brewSession.driver.value===progress,'Scroll changed the recipe');
     if(blend===0)check(!contents.visible,'Brew contents leaked into exploration');
    }
   }
  }
  // Prove this check catches the original bug (contents left at the table).
  const containedRadius=maxRadius;
  stage.add(product.root);stage.position.set(3,0,0);stage.rotation.set(0,0,0);
  contents.visible=grounds.visible=true;
  contents.scale.setScalar(1);journey.table.brewer.add(contents);
  let rejectedDetached=false;
  try{checkContained();}catch{rejectedDetached=true;}
  check(rejectedDetached,'Containment check did not detect a detached coffee volume');
  product.chamber.add(contents);
  let disposedContents=0,disposedShared=0;
  grounds.geometry.addEventListener('dispose',()=>disposedContents++);
  originalGeometry.addEventListener('dispose',()=>disposedShared++);
  journey.dispose();
  check(disposedContents===1,'Brew contents were not disposed exactly once');
  check(disposedShared===0,'Disposing brewing also disposed the shared product');
  check(!product.chamber.getObjectByName('Chamber_contents'),'Disposed coffee remained in the product');
  disposeModel(product);
  return {frames,vertices,maxRadius:containedRadius,rejectedDetached,disposedContents,disposedSharedBeforeProduct:0};
 }
 `}});

const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[],report=[];
try{
 const harness=await browser.newPage();
 await harness.route('**/__brew-contents-qa.js',route=>route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
 await harness.route('**/__brew-contents-qa',route=>route.fulfill({contentType:'text/html',body:'<script src="/__brew-contents-qa.js"></script>'}));
 await harness.goto(url+'/__brew-contents-qa');
 const geometry=await harness.evaluate(()=>window.contentsQA.verify());
 console.log('PASS chamber containment',geometry);await harness.close();
 for(const viewport of [{width:1440,height:900},{width:393,height:852}]){
  const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/#prepara-cafe');
  await page.waitForFunction(()=>document.querySelector('.brew-workbench')?.dataset.ready==='true');
  await page.evaluate(()=>{window.originalCanvas=document.querySelector('#aero-mount canvas');});
  const model=await page.locator('#aero-mount').getAttribute('data-model-id');
  const step=n=>page.waitForFunction(n=>document.querySelector('.brew-workbench').dataset.step===String(n),n);
  await page.getByRole('button',{name:'Armar AeroPress',exact:true}).click();await step(1);
  await page.getByRole('button',{name:'Añadir café',exact:true}).click();await step(2);
  const tour=async(name)=>{
   const top=await page.locator('#prepara-cafe').evaluate(e=>e.getBoundingClientRect().top+scrollY);
   for(const p of [1,.8,.6,.35,0,.6,.8,1]){
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top-(viewport.height+(112-viewport.height)*p));
    await page.waitForTimeout(450);
    assert.equal(await page.locator('#aero-mount').getAttribute('data-model-id'),model);
    assert.ok(await page.evaluate(()=>document.querySelector('#aero-mount canvas')===window.originalCanvas));
    if([0,.6,.8,1].includes(p))await page.screenshot({path:folder+'/'+viewport.width+'-'+name+'-'+p+'.png'});
   }
  };
  await tour('grounds');await step(2);
  await page.locator('.brew-pour').focus();await page.keyboard.down('Space');
  await page.waitForTimeout(1350);await page.keyboard.up('Space');await page.waitForTimeout(600);
  const water=await page.locator('.brew-meter progress').evaluate(e=>e.value);
  assert.ok(water>.15&&water<.85,'Partial water dose');
  await tour('water');await step(2);
  assert.equal(await page.locator('.brew-meter progress').evaluate(e=>e.value),water,'Scroll preserves water');
  await page.locator('.brew-pour').focus();await page.keyboard.down('Space');
  await page.waitForTimeout(3100);await page.keyboard.up('Space');await step(3);
  await page.getByRole('button',{name:'Remover y preparar',exact:true}).click();await step(4);
  await page.locator('.brew-pressure input').focus();await page.keyboard.press('End');await step(5);
  await page.getByRole('button',{name:'Servir mi café',exact:true}).click();await step(6);
  await page.getByRole('button',{name:'Preparar otro',exact:true}).click();await step(0);
  await tour('reset');await step(0);
  report.push({viewport,water,sameModel:true,preservedRecipe:true,replayed:true});
  console.log('PASS filled chamber scroll',viewport);await page.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(folder+'/report.json',JSON.stringify({geometry,report,errors},null,2));
}finally{await browser.close();}
