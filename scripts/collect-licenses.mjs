import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'licenses');fs.mkdirSync(out,{recursive:true});
const entries=[];
function collect(dir,label){if(!fs.existsSync(dir))return;const target=path.join(out,label.replace(/[^a-zA-Z0-9_.-]/g,'_'));let copied=0;
 for(const f of fs.readdirSync(dir,{withFileTypes:true}))if(f.isFile()&&/^(licen[sc]e|copying|notice|authors)([._-]|$)/i.test(f.name)){fs.mkdirSync(target,{recursive:true});fs.copyFileSync(path.join(dir,f.name),path.join(target,f.name));copied++;}
 if(copied)entries.push(label);
}
function modules(dir){if(!fs.existsSync(dir))return;for(const f of fs.readdirSync(dir,{withFileTypes:true})){if(!f.isDirectory()||f.name.startsWith('.'))continue;const child=path.join(dir,f.name);if(f.name.startsWith('@')){modules(child);continue;}const file=path.join(child,'package.json');if(fs.existsSync(file)){const p=JSON.parse(fs.readFileSync(file));collect(child,`npm-${p.name}-${p.version}`);}modules(path.join(child,'node_modules'));}}
modules(path.join(root,'node_modules'));
for(const project of ['firmware','firmware-dcsbios']){
 const deps=path.join(root,project,'.pio/libdeps',project==='firmware'?'esp32c3supermini':'nano-panel');
 if(fs.existsSync(deps))for(const f of fs.readdirSync(deps,{withFileTypes:true}))if(f.isDirectory())collect(path.join(deps,f.name),`${project}-${f.name}`);
}
for(const p of ['framework-arduino-avr','framework-arduinoespressif32'])collect(path.join(os.homedir(),'.platformio/packages',p),p);
fs.writeFileSync(path.join(out,'README.md'),'# Collected third-party license texts\n\nGenerated from installed build dependencies. Includes development tools as well as runtime libraries; inclusion here does not mean each library is shipped in the app. See the root notices for component roles.\n\n'+entries.sort().map(e=>'- '+e).join('\n')+'\n');
console.log(`Collected notices from ${entries.length} dependency directories.`);
