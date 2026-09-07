import lighthouse from 'lighthouse';
import {chromium} from '@playwright/test';
import {launch} from 'chrome-launcher';
import desktopConfig from 'lighthouse/core/config/lr-desktop-config.js';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

const url=process.env.QA_URL||'http://127.0.0.1:4322/';
const folder=`docs/qa/lighthouse/${process.env.LH_LABEL||'baseline'}`;
const runs=Number(process.env.LH_RUNS||1), summaries=[];
await mkdir(folder,{recursive:true});
for(const form of (process.env.LH_FORM?[process.env.LH_FORM]:['mobile','desktop'])){
 for(let run=1;run<=runs;run++){
  const profile=resolve('tmp/lighthouse-profiles',randomUUID());await mkdir(profile,{recursive:true});
  const chrome=await launch({chromePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',userDataDir:profile,chromeFlags:['--headless=new','--no-sandbox'],logLevel:'error'});
  try{
   const result=await lighthouse(url,{port:chrome.port,output:['json','html'],logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']},form==='desktop'?desktopConfig:undefined);
   if(result.lhr.runtimeError)throw new Error(JSON.stringify(result.lhr.runtimeError));
   await writeFile(`${folder}/${form}-${run}.json`,result.report[0]);await writeFile(`${folder}/${form}-${run}.html`,result.report[1]);
   const scores=Object.fromEntries(Object.entries(result.lhr.categories).map(([id,value])=>[id,Math.round(value.score*100)]));
   const metrics=Object.fromEntries(['first-contentful-paint','largest-contentful-paint','speed-index','total-blocking-time','cumulative-layout-shift'].map(id=>[id,result.lhr.audits[id].numericValue]));
   const failed=Object.values(result.lhr.audits).filter(audit=>audit.score!==null&&audit.score<.9).map(audit=>({id:audit.id,score:audit.score,value:audit.displayValue,title:audit.title}));
   const summary={form,run,scores,metrics,failed,version:result.lhr.lighthouseVersion,browser:result.lhr.environment.hostUserAgent,settings:result.lhr.configSettings};
   summaries.push(summary);console.log(JSON.stringify(summary));
   }finally{
   // Graceful CDP shutdown avoids Windows taskkill/temporary-profile races.
   try {
    const remote=await chromium.connectOverCDP('http://127.0.0.1:'+chrome.port);
    const session=await remote.newBrowserCDPSession();
    await session.send('Browser.close');
   } catch {}
  }
 }
}
await writeFile(`${folder}/summary.json`,JSON.stringify(summaries,null,2));
if(process.env.LH_ASSERT==='1')for(const summary of summaries)assert.ok(Object.values(summary.scores).every(score=>score>90),`${summary.form} run ${summary.run}: every category must be above 90`);
