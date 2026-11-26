import fs from 'node:fs';
import path from 'node:path';
import {replayRecords} from '../src/replay.mjs';
const args=process.argv.slice(2),file=args[0];
if(!file)throw Error('Usage: node scripts/replay-telemetry.mjs <snapshot.json|scenario.ndjson> [--output packets.ndjson]');
if(fs.statSync(file).size>10*1024*1024)throw Error('Replay input exceeds 10 MB');
const outputIndex=args.indexOf('--output'),output=outputIndex>=0?args[outputIndex+1]:undefined;
if(outputIndex>=0&&!output)throw Error('--output needs a filename');
if(output&&path.resolve(output)===path.resolve(file))throw Error('Output must not overwrite the source');
const text=fs.readFileSync(file,'utf8');let records;
if(file.endsWith('.ndjson'))records=text.split(/\r?\n/).filter(s=>s.trim()).map(s=>JSON.parse(s));
else{const data=JSON.parse(text);records=Array.isArray(data)?data:[{offset_ms:0,frame:data.frame}];}
const config=JSON.parse(fs.readFileSync(new URL('../panel.json',import.meta.url)));
const packets=replayRecords(records,config).map(row=>JSON.stringify(row)).join('\n')+'\n';
if(output)fs.writeFileSync(output,packets);else process.stdout.write(packets);
