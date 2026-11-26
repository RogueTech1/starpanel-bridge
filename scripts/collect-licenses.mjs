import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'licenses');fs.mkdirSync(out,{recursive:true});
// Only these generated directories are replaced; uploader/manual notices stay.
for(const entry of fs.readdirSync(out,{withFileTypes:true}))if(entry.isDirectory()&&/^(npm-|firmware-|framework-)/.test(entry.name)){
 const target=path.resolve(out,entry.name);if(path.dirname(target)!==out)throw Error('Invalid generated notice path');fs.rmSync(target,{recursive:true,force:true});
}
const entries=[];
function collect(dir,label){if(!fs.existsSync(dir))return;const target=path.join(out,label.replace(/[^a-zA-Z0-9_.-]/g,'_'));let copied=0;
 for(const f of fs.readdirSync(dir,{withFileTypes:true}))if(f.isFile()&&/^(licen[sc]e|copying|notice|authors)([._-]|$)/i.test(f.name)){fs.mkdirSync(target,{recursive:true});fs.copyFileSync(path.join(dir,f.name),path.join(target,f.name));copied++;}
 if(copied)entries.push(label);
}
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json')));
for(const [relative,p]of Object.entries(lock.packages??{}))if(relative.startsWith('node_modules/')&&!p.dev){const dir=path.join(root,relative),file=path.join(dir,'package.json');if(fs.existsSync(file)){const installed=JSON.parse(fs.readFileSync(file));collect(dir,`npm-${installed.name}-${installed.version}`);}}
for(const project of ['firmware','firmware-dcsbios']){
 const deps=path.join(root,project,'.pio/libdeps',project==='firmware'?'esp32c3supermini':'nano-panel');
 const used=project==='firmware'?['ArduinoJson','Adafruit BusIO','Adafruit GFX Library','Adafruit SSD1306','Adafruit NeoPixel']:['DCS-BIOS','U8g2'];
 if(fs.existsSync(deps))for(const f of fs.readdirSync(deps,{withFileTypes:true}))if(f.isDirectory()&&used.some(name=>f.name.startsWith(name)))collect(path.join(deps,f.name),`${project}-${f.name}`);
}
for(const p of ['framework-arduino-avr','framework-arduinoespressif32'])collect(path.join(os.homedir(),'.platformio/packages',p),p);
fs.writeFileSync(path.join(out,'README.md'),'# Bundled dependency license texts\n\nGenerated from production npm dependencies and the firmware libraries/cores used by packaged images. Uploader notices are retained separately. Electron/Chromium notices also accompany their runtime in the installer. Development tools installed only to build the app are not copied here. Preserve upstream attribution.\n\n'+entries.sort().map(e=>'- '+e).join('\n')+'\n');
console.log(`Collected notices from ${entries.length} dependency directories.`);
