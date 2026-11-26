import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadFirmware} from '../src/flasher.mjs';
import {AVR_TARGETS} from '../src/avr.mjs';
const root=path.resolve(import.meta.dirname,'../firmware-images');
const esp=['esp32','esp32-wifi','esp32s3','esp32s3-wifi','esp32c3','esp32c3-wifi','esp32c3supermini','esp32s2mini'];
for(const target of esp)loadFirmware(root,target);
const avr=[...new Set(Object.values(AVR_TARGETS).map(t=>t.image))];
for(const target of avr){const dir=path.join(root,target),m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));if(m.profile!==target||createHash('sha256').update(fs.readFileSync(path.join(dir,'firmware.hex'))).digest('hex')!==m.sha256)throw Error(`AVR image checksum mismatch: ${target}`);}
console.log(`Verified ${esp.length} ESP32 and ${avr.length} AVR image profiles.`);
