import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {SerialPort} from 'serialport';
import {ESPLoader, Transport} from 'esptool-js';

// Web Serial facade backed by the same native serial library as the middleware.
export class NativeSerial {
  constructor(info, Serial=SerialPort) {this.info=info;this.Serial=Serial;this.readable=null;this.writable=null;this.signals={dtr:false,rts:false};}
  getInfo() {return {usbVendorId:parseInt(this.info.vendorId,16)||undefined,usbProductId:parseInt(this.info.productId,16)||undefined};}
  async open({baudRate}) {
    this.port=new this.Serial({path:this.info.path,baudRate,autoOpen:false});
    await new Promise((r,j)=>this.port.open(e=>e?j(e):r()));
    let controller, cancelled=false;
    this.readable=new ReadableStream({start:c=>{controller=c;},cancel:()=>{cancelled=true;}});
    this.port.on('data',bytes=>{if(!cancelled) controller.enqueue(new Uint8Array(bytes));});
    this.port.on('error',err=>{if(!cancelled){cancelled=true;controller.error(err);}});
    this.port.on('close',()=>{if(!cancelled){cancelled=true;controller.close();}});
    this.writable=new WritableStream({write:bytes=>new Promise((r,j)=>this.port.write(Buffer.from(bytes),e=>e?j(e):r()))});
  }
  async setSignals(s) {
    const flags={}; if(s.dataTerminalReady!==undefined)flags.dtr=s.dataTerminalReady;
    if(s.requestToSend!==undefined)flags.rts=s.requestToSend;if(s.break!==undefined)flags.brk=s.break;
    // serialport.set supplies defaults for omitted flags. Preserve the other
    // signal so esptool's DTR workaround cannot undo an RTS reset pulse.
    Object.assign(this.signals,flags);
    await new Promise((r,j)=>this.port.set({...this.signals},e=>e?j(e):r()));
  }
  async setBaudRate(baudRate) {await new Promise((r,j)=>this.port.update({baudRate},e=>e?j(e):r()));}
  async close() {
    if(this.port?.isOpen)await new Promise((r,j)=>this.port.close(e=>e?j(e):r()));
    this.readable=null;this.writable=null;
  }
}
export function loadFirmware(root, profile) {
  if(!['esp32s3','esp32','esp32c3','esp32c3supermini','esp32s2mini','esp32s3-wifi','esp32-wifi','esp32c3-wifi'].includes(profile))throw Error('Unsupported firmware target');
  const dir=path.join(root,profile), manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
  if(manifest.profile!==profile || !Array.isArray(manifest.files))throw Error('Invalid firmware manifest');
  const files=manifest.files.map(f=>{
    if(!/^[a-z0-9_.-]+\.bin$/.test(f.name)||!Number.isInteger(f.address)||f.address<0||f.address>0x10000)throw Error('Invalid image address or filename');
    const data=fs.readFileSync(path.join(dir,f.name));
    if(createHash('sha256').update(data).digest('hex')!==f.sha256)throw Error(`Firmware checksum failed: ${f.name}`);
    return {address:f.address,data:new Uint8Array(data)};
  });
  return {manifest,files};
}
export async function flashFirmware({info,root,profile,progress=()=>{}}, dependencies={}) {
  const {manifest,files}=loadFirmware(root,profile);
  const Device=dependencies.Device??NativeSerial, Loader=dependencies.Loader??ESPLoader, TransportClass=dependencies.Transport??Transport;
  const transport=new TransportClass(new Device(info),false);
  const terminal={clean(){},write:message=>progress(String(message)),writeLine:message=>progress(String(message))};
  const loader=new Loader({transport,baudrate:115200,terminal});
  try {
    await loader.main();
    if(loader.chip.CHIP_NAME!==manifest.chip)throw Error(`Detected ${loader.chip.CHIP_NAME}; selected firmware is for ${manifest.chip}. Nothing flashed.`);
    const flashSize=await loader.detectFlashSize();
    if(!flashSize||loader.flashSizeBytes(flashSize)<manifest.minimumFlashBytes)throw Error(`This firmware requires at least ${manifest.minimumFlashBytes/1024/1024} MB flash. Nothing flashed.`);
    await loader.writeFlash({fileArray:files,flashSize:'keep',flashMode:'keep',flashFreq:'keep',eraseAll:false,compress:true,
      calculateMD5Hash:bytes=>createHash('md5').update(bytes).digest('hex'),
      reportProgress:(index,written,total)=>progress(`Image ${index+1}/${files.length}: ${Math.round(written/total*100)}%`)});
    // Explicit reset pulse: esptool-js 0.7.1's HardReset only releases RTS,
    // leaving native USB C3 hardware in the stub after an otherwise valid upload.
    await loader.after('custom_reset',false,'D0|R1|W100|R0|W200');
    return {ok:true,message:'Firmware uploaded. Reconnect the panel, then program its interface.'};
  } finally {await transport.disconnect().catch(()=>{});}
}
