import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {fileURLToPath} from 'node:url';
import {flashMaster,MASTER_TARGET,AVR_TARGETS,eepromProfile} from '../src/avr.mjs';
import {DcsBiosPanel,BIOS_MAP} from '../src/dcsbios.mjs';
import {Panel} from '../src/panel.mjs';
test('master upload uses its own verified image, MCU signature checks and no slave EEPROM',async()=>{
 const requests=[],root=fileURLToPath(new URL('../firmware-images/',import.meta.url));
 const launch=(file,args,options)=>{requests.push({file,args,options});const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{};queueMicrotask(()=>child.emit('exit',0));return child;};
 await assert.rejects(flashMaster({root,tools:'TOOLS',port:'MASTER',confirmed:false},launch),/Confirm/);assert.equal(requests.length,0);
 await flashMaster({root,tools:'TOOLS',port:'MASTER',confirmed:true},launch);
 const {args,options}=requests[0];assert.equal(options.shell,false);assert.ok(args.includes('atmega2560'));assert.ok(args.some(a=>a.includes(MASTER_TARGET.image)));assert.ok(!args.some(a=>a.includes('eeprom:')));assert.ok(!args.includes('-F'));assert.equal(AVR_TARGETS['dcsbioskit-master'],undefined);
});
test('master transport broadcasts fixed telemetry addresses and maps two distinct slave input aliases',async t=>{
 let now=1000;const actions=[];
 const config={fields:{renamed_speed:'vehicle.state.flight.instruments.speed'},buttons:{left:'v_left',right:'v_right'},legacyInputs:{SC_LEFT_1:'left',SC_RIGHT_2:'right'}};
 const panel=new Panel({config,game:{call:async(_method,args)=>{actions.push(args.action_name);return {status:'TRIGGER_GAME_ACTION_STATUS_OK'};}},allowActions:true,now:()=>now});panel.actions=new Set(['v_left','v_right']);
 panel.update({vehicle:{state:{flight:{instruments:{speed:42,altitude:3.4028234663852886e38},state:{gear:'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED'}}}}});
 const frames=[];
 class Port extends EventEmitter{open(cb){this.isOpen=true;cb();}write(bytes,cb){frames.push(Buffer.from(bytes));cb();}drain(cb){cb();}close(){this.isOpen=false;this.emit('close');}}
 const master=new DcsBiosPanel({panel,running:true,log(){}},'MASTER',Port);t.after(()=>master.stop());master.send(panel.packet());
 const memory=new Map();for(let i=4;i<frames[0].length;){const address=frames[0].readUInt16LE(i),n=frames[0].readUInt16LE(i+2);memory.set(address,frames[0].subarray(i+4,i+4+n));i+=4+n;}
 assert.equal(memory.get(BIOS_MAP.speed).toString().replaceAll('\0',''),'42');assert.equal(memory.get(BIOS_MAP.altitude).toString().replaceAll('\0',''),'--');assert.ok(memory.has(0xfffe));
 master.port.emit('data',Buffer.from('SC_LEFT_1 1\n'));await new Promise(r=>setImmediate(r));now+=201;master.port.emit('data',Buffer.from('SC_RIGHT_2 1\n'));await new Promise(r=>setImmediate(r));assert.deepEqual(actions,['v_left','v_right']);
});
test('slave EEPROM address and unique command name are configured independently of master image',()=>{
 const p={id:'dcsmega1',name:'Slave',board:'mega',address:7,components:[{id:'gear01',kind:'button',label:'Gear',pin:8,action:'key_G'}]};
 const bytes=eepromProfile(p);assert.equal(bytes[4],7);assert.match(bytes.toString('ascii',9,33),/^SC_DCSMEGA1_GEAR01/);
});
