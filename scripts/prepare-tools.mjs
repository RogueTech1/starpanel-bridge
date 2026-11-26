import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
export function prepareAvrTools(){
 const source=path.join(os.homedir(),'.platformio/packages/tool-avrdude'),target=path.resolve(import.meta.dirname,'../tools/avrdude');
 for(const name of ['avrdude.exe','avrdude.conf','libusb0.dll'])if(!fs.existsSync(path.join(source,name)))throw Error('Install the pinned tool-avrdude package first; see docs/REPRODUCING.md');
 fs.mkdirSync(target,{recursive:true});for(const name of ['avrdude.exe','avrdude.conf','libusb0.dll'])fs.copyFileSync(path.join(source,name),path.join(target,name));
 console.log('Prepared Windows AVR upload tools.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))prepareAvrTools();
