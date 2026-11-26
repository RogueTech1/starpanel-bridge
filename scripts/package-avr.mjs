import fs from 'node:fs';
import path from 'node:path';
import {prepareAvrTools} from './prepare-tools.mjs';
import {createHash} from 'node:crypto';
const base=path.resolve(import.meta.dirname,'..');
for(const profile of ['dcsbioskit-master','mega-panel','nano-panel','mega-standalone','nano-standalone','uno-standalone','leonardo-standalone','micro-standalone','promicro-standalone']){
 const bytes=fs.readFileSync(path.join(base,'firmware-dcsbios/.pio/build',profile,'firmware.hex')),dir=path.join(base,'firmware-images',profile);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'firmware.hex'),bytes);fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({profile,role:profile==='dcsbioskit-master'?'master':'panel',sha256:createHash('sha256').update(bytes).digest('hex')},null,2));
}
prepareAvrTools();
console.log('Packaged AVR images and Windows uploader.');
