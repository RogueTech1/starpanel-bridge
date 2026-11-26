import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {SerialPort} from 'serialport';
import {BOARDS,BIOS_OUTPUTS,isAvr} from './profiles.mjs';
export const AVR_TARGETS={mega:{image:'mega-panel',part:'atmega2560',protocol:'wiring',baud:115200},nano:{image:'nano-panel',part:'atmega328p',protocol:'arduino',baud:115200},'mega-usb':{image:'mega-standalone',part:'atmega2560',protocol:'wiring',baud:115200},'nano-usb':{image:'nano-standalone',part:'atmega328p',protocol:'arduino',baud:115200},'nano-old':{image:'nano-standalone',part:'atmega328p',protocol:'arduino',baud:57600},'uno-usb':{image:'uno-standalone',part:'atmega328p',protocol:'arduino',baud:115200}};
for(const name of ['leonardo','micro','promicro'])AVR_TARGETS[name+'-usb']={image:name+'-standalone',part:'atmega32u4',protocol:'avr109',baud:57600,touch:true};
AVR_TARGETS['dcs-nano-shield']={...AVR_TARGETS.nano};
AVR_TARGETS['dcs-mega-shield']={...AVR_TARGETS.mega};
export const MASTER_TARGET=Object.freeze({image:'dcsbioskit-master',part:'atmega2560',protocol:'wiring',baud:115200});
function verifiedImage(root,target,role){
 const dir=path.join(root,target.image),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),image=path.join(dir,'firmware.hex');
 if(manifest.profile!==target.image||(role==='master'&&manifest.role!=='master')||createHash('sha256').update(fs.readFileSync(image)).digest('hex')!==manifest.sha256)throw Error('Arduino firmware checksum or role validation failed');
 return image;
}
export async function uploadAvr(tools,args,progress=()=>{},launch=spawn){
 await new Promise((resolve,reject)=>{const child=launch(path.join(tools,'avrdude.exe'),['-C',path.join(tools,'avrdude.conf'),...args],{windowsHide:true,shell:false});let tail='';const timer=setTimeout(()=>child.kill(),120000);const log=bytes=>{const message=bytes.toString();tail=(tail+message).slice(-2000);progress(message);};child.stdout.on('data',log);child.stderr.on('data',log);child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error(`Arduino upload failed (${code}). Check board, bootloader and COM port. ${tail}`));});});
}
export async function flashMaster({root,tools,port,confirmed=false,progress=()=>{}},launch=spawn){
 if(confirmed!==true)throw Error('Confirm programming the identified DCSBIOSKit Master Controller');
 const t=MASTER_TARGET,image=verifiedImage(root,t,'master');
 await uploadAvr(tools,['-p',t.part,'-c',t.protocol,'-P',port,'-b',String(t.baud),'-D','-U',`flash:w:${image}:i`],progress,launch);
 return {ok:true,message:'Master routing firmware uploaded and verified. Reconnect the master at 250000 baud; configure slaves separately with unique addresses.'};
}
async function bootloaderPort(port){
 const before=await SerialPort.list(),selected=before.find(p=>p.path===port);if(!selected)throw Error('Selected board disconnected');
 const serial=new SerialPort({path:port,baudRate:1200,autoOpen:false});await new Promise((r,j)=>serial.open(e=>e?j(e):r()));
 await new Promise((r,j)=>serial.set({dtr:false,rts:false},e=>e?j(e):r()));await new Promise(r=>serial.close(()=>r()));
 for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,250));const current=await SerialPort.list();
  const candidates=current.filter(p=>!before.some(old=>old.path===p.path)&&p.vendorId&&(p.vendorId===selected.vendorId||['2341','2A03','1B4F'].includes(p.vendorId.toUpperCase())));
  if(candidates.length===1)return candidates[0].path;if(candidates.length>1)throw Error('Several bootloader ports appeared; disconnect other programming boards and retry');
  if(i>=12&&current.some(p=>p.path===port))return port;
 }throw Error('Bootloader COM port did not appear after 1200-baud reset');
}
export function eepromProfile(p){
  if(!isAvr(p.board))throw Error('Select an Arduino board');
  const buttons=p.components.filter(c=>c.kind==='button'||c.kind==='switch'),readouts=p.components.filter(c=>c.kind==='readout');
  const data=Buffer.alloc(333); // packed Profile: 7 + 8*27 + 6*18 + 2
  data.write('SPB1');data[4]=p.address??1;data[5]=buttons.length;data[6]=readouts.length;
  if(buttons.length>8||readouts.length>6||data[4]<1||data[4]>126)throw Error('Invalid Arduino profile');
  buttons.forEach((c,i)=>{if(!BOARDS[p.board].pins.includes(c.pin))throw Error('Invalid Arduino pin');const off=7+i*27;data[off]=c.pin;data[off+1]=Number(c.kind==='switch');data.write(`SC_${p.id}_${c.id}`.toUpperCase(),off+2,24,'ascii');});
  readouts.forEach((c,i)=>{const field=BIOS_OUTPUTS.indexOf(c.path);if(field<0)throw Error('Unsupported Arduino readout');const off=223+i*18;data[off]=field;data.write(c.label.replace(/[^\x20-\x7e]/g,'?'),off+1,16,'ascii');});
  data.writeUInt16LE(data.subarray(0,331).reduce((a,b)=>(a+b)&0xffff,0),331);return data;
}
export function intelHex(bytes){
  const rows=[];for(let offset=0;offset<bytes.length;offset+=16){const chunk=bytes.subarray(offset,offset+16),row=[chunk.length,offset>>8,offset&255,0,...chunk];rows.push(':'+Buffer.from([...row,(-row.reduce((a,b)=>a+b,0))&255]).toString('hex').toUpperCase());}return rows.join('\n')+'\n:00000001FF\n';
}
export async function flashAvr({root,tools,port,profile,progress=()=>{}}){
  const target=AVR_TARGETS[profile.board];if(!target)throw Error('Unsupported AVR board');
  const image=verifiedImage(root,target,'panel');
  const tempRoot=fs.realpathSync(os.tmpdir()),tmp=fs.mkdtempSync(path.join(tempRoot,'starpanel-'));const eeprom=path.join(tmp,'panel.hex');
  fs.writeFileSync(eeprom,intelHex(eepromProfile(profile)));
  try{
    if(target.touch){progress('Resetting native USB board into bootloader…');port=await bootloaderPort(port);}
    const args=['-p',target.part,'-c',target.protocol,'-P',port,'-b',String(target.baud),'-D','-U',`flash:w:${image}:i`,'-U',`eeprom:w:${eeprom}:i`];
    await uploadAvr(tools,args,progress);
    return {ok:true,message:'Arduino firmware and interface uploaded and verified. Connect standalone USB, or disconnect the slave programmer before connecting the DCSBIOSKit bus.'};
  }finally{if(path.dirname(fs.realpathSync(tmp))!==tempRoot||!path.basename(tmp).startsWith('starpanel-'))throw Error('Unexpected temporary directory');fs.rmSync(tmp,{recursive:true,force:true});}
}
