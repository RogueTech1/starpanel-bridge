import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {privacyIssues} from '../src/public-audit.mjs';
const result=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8',shell:false,maxBuffer:10*1024*1024});
if(result.status!==0)throw Error('Run the public audit from a Git checkout');
const files=[...new Set(result.stdout.split('\0').filter(Boolean))],findings=[];let scanned=0;
for(const file of files){if(!fs.existsSync(file)||!fs.statSync(file).isFile())continue;scanned++;const issues=privacyIssues(fs.readFileSync(file),file);if(issues.length)findings.push({file,issues});}
if(process.argv.includes('--history')){
 const git=(args,input)=>{const r=spawnSync('git',args,{input,shell:false,maxBuffer:256*1024*1024});if(r.status!==0||r.error)throw Error('Git history inspection failed');return r.stdout;};
 const objects=new Map(git(['rev-list','--objects','--all']).toString('utf8').split('\n').filter(Boolean).map(line=>{const [id,...name]=line.split(' ');return [id,name.join(' ')];}));
 const inventory=git(['cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],[...objects.keys()].join('\n')+'\n').toString('utf8');
 const blobs=inventory.trim().split('\n').map(l=>l.split(' ')).filter(([,type])=>type==='blob');
 const bytes=git(['cat-file','--batch'],blobs.map(([id])=>id).join('\n')+'\n');let offset=0;
 for(const [id,,sizeText]of blobs){const lineEnd=bytes.indexOf(10,offset),size=Number(sizeText);if(lineEnd<0||!Number.isSafeInteger(size)||lineEnd+1+size>bytes.length)throw Error('Invalid Git object stream');const body=bytes.subarray(lineEnd+1,lineEnd+1+size);offset=lineEnd+size+2;const file=objects.get(id)||'(unnamed blob)',issues=privacyIssues(body,file);if(issues.length)findings.push({file,blob:id.slice(0,12),issues});}
 console.log(`Inspected ${blobs.length} historical blobs.`);
}
if(findings.length){console.error(JSON.stringify(findings,null,2));process.exitCode=1;}else console.log(`Public-tree privacy check passed for ${scanned} files. No sensitive values are printed.`);
