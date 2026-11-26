import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Panel} from '../src/panel.mjs';
import {apiOnlyConfig,assertApiAction} from '../src/api-only.mjs';
import {validateProfile} from '../src/profiles.mjs';
test('legacy inputs are disabled without rewriting the original configuration or losing outputs',()=>{
 const original={fields:{speed:'vehicle.state.flight.instruments.speed'},buttons:{old:'key_U',api:'v_lights'},switches:{old:{onAction:'key_U',offAction:'key_U'}},legacyInputs:{SC_OLD:'old',SC_API:'api'}};
 const migrated=apiOnlyConfig(original);assert.deepEqual(migrated.disabled,['old']);assert.equal(migrated.config.buttons.api,'v_lights');assert.equal(migrated.config.fields.speed,original.fields.speed);assert.equal(migrated.config.legacyInputs.SC_OLD,undefined);assert.equal(original.buttons.old,'key_U');
});
test('no keyboard mapping can execute even when advertised or a helper is injected',async()=>{
 for(const demo of [false,true]){
  let calls=0;const panel=new Panel({config:{buttons:{},fields:{}},game:{call:async()=>{calls++;}},keyboard:{press:async()=>{calls++;}},demo,allowActions:true});panel.actions.add('key_G');
  const result=await panel.perform('key_G',(ok,message)=>({ok,message}));assert.equal(result.ok,false);assert.match(result.message,/API-only/);assert.equal(calls,0);
 }
 for(const value of ['key_G','KEY_U','key_CTRL_ALT_G'])assert.throws(()=>assertApiAction(value),/API/);
 assert.throws(()=>validateProfile({id:'1234abcd',name:'Legacy',board:'esp32c3supermini',components:[{id:'abc123',kind:'button',label:'Old',pin:3,action:'key_G'}]},new Set()),/API/);
});
test('emulation implementation and installer helper are absent',()=>{
 for(const file of ['src/keyboard.mjs','native/Keyboard.cs','scripts/build-native.ps1'])assert.equal(fs.existsSync(file),false,file);
 assert.doesNotMatch(fs.readFileSync('electron-builder.yml','utf8'),/StarPanelKeyboard|native\//);
});
