import fs from 'node:fs';
import {loadSchema,SERVICE} from '../src/game.mjs';
import {catalog} from '../src/catalog.mjs';

const [baseline,candidate,baselineActions,candidateActions]=process.argv.slice(2);
if(!baseline||!candidate||Boolean(baselineActions)!==Boolean(candidateActions))throw Error('Usage: node scripts/compare-telemetry.mjs baseline.desc candidate.desc [baseline-actions.json candidate-actions.json]');
const summarize=file=>{
 const root=loadSchema(file);
 return {fields:catalog(root),methods:Object.values(root.lookupService(SERVICE).methods).map(m=>({name:m.name,request:m.requestType,response:m.responseType,stream:Boolean(m.responseStream)}))};
};
const a=summarize(baseline),b=summarize(candidate);
const diff=(left,right,key)=>{
 const l=new Map(left.map(x=>[x[key],x])),r=new Map(right.map(x=>[x[key],x]));
 return {added:right.filter(x=>!l.has(x[key])),removed:left.filter(x=>!r.has(x[key])),changed:right.filter(x=>l.has(x[key])&&JSON.stringify(l.get(x[key]))!==JSON.stringify(x)).map(x=>({before:l.get(x[key]),after:x}))};
};
const report={format:'starpanel-schema-comparison-1',counts:{baseline:a.fields.length,candidate:b.fields.length},fields:diff(a.fields,b.fields,'path'),methods:diff(a.methods,b.methods,'name')};
if(baselineActions){
 const left=JSON.parse(fs.readFileSync(baselineActions)).actions,right=JSON.parse(fs.readFileSync(candidateActions)).actions;
 report.actions={baselineCount:left.length,candidateCount:right.length,...diff(left,right,'action_name')};
}
console.log(JSON.stringify(report,null,2));
