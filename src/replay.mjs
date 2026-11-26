import {Panel} from './panel.mjs';
export function replayRecords(records,config){
 if(!Array.isArray(records)||!records.length||records.length>10000)throw Error('Replay requires 1–10000 records');
 let clock=0,previous=-1;
 // Replays are always demo data, including snapshots originally recorded live.
 // No transport or game client is instantiated.
 const panel=new Panel({config,game:{},demo:true,now:()=>clock});
 return records.map((record,index)=>{
  if(!record||!Number.isInteger(record.offset_ms)||record.offset_ms<0||record.offset_ms>86400000||record.offset_ms<previous)throw Error(`Record ${index+1}: offsets must be ordered integers within 24 hours`);
  previous=clock=record.offset_ms;
  if(Object.hasOwn(record,'frame')){
   if(!record.frame||typeof record.frame!=='object'||Array.isArray(record.frame))throw Error(`Record ${index+1}: invalid frame`);
   panel.update(record.frame);
  }
  return {offset_ms:clock,packet:panel.packet()};
 });
}
