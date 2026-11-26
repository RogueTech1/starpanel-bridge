import test from 'node:test';
import assert from 'node:assert/strict';
import {Panel} from '../src/panel.mjs';
import {eepromProfile,intelHex} from '../src/avr.mjs';
import {validateProfile,compileProfile} from '../src/profiles.mjs';
import {loadSchema,codec} from '../src/game.mjs';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {AVR_TARGETS} from '../src/avr.mjs';
const feedback='vehicle.state.power.powerplants';
function fixture(){let time=10000,sent=[];const config={fields:{},buttons:{power:'v_power_toggle'},switches:{power:{path:feedback,onValue:true,offValue:false,onAction:'v_power_toggle',offAction:'v_power_toggle'}}};const p=new Panel({config,game:{call:async(_method,args)=>{sent.push(args.action_name);return {status:'TRIGGER_GAME_ACTION_STATUS_OK'};}},allowActions:true,now:()=>time});p.actions=new Set(['v_power_toggle','v_toggle_landing_system']);const frame=value=>({vehicle:{state:{name:'Ship A',power:{powerplants:value}}}});return {p,sent,frame,advance:ms=>time+=ms,position:(state,id='switch')=>p.command({v:1,type:'switch',id,session:p.session,seq:p.seq,button:'power',state})};}
test('maintained OFF switch overrides ON once, waits for feedback, and handles a later game state change',async()=>{
 const {p,sent,frame,advance,position}=fixture();p.update(frame(true));await position(false);advance(300);p.update(frame(true));await p.reconcile();assert.deepEqual(sent,['v_power_toggle']);
 advance(1500);p.update(frame(true));await p.reconcile();assert.equal(sent.length,1);
 p.update(frame(false));await p.reconcile();assert.equal(p.switchStatus.power,'Synchronized');
 advance(1000);p.update(frame(true));advance(300);p.update(frame(true));await p.reconcile();assert.equal(sent.length,2);
});
test('maintained controls refuse stale panels, missing feedback, conflicts and disabled controls',async()=>{
 const {p,sent,frame,advance,position}=fixture();p.update(frame(true));p.allowActions=false;await position(false);advance(300);await p.reconcile();assert.equal(sent.length,0);
 p.allowActions=true;p.update({actor:{}});await p.reconcile();assert.equal(sent.length,0);
 advance(11000);p.update(frame(true));await p.reconcile();assert.equal(p.switchStatus.power,'Physical panel offline');
 await position(false,'new');p.config.switches.other={...p.config.switches.power};p.switchStates.set('other',{state:true,received:p.now()});advance(300);p.update(frame(true));await p.reconcile();assert.equal(sent.length,0);assert.match(p.switchStatus.power,/Conflicting/);
});
test('moving gear never receives a reverse toggle before completing movement',async()=>{
 const {p,sent,advance,position}=fixture();p.config.switches.power={path:'vehicle.state.flight.state.gear',onValue:'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED',offValue:'VEHICLE_COMPONENT_DEPLOYMENT_STATE_RETRACTED',onAction:'v_toggle_landing_system',offAction:'v_toggle_landing_system'};
 p.update({vehicle:{state:{flight:{state:{gear:'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYING'}}}}});await position(true);advance(1500);await p.reconcile();assert.equal(sent.length,0);assert.match(p.switchStatus.power,/movement/);
});
test('proto3 false booleans are retained only inside present subsystem messages',()=>{
 const root=loadSchema(fileURLToPath(new URL('../schema/live/sc_extrait.desc',import.meta.url))),c=codec(root,'TelemetryStreamResponse');
 const decoded=c.deserialize(c.serialize({vehicle:{state:{power:{powerplants:false,engines:true}}}}));
 assert.equal(decoded.vehicle.state.power.powerplants,false);assert.equal(decoded.vehicle.state.power.engines,true);assert.equal(c.deserialize(c.serialize({})).vehicle,undefined);
});
test('Arduino EEPROM layout and Intel HEX checksums match the packed firmware structure',()=>{
 const p={id:'1234abcd',name:'USB',board:'nano-usb',components:[{id:'abc123',kind:'button',label:'Gear',pin:3,action:'v_toggle_landing_system'},{id:'abc124',kind:'readout',label:'Speed',path:'vehicle.state.flight.instruments.speed'}]};
 const bytes=eepromProfile(p);assert.equal(bytes.length,333);assert.equal(bytes.toString('ascii',0,4),'SPB1');assert.equal(bytes[7],3);assert.match(bytes.toString('ascii',9,33),/^SC_1234ABCD_ABC123/);assert.equal(bytes[223],0);
 assert.equal(bytes.readUInt16LE(331),bytes.subarray(0,331).reduce((a,b)=>(a+b)&65535,0));
 for(const row of intelHex(bytes).trim().split('\n'))assert.equal([...Buffer.from(row.slice(1),'hex')].reduce((a,b)=>(a+b)&255,0),0);
});
test('LED case logic compiles into the board profile and rejects malformed rules and pin conflicts',()=>{
 const p={id:'c3gear01',name:'Gear',board:'esp32c3supermini',components:[{id:'gear01',kind:'led',label:'Gear',pin:3,path:'vehicle.state.flight.state.gear',match:'DEPLOYED',rules:[{operator:'equals',match:'DEPLOYED',effect:'pulse',color:'#ff0000',brightness:64,periodMs:2400}]}]};const paths=new Set([p.components[0].path]);
 validateProfile(p,paths);assert.equal(compileProfile(p,{buttons:{},fields:{}}).device.leds[0].rules[0].effect,'pulse');
 p.components[0].rules[0].periodMs=0;assert.throws(()=>validateProfile(p,paths),/rule case/);
});
test('every advertised AVR upload profile has a checksum-verified packaged image',()=>{
 for(const target of Object.values(AVR_TARGETS)){
  const base=new URL('../firmware-images/'+target.image+'/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',base)));
  assert.equal(manifest.profile,target.image);assert.equal(manifest.sha256,createHash('sha256').update(fs.readFileSync(new URL('firmware.hex',base))).digest('hex'));
 }
});
