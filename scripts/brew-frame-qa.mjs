import {chromium} from '@playwright/test';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
const bundle=await build({bundle:true,write:false,format:'iife',globalName:'frameQA',stdin:{resolveDir:process.cwd(),loader:'ts',contents:`
import * as THREE from 'three';
import {createAeroPress} from './src/lib/aeropress-model';
import {createBrewTable} from './src/lib/brew-model';
import {createBrewFrame} from './src/lib/brew-frame';
export async function run(){
 const logo=new Image();logo.src='/images/logo.png';await logo.decode();
 const product=createAeroPress(logo),table=createBrewTable(logo,product);
 const scene=new THREE.Scene();scene.add(table.root);
 const framing=createBrewFrame([product.root,table.cup]);let frames=0;
 for(const width of [320,393,430])for(const height of [659,852]){
  const viewport={width,height},rect={left:24,top:170,width:width-48,height:Math.min(440,width*.8)};
  const camera=new THREE.OrthographicCamera();
  for(let i=0;i<=240;i++){
   table.update(i/40,false,i/24,0,true);scene.updateMatrixWorld(true);
   camera.position.set(0,3.6,12);camera.lookAt(0,0,0);
   camera.zoom=Math.min(rect.height/10.8,rect.width/8.8);
   const x=(width/2-rect.left-rect.width/2)/camera.zoom,y=(rect.top+rect.height/2-height/2)/camera.zoom;
   camera.left=-width/2+x;camera.right=width/2+x;camera.top=height/2+y;camera.bottom=-height/2+y;camera.updateProjectionMatrix();
   framing.fit(camera,viewport,rect);const b=framing.bounds(camera,viewport);
   if(b.left<rect.left+15.9||b.right>rect.left+rect.width-15.9||b.top<rect.top+15.9||b.bottom>rect.top+rect.height-15.9)throw new Error(JSON.stringify({width,height,i,b,rect}));
   frames++;
  }
 }
 table.dispose();return frames;
}`}});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const p=await browser.newPage();await p.goto('http://127.0.0.1:4322/');await p.addScriptTag({content:bundle.outputFiles[0].text});
 const frames=await p.evaluate(()=>frameQA.run());assert.equal(frames,1446);console.log({frames,clipped:0});
}finally{await browser.close();}
