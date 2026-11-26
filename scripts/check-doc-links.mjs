import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),files=[];
for(const dir of ['', 'docs','skills/starpanel-bridge'])for(const f of fs.readdirSync(path.join(root,dir),{withFileTypes:true}))if(f.isFile()&&f.name.endsWith('.md'))files.push(path.join(root,dir,f.name));
const errors=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/\]\(([^)]+)\)/g)){const target=m[1];if(/^(https?:|#|mailto:)/.test(target))continue;const local=target.split('#')[0];if(!fs.existsSync(path.resolve(path.dirname(file),decodeURIComponent(local))))errors.push(`${path.relative(root,file)} -> ${target}`);}}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Local documentation links valid across ${files.length} Markdown files.`);
