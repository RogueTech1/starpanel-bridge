// Collect the dependency source used to build the distributed firmware.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'release/firmware-sources');
if(fs.existsSync(out)){
 const real=fs.realpathSync(out),relative=path.relative(fs.realpathSync(root),real);
 if(fs.lstatSync(out).isSymbolicLink()||relative!==path.join('release','firmware-sources'))throw Error('Unexpected source-collection directory');
 fs.rmSync(real,{recursive:true,force:true});
}fs.mkdirSync(out,{recursive:true});
const omitted=new Set(['.git','.github','examples','tests','test','docs','doc','images']);
const copy=(source,target)=>{if(fs.existsSync(source))fs.cpSync(source,target,{recursive:true,filter:p=>!p.split(path.sep).some(part=>omitted.has(part.toLowerCase()))&&!p.endsWith('.DS_Store')});};
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
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
fs.writeFileSync(path.join(out,'README.txt'),`StarPanel Bridge ${version} firmware dependency sources\n\nProject source and build instructions: https://github.com/RogueTech1/starpanel-bridge/tree/v${version}\n\nIncludes runtime library/core sources and uploader source archives, with legal notices. Unused upstream examples/tests/docs are omitted to avoid distributing example credentials. The DCSBIOSKit source includes the documented duplicate-definition patch. SDK/compiler packages are fetched at the versions pinned by PlatformIO. Original application source is MIT licensed and can be rebuilt/relinked with modified libraries. Preserve third-party notices.\n`);
console.log('Collected firmware/library sources in release/firmware-sources.');
