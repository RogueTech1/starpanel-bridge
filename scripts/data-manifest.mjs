import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const files=['schema/live/sc_extrait.desc','schema/live/sc_extrait.proto','schema/live/field-catalog.json','schema/local.desc','data/samples/live-4.10.3-character.json','data/samples/live-4.10.3-seated.json','data/scenarios/gear-cycle.ndjson'];
const manifest={format:'starpanel-data-1',files:files.map(file=>{const bytes=fs.readFileSync(path.join(root,file));return {path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};})};
const output=JSON.stringify(manifest,null,2)+'\n',target=path.join(root,'data/manifest.json');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('Data/schema manifest differs. Review changes, then run node scripts/data-manifest.mjs.');console.log(`Verified ${files.length} public data/schema assets.`);}else{fs.writeFileSync(target,output);console.log(`Wrote ${files.length} asset hashes.`);}
