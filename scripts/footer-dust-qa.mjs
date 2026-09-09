import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const code=(await transform((await readFile('src/lib/footer-coffee-dust.ts','utf8')).replace('export function','function'),{loader:'ts'})).code;
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.setContent('<div id="stage"></div>');
 await page.addScriptTag({content:code+';window.makeDust=createCoffeeDust;'});
 const result=await page.evaluate(()=>{
  const stage=document.querySelector('#stage'),dust=window.makeDust(stage);
  dust.reset(600,300);dust.burst({x:300,y:260},{x:0,y:0},9000,25,false);dust.finish();
  const before=stage.querySelector('[data-dust-pile]').getAttribute('d');
  for(let i=0;i<60;i++)dust.update(1/120,[{x:260+i,y:278,rx:30,ry:40,angle:.5,vx:120,vy:0}]);
  const moved=Number(stage.dataset.dustDisturbed),after=stage.querySelector('[data-dust-pile]').getAttribute('d');
  for(let i=0;i<500;i++)dust.update(1/120);
  return {moved,changed:before!==after,active:dust.active,pool:stage.querySelectorAll('.coffee-ground').length};
 });
 assert.ok(result.moved>0);assert.ok(result.changed);assert.equal(result.active,false);assert.ok(result.pool<=96);
 console.log(result);
} finally {await browser.close();}
