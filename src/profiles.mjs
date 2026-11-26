import {keyCodes} from './keyboard.mjs';
export const BOARDS = {
  esp32s3: {label: 'ESP32-S3 DevKitC-1', pins: [1,2,3,4,5,6,7,10,11,12,13,14,15,16,17,18,21,38,39,40,41,42,47,48], sda:8,scl:9},
  esp32: {label: 'ESP32 Dev Module', pins: [4,13,14,16,17,18,19,23,25,26,27,32,33], sda:21,scl:22},
  mega: {label:'DCSBIOSKit Mega / Mega shield',pins:[6,7,8,9,10,11,12,14,15,16,17,18,19,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53],sda:20,scl:21},
  nano: {label:'DCSBIOSKit Nano / Nano shield',pins:[3,6,7,8,9,10,11,12,14,15,16,17],sda:18,scl:19},
  esp32c3: {label:'ESP32-C3 DevKitM-1 (4 MB)',pins:[0,1,3,4,5,6,7,10],sda:8,scl:9}
};
BOARDS.esp32devkitc={...BOARDS.esp32,label:'ESP32 DevKitC V4 / WROOM-32 (4 MB)',firmware:'esp32'};
BOARDS.esp32doit={...BOARDS.esp32,label:'DOIT ESP32 DevKit V1 (4 MB)',firmware:'esp32'};
BOARDS.esp32c3supermini={label:'ESP32-C3 Super Mini · native USB (4 MB)',pins:[0,1,3,4,5,8,10],sda:6,scl:7};
BOARDS.esp32s3n16={...BOARDS.esp32s3,label:'ESP32-S3 DevKitC-1 N16 / N16R8 (16 MB)',firmware:'esp32s3'};
BOARDS.esp32s2mini={label:'LOLIN ESP32-S2 Mini (4 MB)',pins:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,21,34,36,37,38,39,40],sda:33,scl:35};
BOARDS['mega-usb']={label:'Arduino Mega 2560 · standalone USB',pins:Array.from({length:52},(_,i)=>i+2).filter(p=>p!==20&&p!==21),sda:20,scl:21};
BOARDS['nano-usb']={label:'Arduino Nano ATmega328P · standalone USB',pins:[2,3,4,5,6,7,8,9,10,11,12,14,15,16,17],sda:18,scl:19};
BOARDS['nano-old']={...BOARDS['nano-usb'],label:'Arduino Nano · old bootloader USB'};
BOARDS['uno-usb']={...BOARDS['nano-usb'],label:'Arduino Uno R3 · standalone USB'};
BOARDS['leonardo-usb']={label:'Arduino Leonardo · standalone USB',pins:[4,5,6,7,8,9,10,11,12,13,18,19,20,21],sda:2,scl:3};
BOARDS['micro-usb']={...BOARDS['leonardo-usb'],label:'Arduino Micro · standalone USB'};
BOARDS['promicro-usb']={...BOARDS['leonardo-usb'],label:'Pro Micro ATmega32U4 · 5V / 16 MHz USB',pins:[4,5,6,7,8,9,10,16,18,19,20,21]};
BOARDS.mega.label='DCSBIOSKit DCS-BIOS Mega Slave';
BOARDS.nano.label='DCSBIOSKit DCS-BIOS Nano Slave';
BOARDS.nano.pins=BOARDS.nano.pins.filter(pin=>pin!==6);
BOARDS['dcs-nano-shield']={...BOARDS.nano,label:'DCSBIOSKit Nano Shield + Arduino Nano',pins:[...BOARDS.nano.pins]};
BOARDS['dcs-mega-shield']={...BOARDS.mega,label:'DCSBIOSKit Mega Shield + Arduino Mega 2560',pins:[...BOARDS.mega.pins]};
const slaveBoards=['mega','nano','dcs-nano-shield','dcs-mega-shield'];
for(const [key,b]of Object.entries(BOARDS)){b.slave=slaveBoards.includes(key);b.avr=b.slave||['mega-usb','nano-usb','nano-old','uno-usb','leonardo-usb','micro-usb','promicro-usb'].includes(key);b.role=b.slave?'DCSBIOSKit slave':'Standalone panel';if(b.slave)b.notes='RS485 TX enable D2 is reserved. Backlight/revision-sensitive pins are excluded. Disconnect the powered bus before connecting the programmer. Verify PCB pin labels.';}
export const isAvr=board=>BOARDS[board]?.avr===true;
export const isSlave=board=>BOARDS[board]?.slave===true;
export function ensureUniqueSlaveAddress(profile,panels){
 if(isSlave(profile.board)&&panels.some(old=>old.id!==profile.id&&isSlave(old.board)&&(old.address??1)===(profile.address??1)))throw Error('Another saved slave uses this address. Choose a unique slave address.');
}
export const BIOS_OUTPUTS=['vehicle.state.flight.instruments.speed','vehicle.state.flight.instruments.altitude','vehicle.state.flight.state.gear','actor.vitals.oxygen.current'];
export function validateProfile(p, paths) {
  if (!p || !/^[a-z0-9]{8}$/.test(p.id) || typeof p.name !== 'string' || p.name.length > 32 || !BOARDS[p.board]) throw Error('Invalid panel identity or board');
  if (!Array.isArray(p.components) || p.components.length > 15) throw Error('Maximum 8 inputs, 6 readouts and 1 LED chain');
  if(isSlave(p.board)&&(!Number.isInteger(p.address??1)||(p.address??1)<1||(p.address??1)>126))throw Error('Slave address must be 1 through 126');
  const ids = new Set(), pins = new Set(); let buttons=0, readouts=0, leds=0;
  for (const c of p.components) {
    if (!/^[a-z0-9]{6}$/.test(c.id) || ids.has(c.id)) throw Error('Invalid or duplicate component ID'); ids.add(c.id);
    if (typeof c.label !== 'string' || c.label.length > 16) throw Error('Component label must be 16 characters or fewer');
    if (c.kind === 'button' || c.kind === 'switch') {
      if (++buttons > 8 || !BOARDS[p.board].pins.includes(c.pin) || pins.has(c.pin)) throw Error('Choose a unique supported GPIO for each button');
      if (typeof c.action !== 'string' || !/^[a-zA-Z0-9_]{1,80}$/.test(c.action)) throw Error('Choose a game action'); pins.add(c.pin);
      if(c.action.startsWith('key_'))keyCodes(c.action);
      if(c.kind==='switch'){
        if(!paths.has(c.path)||!['string','boolean','number'].includes(typeof c.onValue)||!['string','boolean','number'].includes(typeof c.offValue)||String(c.onValue)===String(c.offValue))throw Error('Choose feedback and two different ON/OFF values');
        if(typeof c.offAction!=='string'||!/^[a-zA-Z0-9_]{1,80}$/.test(c.offAction))throw Error('Choose the OFF action');
        if(c.offAction.startsWith('key_'))keyCodes(c.offAction);
      }
    } else if (c.kind === 'readout') {
      if (++readouts > 6 || !paths.has(c.path)) throw Error('Choose a known telemetry field');
      if(isAvr(p.board)&&!BIOS_OUTPUTS.includes(c.path))throw Error('Arduino readouts support speed, altitude, gear and oxygen');
    } else if(c.kind==='led'){
      if(++leds>1||isAvr(p.board)||!BOARDS[p.board].pins.includes(c.pin)||pins.has(c.pin)||!paths.has(c.path)||typeof c.match!=='string'||c.match.length>100)throw Error('Choose one WS2812 on a free GPIO and a known feedback field');
      if(!['equals','notEquals','greater','less','contains'].includes(c.operator??'equals')||!['pulse','blink','solid'].includes(c.effect??'pulse')||!/^#[a-fA-F0-9]{6}$/.test(c.color??'#ff0000')||!Number.isInteger(c.brightness??64)||(c.brightness??64)<1||(c.brightness??64)>255)throw Error('Invalid LED rule');
      if(['greater','less'].includes(c.operator)&&!Number.isFinite(Number(c.match)))throw Error('Threshold must be a number');
      if(c.rules!==undefined){
        if(!Array.isArray(c.rules)||c.rules.length<1||c.rules.length>4)throw Error('Use one through four LED rules');
        for(const r of c.rules){
          if(!r||typeof r.match!=='string'||r.match.length>100||!['equals','notEquals','contains','greater','less'].includes(r.operator??'equals')||!['pulse','blink','solid'].includes(r.effect??'solid')||!/^#[a-fA-F0-9]{6}$/.test(r.color??'#ff0000')||!Number.isInteger(r.brightness??64)||(r.brightness??64)<1||(r.brightness??64)>255||!Number.isInteger(r.periodMs??2400)||(r.periodMs??2400)<200||(r.periodMs??2400)>10000)throw Error('Invalid LED rule case');
          if(['greater','less'].includes(r.operator)&&!Number.isFinite(Number(r.match)))throw Error('Threshold must be numeric');
        }
      }
      pins.add(c.pin);
      if(!Number.isInteger(c.count??1)||(c.count??1)<1||(c.count??1)>64)throw Error('LED count must be 1 through 64');
    } else throw Error('Unsupported component');
  }
  return p;
}
export function compileProfile(p, config) {
  const prefix = `p${p.id}_`, next = structuredClone(config);
  if(isAvr(p.board))next.legacyInputs??={};
  if(next.legacyInputs)for(const [name,alias]of Object.entries(next.legacyInputs))if(alias.startsWith(prefix))delete next.legacyInputs[name];
  next.switches??={};
  for (const group of ['buttons','fields','switches']) for (const key of Object.keys(next[group])) if (key.startsWith(prefix)) delete next[group][key];
  const device = {name:p.name, board:BOARDS[p.board].firmware??p.board, buttons:[], readouts:[],leds:[]};
  for (const c of p.components) {
    const alias=prefix+c.id;
    if (c.kind==='button'||c.kind==='switch') {next.buttons[alias]=c.action;device.buttons.push({name:alias,pin:c.pin,maintained:c.kind==='switch'});if(isAvr(p.board))next.legacyInputs[`SC_${p.id}_${c.id}`.toUpperCase()]=alias;
      if(c.kind==='switch')next.switches[alias]={path:c.path,onValue:c.onValue,offValue:c.offValue,onAction:c.action,offAction:c.offAction};
    }
    else if(c.kind==='led'){next.fields[alias]=c.path;device.leds.push({field:alias,pin:c.pin,count:c.count??1,match:c.match,operator:c.operator??'equals',effect:c.effect??'pulse',color:c.color??'#ff0000',brightness:c.brightness??64,...(c.rules?{rules:c.rules}:{})});}
    else {next.fields[alias]=c.path;device.readouts.push({field:alias,label:c.label});}
  }
  if (Object.keys(next.fields).length>32 || Object.keys(next.buttons).length>32) throw Error('The bridge currently supports 32 field and 32 button mappings');
  return {config:next, device};
}
