import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
const base=path.resolve(import.meta.dirname,'..');
for(const profile of ['mega-panel','nano-panel','mega-standalone','nano-standalone','uno-standalone','leonardo-standalone','micro-standalone','promicro-standalone']){
 const bytes=fs.readFileSync(path.join(base,'firmware-dcsbios/.pio/build',profile,'firmware.hex')),dir=path.join(base,'firmware-images',profile);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'firmware.hex'),bytes);fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({profile,sha256:createHash('sha256').update(bytes).digest('hex')},null,2));
}
const source=path.join(os.homedir(),'.platformio/packages/tool-avrdude'),target=path.join(base,'tools/avrdude');fs.mkdirSync(target,{recursive:true});
for(const name of ['avrdude.exe','avrdude.conf','libusb0.dll'])fs.copyFileSync(path.join(source,name),path.join(target,name));
console.log('Packaged AVR images and Windows uploader.');
