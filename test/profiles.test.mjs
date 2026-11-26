import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {validateProfile,compileProfile} from '../src/profiles.mjs';
import {flashFirmware,loadFirmware,NativeSerial} from '../src/flasher.mjs';
import {Bridge} from '../src/bridge.mjs';
import {generateSketch} from '../src/sketch.mjs';
// fileURLToPath also handles workspace spaces on Windows.
import {fileURLToPath} from 'node:url';
const images=fileURLToPath(new URL('../firmware-images/',import.meta.url));
const p={id:'1234abcd',name:'Flight',board:'esp32s3',components:[{id:'abc123',kind:'button',label:'Gear',pin:4,action:'v_deploy_landing_system'},{id:'abc124',kind:'readout',label:'Speed',path:'vehicle.state.flight.instruments.speed'}]};
const paths=new Set(['vehicle.state.flight.instruments.speed']);
test('panel compiler creates matching host/device aliases and rejects reserved or duplicate pins',()=>{
  validateProfile(p,paths);const {config,device}=compileProfile(p,{buttons:{lights:'v_lights'},fields:{old:'a'}});
  assert.equal(config.buttons[device.buttons[0].name],'v_deploy_landing_system');
  assert.equal(config.fields[device.readouts[0].field],p.components[1].path);
  assert.equal(config.buttons.lights,'v_lights');assert.equal(device.board,'esp32s3');
  const bad=structuredClone(p);bad.components[0].pin=19;assert.throws(()=>validateProfile(bad,paths),/GPIO/);
  bad.components[0].pin=4;bad.components.push({...bad.components[0],id:'abcdef'});assert.throws(()=>validateProfile(bad,paths),/GPIO/);
});
test('Arduino sketch uses selected button pin, private command and matching host map',()=>{
  const design={...structuredClone(p),board:'mega'};design.components[0].pin=8;
  validateProfile(design,paths);const sketch=generateSketch(design),compiled=compileProfile(design,{buttons:{},fields:{}});
  assert.match(sketch,/SC_1234ABCD_ABC123/);assert.match(sketch,/\"1\",8/);
  assert.equal(compiled.config.legacyInputs.SC_1234ABCD_ABC123,'p1234abcd_abc123');
  assert.match(sketch,/0x5010/);design.components[1].path='unsupported';assert.throws(()=>generateSketch(design),/prototype readouts/);
});
test('all packaged firmware manifests and binary hashes validate',()=>{
  for(const profile of ['esp32','esp32s3','esp32c3','esp32c3supermini','esp32s2mini','esp32-wifi','esp32s3-wifi','esp32c3-wifi'])assert.equal(loadFirmware(images,profile).files.length,4);
  assert.throws(()=>loadFirmware(images,'../../bad'),/Unsupported/);
});
test('firmware upload detects chip mismatch before writing flash, and cleans up transport',async()=>{
  let writes=0,closed=0;
  class Device{}
  class Transport{async disconnect(){closed++;}}
  class Loader{constructor(){this.chip={CHIP_NAME:'ESP32'};}async main(){}async detectFlashSize(){return '4MB';}flashSizeBytes(){return 4*1024*1024;}async writeFlash(){writes++;}async after(){}}
  await assert.rejects(flashFirmware({info:{},root:images,profile:'esp32s3'},{Device,Transport,Loader}),/Nothing flashed/);
  assert.equal(writes,0);assert.equal(closed,1);
  await flashFirmware({info:{},root:images,profile:'esp32'},{Device,Transport,Loader});
  assert.equal(writes,1);assert.equal(closed,2);
});
test('native serial facade transfers bytes and modem signals with mock driver',async()=>{
  class Port extends EventEmitter{
    open(cb){this.isOpen=true;cb();}write(data,cb){this.sent=Buffer.from(data);cb();}set(flags,cb){this.flags=flags;cb();}
    update(options,cb){this.options=options;cb();}close(cb){this.isOpen=false;this.emit('close');cb();}
  }
  const serial=new NativeSerial({path:'MOCK',vendorId:'303a',productId:'1001'},Port);await serial.open({baudRate:115200});
  const reader=serial.readable.getReader();serial.port.emit('data',Buffer.from([1,2]));assert.deepEqual([...(await reader.read()).value],[1,2]);
  const writer=serial.writable.getWriter();await writer.write(new Uint8Array([3,4]));writer.releaseLock();assert.deepEqual([...serial.port.sent],[3,4]);
  await serial.setSignals({dataTerminalReady:true,requestToSend:false});assert.deepEqual(serial.port.flags,{dtr:true,rts:false});
  await serial.setSignals({requestToSend:true});await serial.setSignals({dataTerminalReady:false});assert.deepEqual(serial.port.flags,{dtr:false,rts:true});
  await reader.cancel();reader.releaseLock();await serial.close();assert.equal(serial.readable,null);
});
test('programming a USB panel waits for a matching board acknowledgment',async t=>{
  class Port extends EventEmitter{
    open(cb){this.isOpen=true;queueMicrotask(cb);}close(){this.isOpen=false;this.emit('close');}
    drain(cb){queueMicrotask(cb);}write(data,cb){const packet=JSON.parse(data);queueMicrotask(()=>{cb();if(packet.type==='configure')this.emit('data',Buffer.from(JSON.stringify({v:1,type:'config_ack',id:packet.id,ok:true,message:'saved'})+'\n'));});}
  }
  const bridge=new Bridge({config:{buttons:{},fields:{}},game:{close(){}},demo:true,Serial:Port});t.after(()=>bridge.stop());bridge.start();bridge.attach('MOCK');
  await new Promise(resolve=>setImmediate(resolve));assert.equal((await bridge.program('MOCK',compileProfile(p,{buttons:{},fields:{}}).device)).ok,true);
});
