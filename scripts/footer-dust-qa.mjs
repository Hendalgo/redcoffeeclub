import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const source=(await readFile('src/lib/footer-coffee-dust.ts','utf8')).replace(/^import .*;\r?\n/gm,'').replace('export function','function');
const code=(await transform(source,{loader:'ts'})).code;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4322/');
 await page.addScriptTag({content:await readFile('node_modules/matter-js/build/matter.js','utf8')});
 await page.addScriptTag({content:code+';window.makeDust=createCoffeeDust;'});
 const result=await page.evaluate(async()=>{
  const {Engine,Bodies,Composite,Body}=Matter;
  const engine=Engine.create({enableSleeping:true});
  const stage=document.createElement('div');document.body.append(stage);
  const image=new Image();image.src='/optimized/coffee-grounds-512.webp';await image.decode();
  const dust=window.makeDust(stage,engine,image);dust.reset(600,300);
  Composite.add(engine.world,Bodies.rectangle(300,320,800,40,{isStatic:true}));
  dust.burst({x:300,y:200},{x:0,y:0},6000,25,false);
  const airborne=Number(stage.dataset.dustAirborne);
  for(let i=0;i<1600;i++){Engine.update(engine,1000/120);dust.update(1/120);}
  dust.paint();const faded=stage.dataset.dustAirborne==='0';
  const grounds=Composite.allBodies(engine.world).filter(b=>b.label==='Coffee grounds');
  const before=grounds.map(b=>({...b.position}));
  const settled=grounds.every(b=>b.isSleeping);
  const bean=Bodies.circle(230,275,24,{friction:.6});Composite.add(engine.world,bean);Body.setVelocity(bean,{x:9,y:0});
  for(let i=0;i<70;i++)Engine.update(engine,1000/120);
  const moved=grounds.filter((b,i)=>Math.hypot(b.position.x-before[i].x,b.position.y-before[i].y)>2).length;
  const finite=grounds.every(b=>Number.isFinite(b.position.x)&&Number.isFinite(b.position.y));
  dust.reset(600,300);
  return {airborne,faded,count:grounds.length,settled,moved,finite,left:Composite.allBodies(engine.world).filter(b=>b.label==='Coffee grounds').length};
 });
 assert.ok(result.airborne>0);assert.ok(result.faded);assert.equal(result.count,12);assert.ok(result.settled);assert.ok(result.moved>0);assert.ok(result.finite);assert.equal(result.left,0);console.log(result);
}finally{await browser.close();}
