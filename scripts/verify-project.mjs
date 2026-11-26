import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const run=args=>{const r=spawnSync(process.execPath,args,{stdio:'inherit',shell:false});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);};
const tests=fs.readdirSync('test').filter(f=>f.endsWith('.test.mjs')).map(f=>'test/'+f);
run(['--test',...tests]);
for(const file of ['check-doc-links.mjs','verify-images.mjs'])run(['scripts/'+file]);
run(['scripts/data-manifest.mjs','--check']);
for(const file of fs.readdirSync('examples').filter(f=>f.endsWith('.starpanel.json')))run(['scripts/validate-design.mjs','examples/'+file]);
