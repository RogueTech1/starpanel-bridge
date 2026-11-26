// Collect the dependency source used to build the distributed firmware.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'release/firmware-sources');fs.mkdirSync(out,{recursive:true});
const copy=(source,target)=>{if(fs.existsSync(source))fs.cpSync(source,target,{recursive:true,filter:p=>!p.split(path.sep).includes('.git')&&!p.endsWith('.DS_Store')});};
for(const project of ['firmware','firmware-dcsbios']){
 const target=path.join(out,project);fs.mkdirSync(target,{recursive:true});
 for(const item of ['src','platformio.ini','patch_vendor.py','portable_paths.py'])copy(path.join(root,project,item),path.join(target,item));
 const env=project==='firmware'?'esp32c3supermini':'nano-panel';copy(path.join(root,project,'.pio/libdeps',env),path.join(target,'dependency-source'));
}
for(const name of ['framework-arduino-avr','framework-arduinoespressif32']){
 const source=path.join(os.homedir(),'.platformio/packages',name),target=path.join(out,name);fs.mkdirSync(target,{recursive:true});
 for(const item of ['cores','variants','libraries','package.json','boards.txt','platform.txt','programmers.txt'])copy(path.join(source,item),path.join(target,item));
 for(const item of fs.readdirSync(source))if(/^(license|copying|notice)/i.test(item))copy(path.join(source,item),path.join(target,item));
 if(name==='framework-arduinoespressif32')copy(path.join(source,'tools/partitions'),path.join(target,'tools/partitions'));
}
copy(path.join(root,'licenses'),path.join(out,'licenses'));copy(path.join(root,'release/upstream-sources'),path.join(out,'uploader-source-archives'));
fs.writeFileSync(path.join(out,'README.txt'),'StarPanel Bridge 0.5.0 firmware dependency sources\n\nProject source and complete build instructions: https://github.com/RogueTech1/starpanel-bridge/tree/v0.5.0\n\nIncludes selected PlatformIO dependency source, Arduino cores/libraries and uploader upstream source archives. The DCSBIOSKit dependency includes the documented duplicate-definition patch; patch_vendor.py is provided. SDK/compiler packages not copied here are fetched at versions pinned by PlatformIO. Original StarPanel application source is MIT licensed and may be rebuilt/relinked with modified library versions. Preserve all applicable third-party notices.\n');
console.log('Collected firmware/library sources in release/firmware-sources.');
