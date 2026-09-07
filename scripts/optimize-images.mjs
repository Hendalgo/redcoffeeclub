import sharp from 'sharp';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
// Delivery variants preserve every supplied original.
const dir='public/optimized'; await mkdir(dir,{recursive:true});
const manifest={};
for(const [name,widths,quality] of [
 ['margarita-coast',[640,960,1536],62],['coffee-macro',[640,960,1536],65],
 ['coffee-botanical',[420,700],70],['logo',[160,240,319],85],
 ['flower',[100,160],80],['aeropress-assembled',[360,540,720],78],
 ['aeropress-exploded',[360,540,720],78],['hidra-logo',[240,400],85],
]) {
 const ext=['logo','flower','hidra-logo'].includes(name)?'png':'webp';
 const source=`public/images/${name}.${ext}`, meta=await sharp(source).metadata();
 manifest[name]={width:meta.width,height:meta.height,variants:[]};
 for(const width of widths){
  const file=`${name}-${width}.webp`;
  const result=await sharp(source).resize({width,withoutEnlargement:true}).webp({quality,effort:6}).toFile(`${dir}/${file}`);
  manifest[name].variants.push({src:`/optimized/${file}`,width:result.width,bytes:result.size});
 }
}
const inventory=JSON.parse(await readFile('docs/source-assets/sponsors-drive.json','utf8'));
for(const file of inventory.files){
 const [x,y,w,h]=file.bounds, padding=Math.ceil(Math.max(w,h)*.025);
 const left=Math.max(0,x-padding),top=Math.max(0,y-padding);
 const width=Math.min(file.width,x+w+padding)-left,height=Math.min(file.height,y+h+padding)-top;
 await sharp(`src/assets/sponsors/${file.file}`).extract({left,top,width,height}).resize({width:300,height:200,fit:'inside',withoutEnlargement:true}).webp({quality:90,effort:6}).toFile(`${dir}/sponsor-${file.index}.webp`);
}
for(const [name,rect] of [['kofy',[267,195,91,94]],['seal',[530,326,68,72]]]){
 const [left,top,width,height]=rect;
 const {data,info}=await sharp('public/images/sponsors-source.png').extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Match the existing SVG's luminance-to-alpha treatment without a large image.
 for(let i=0;i<data.length;i+=4)data[i+3]=Math.max(0,Math.min(255,.7*(data[i]+data[i+1]+data[i+2])-255*.75));
 await sharp(data,{raw:info}).webp({quality:95,effort:6}).toFile(`${dir}/sponsor-${name}.webp`);
}
await writeFile('docs/source-assets/optimized-images.json',JSON.stringify(manifest,null,2));
console.log('Responsive photos, brand marks and sponsor crops generated.');
for(const width of [480,614]) await sharp('public/images/margarita-coast.webp').extract({left:553,top:0,width:614,height:1024}).resize({width}).webp({quality:78,effort:6}).toFile(`${dir}/coast-portrait-${width}.webp`);
