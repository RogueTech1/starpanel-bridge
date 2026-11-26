import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const targets=['esp32s3','esp32','esp32c3','esp32c3supermini','esp32s2mini','esp32s3-wifi','esp32-wifi','esp32c3-wifi'];
const selected=process.argv.slice(2);if(selected.some(p=>!targets.includes(p)))throw Error('Unknown firmware target');
for(const profile of selected.length?selected:targets){
  const dir=path.join(root,'firmware-images',profile);fs.mkdirSync(dir,{recursive:true});
  const s3=profile.startsWith('esp32s3');
  const c3=profile.startsWith('esp32c3');
  const s2=profile==='esp32s2mini';
  const sources=[['bootloader.bin',s3||c3?0:0x1000],['partitions.bin',0x8000],['boot_app0.bin',0xe000],['firmware.bin',0x10000]];
  const files=sources.map(([name,address])=>{
    const source=name==='boot_app0.bin'?path.join(os.homedir(),'.platformio/packages/framework-arduinoespressif32/tools/partitions/boot_app0.bin'):path.join(root,'firmware/.pio/build',profile,name);
    const bytes=fs.readFileSync(source);fs.writeFileSync(path.join(dir,name),bytes);
    return {name,address,sha256:createHash('sha256').update(bytes).digest('hex')};
  });
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({profile,chip:s3?'ESP32-S3':c3?'ESP32-C3':s2?'ESP32-S2':'ESP32',minimumFlashBytes:(s3?8:4)*1024*1024,files},null,2));
}
console.log('Packaged ESP32 firmware profiles with SHA-256 manifests.');
