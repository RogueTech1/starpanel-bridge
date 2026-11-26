import test from 'node:test';
import assert from 'node:assert/strict';
import {privacyIssues} from '../src/public-audit.mjs';
import {intelHex} from '../src/avr.mjs';
test('public audit identifies personal paths and credentials without including their values',()=>{
 const home='C:/Users/'+'SomeonePrivate/project/file.cpp',secret='gh'+'p_'+'A'.repeat(32);
 const issues=privacyIssues(Buffer.from(home+'\n'+secret),'src/example.mjs');
 assert.ok(issues.includes('personal Windows home path'));assert.ok(issues.includes('provider credential pattern'));assert.doesNotMatch(JSON.stringify(issues),/SomeonePrivate|AAAA/);
 assert.ok(privacyIssues(Buffer.from(intelHex(Buffer.from(home))),'firmware.hex').includes('personal Windows home path'));
});
test('public audit preserves legal attribution and recognizes portable build paths',()=>{
 assert.deepEqual(privacyIssues(Buffer.from('/build/home/.platformio/core.cpp'),'firmware.bin'),[]);
 assert.deepEqual(privacyIssues(Buffer.from('Upstream Author <author@upstream.invalid>'),'licenses/component/LICENSE'),[]);
 assert.deepEqual(privacyIssues(Buffer.from('user@example.com'),'docs/example.md'),[]);
 assert.ok(privacyIssues(Buffer.from('{}'),'validation/private.json').includes('private/generated path'));
});
