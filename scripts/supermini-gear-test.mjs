// Local hardware acceptance test. --flash explicitly replaces the board firmware.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {SerialPort} from 'serialport';
import {flashFirmware} from '../src/flasher.mjs';
import {compileProfile,validateProfile} from '../src/profiles.mjs';
import {catalog} from '../src/catalog.mjs';
import {Game,loadSchema} from '../src/game.mjs';
import {Bridge} from '../src/bridge.mjs';
const root=path.resolve(import.meta.dirname,'..'),port=process.env.STARPANEL_TEST_PORT??'COM3';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const prefix='VEHICLE_COMPONENT_DEPLOYMENT_STATE_';
const profile={id:'c3gear01',name:'Super Mini gear lamp',board:'esp32c3supermini',components:[{id:'gear01',kind:'led',label:'Landing gear',pin:3,count:7,path:'vehicle.state.flight.state.gear',match:prefix+'DEPLOYED',rules:[
 {operator:'equals',match:prefix+'DEPLOYED',effect:'pulse',color:'#ff0000',brightness:64,periodMs:2400},
 {operator:'contains',match:'ING',effect:'blink',color:'#ffff00',brightness:64,periodMs:2000},
 {operator:'equals',match:prefix+'RETRACTED',effect:'solid',color:'#00ff00',brightness:64,periodMs:2400}
]}]};
const info=(await SerialPort.list()).find(p=>p.path===port);if(!info)throw Error(`${port} is not connected`);
if(info.vendorId!=='303A')throw Error('Expected Espressif native USB device');
if(process.argv.includes('--flash')){await flashFirmware({info,root:path.join(root,'firmware-images'),profile:'esp32c3supermini',progress:console.log});await sleep(2500);}
const schema=loadSchema(path.join(root,'schema/live/sc_extrait.desc'));validateProfile(profile,new Set(catalog(schema).map(f=>f.path)));
const config={buttons:{},fields:{}},compiled=compileProfile(profile,config);
const bridge=new Bridge({config:compiled.config,game:new Game(schema)});bridge.on('log',l=>console.log(l.message));bridge.start();bridge.attach(port);
try{
 await sleep(2000);const ack=await bridge.program(port,{...compiled.device,transport:'usb'});console.log(ack.message);
 const device=bridge.devices.get(port);let buffer='';const reports=[];
 device.port.on('data',bytes=>{buffer+=bytes.toString();let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);try{const p=JSON.parse(line);if(p.type==='device_info')reports.push(p);}catch{}}});
 const identify=async()=>{const before=reports.length;device.port.write('{"v":1,"type":"identify"}\n');for(let i=0;i<20&&reports.length===before;i++)await sleep(50);if(reports.length===before)throw Error('No board identity response');return reports.at(-1);};
 const result={port,profile,checks:[]};
 // Briefly pause host publishing and use explicit simulator frames to verify all branches on the real board.
 clearInterval(bridge.publishTimer);
 for(const [state,index]of [['DEPLOYED',0],['RETRACTING',1],['DEPLOYING',1],['RETRACTED',2]]){
  const values=Object.fromEntries(Object.keys(compiled.config.fields).map(k=>[k,prefix+state]));device.port.write(JSON.stringify({v:1,type:'telemetry',session:'hardware-test',seq:1,source:'demo',connected:true,stale:false,values})+'\n');await sleep(150);const status=await identify();result.checks.push({state,status});if(status.activeRule!==index)throw Error(`LED branch failed for ${state}`);
 }
 device.port.write(JSON.stringify({v:1,type:'telemetry',session:'hardware-test',seq:2,source:'demo',connected:false,stale:true,values:{}})+'\n');await sleep(100);const stale=await identify();if(stale.fresh)throw Error('Stale telemetry was accepted');result.stale=stale;
 for(let i=0;i<20&&bridge.panel.received===null;i++)await sleep(200);
 for(let i=0;i<5;i++){device.port.write(JSON.stringify(bridge.panel.packet())+'\n');await sleep(200);}
 result.live=await identify();result.livePacket=bridge.panel.packet();
 if(result.livePacket.stale)throw Error('No fresh game telemetry');
 fs.mkdirSync(path.join(root,'validation'),{recursive:true});fs.writeFileSync(path.join(root,'validation/supermini-hardware.json'),JSON.stringify(result,null,2));
 const user=path.join(os.homedir(),'AppData/Roaming/StarCitizenHardwareBridge');fs.mkdirSync(user,{recursive:true});
 const configFile=path.join(user,'panel.json'),old=JSON.parse(fs.readFileSync(configFile));fs.writeFileSync(configFile,JSON.stringify(compileProfile(profile,old).config,null,2));
 const panelsFile=path.join(user,'panels.json');let panels=[];try{panels=JSON.parse(fs.readFileSync(panelsFile));}catch{}panels=panels.filter(p=>p.id!==profile.id);panels.push(profile);fs.writeFileSync(panelsFile,JSON.stringify(panels,null,2));
 const settingsFile=path.join(user,'settings.json'),settings=JSON.parse(fs.readFileSync(settingsFile));settings.demo=false;settings.ports=(settings.ports??[]).filter(p=>(typeof p==='string'?p:p.path)!==port);settings.ports.push({path:port,protocol:'json'});settings.networkEnabled=true;fs.writeFileSync(settingsFile,JSON.stringify(settings,null,2));
 console.log(JSON.stringify({ok:true,live:result.live,gear:Object.values(result.livePacket.values)[0],checks:result.checks.map(c=>c.state)},null,2));
}finally{bridge.stop();}
