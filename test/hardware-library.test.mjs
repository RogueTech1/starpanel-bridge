import test from 'node:test';
import assert from 'node:assert/strict';
import {DCSBIOSKIT_PRODUCTS,hardwareLibrary} from '../src/hardware-library.mjs';
import {BOARDS,validateProfile,ensureUniqueSlaveAddress,isSlave} from '../src/profiles.mjs';
import {AVR_TARGETS,eepromProfile} from '../src/avr.mjs';
test('vendor library distinguishes programmable slaves from master, passive and custom hardware',()=>{
 assert.equal(DCSBIOSKIT_PRODUCTS.length,16);assert.equal(new Set(hardwareLibrary().map(p=>p.id)).size,hardwareLibrary().length);
 for(const item of DCSBIOSKIT_PRODUCTS){assert.equal(new URL(item.url).hostname,'dcsbioskit.com');if(item.profile)assert.ok(BOARDS[item.profile]&&isSlave(item.profile));else assert.equal(AVR_TARGETS[item.id],undefined);}
 assert.equal(DCSBIOSKIT_PRODUCTS.find(p=>p.id==='devkit').controllers.length,3);
 assert.equal(DCSBIOSKIT_PRODUCTS.find(p=>p.id==='falcondcc').profile,undefined);
});
test('shield profiles reuse verified slave images and reserve bus/backlight pins',()=>{
 for(const [board,base]of [['dcs-nano-shield','nano'],['dcs-mega-shield','mega']]){
  assert.equal(AVR_TARGETS[board].image,AVR_TARGETS[base].image);
  for(const pin of [0,1,2,4,5,13])assert.ok(!BOARDS[board].pins.includes(pin));
  const profile={id:'1234abcd',board,name:'Shield',address:12,components:[{id:'abc123',kind:'button',label:'Gear',pin:7,action:'key_G'}]};
  validateProfile(profile,new Set());assert.equal(eepromProfile(profile)[4],12);
  assert.throws(()=>validateProfile({...profile,address:127},new Set()),/address/);
  assert.throws(()=>validateProfile({...profile,components:[{...profile.components[0],pin:2}]},new Set()),/GPIO/);
  assert.throws(()=>ensureUniqueSlaveAddress(profile,[{id:'different',board:base,address:12}]),/unique/);
  ensureUniqueSlaveAddress(profile,[{id:'different',board:'mega-usb',address:12}]);
 }
 assert.ok(!BOARDS['dcs-nano-shield'].pins.includes(6));
});
