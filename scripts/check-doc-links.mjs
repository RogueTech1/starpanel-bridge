import fs from 'node:fs';
import path from 'node:path';
import {headingAnchors} from '../src/markdown-links.mjs';
const root=path.resolve(import.meta.dirname,'..'),files=[];
function walk(dir,recursive){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,f.name);if(f.isDirectory()&&recursive)walk(file,true);else if(f.isFile()&&f.name.endsWith('.md'))files.push(file);}}
walk(root,false);for(const dir of ['docs','skills','data'])walk(path.join(root,dir),true);
const errors=[],anchorCache=new Map();for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/\]\(([^)]+)\)/g)){
 const target=m[1];if(/^(https?:|mailto:)/.test(target))continue;
 try{const [local,fragment]=target.split('#'),resolved=local?path.resolve(path.dirname(file),decodeURIComponent(local)):file;
  if(!fs.existsSync(resolved)){errors.push(`${path.relative(root,file)} -> missing ${target}`);continue;}
  if(fragment&&resolved.endsWith('.md')){if(!anchorCache.has(resolved))anchorCache.set(resolved,headingAnchors(fs.readFileSync(resolved,'utf8')));if(!anchorCache.get(resolved).has(decodeURIComponent(fragment)))errors.push(`${path.relative(root,file)} -> missing heading ${target}`);}
 }catch(e){errors.push(`${path.relative(root,file)} -> ${target}: ${e.message}`);}
}}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Local documentation links valid across ${files.length} Markdown files.`);
