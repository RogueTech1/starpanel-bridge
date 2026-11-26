import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {Game,loadSchema} from '../src/game.mjs';
const root=path.resolve(import.meta.dirname,'..');
const args=process.argv.slice(2),value=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const seconds=Number(value('--seconds','60'));
if(!Number.isFinite(seconds)||seconds<1||seconds>600)throw Error('Use --seconds 1..600');
const logPath=value('--log','C:\\Program Files\\Roberts Space Industries\\StarCitizen\\PTU\\Game.log');
fs.mkdirSync(path.join(root,'validation'),{recursive:true});
const report=path.join(root,'validation','seat-probe.ndjson');
function emit(record){const line=JSON.stringify({time:new Date().toISOString(),...record});fs.appendFileSync(report,line+'\n');console.log(line);}
async function open(port){return new Promise(resolve=>{const s=net.connect({host:'127.0.0.1',port});let done=false;const finish=result=>{if(!done){done=true;s.destroy();resolve(result);}};s.setTimeout(500);s.on('connect',()=>finish(true));s.on('error',()=>finish(false));s.on('timeout',()=>finish(false));});}
let state,previousLines='';
const end=Date.now()+seconds*1000;
while(Date.now()<end){
  let lines=[];
  try{const fd=fs.openSync(logPath,'r');try{const size=fs.fstatSync(fd).size;const buffer=Buffer.alloc(Math.min(size,1048576));fs.readSync(fd,buffer,0,buffer.length,Math.max(0,size-buffer.length));lines=buffer.toString().split(/\r?\n/).filter(line=>/\[Env Var\s*\] (GRPC_CLIENT_SERVER_ENABLED|SERVER_GAME_TELEMETRY_ENABLED)=|\[User CFG\s*\] server\.game\.telemetry|<GRPC Server>|<GameTelemetry>|<Initializing Game Telemetry>|Local services server|GameTelemetryService/.test(line));}finally{fs.closeSync(fd);}}catch{}
  const encoded=JSON.stringify(lines);
  if(encoded!==previousLines){emit({type:'log-evidence',lines});previousLines=encoded;}
  const listening=await open(2942);
  if(state!==listening){emit({type:'listener',port:2942,open:listening});state=listening;
    if(listening){const game=new Game(loadSchema(path.join(root,'schema/local.desc')));try{const result=await game.call('ListTriggerableActions');emit({type:'actions',count:result.actions?.length??0});}catch(e){emit({type:'actions-error',code:e.code,message:e.message});}finally{game.close();}}
  }
  await new Promise(resolve=>setTimeout(resolve,2000));
}
emit({type:'completed',seconds});
