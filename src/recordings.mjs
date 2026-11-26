// Deliberate allowlist: never copy account, actor names, entity IDs, network,
// location, contracts, timestamps, credentials or arbitrary string fields.
const gearValues=['UNSPECIFIED','RETRACTED','DEPLOYING','DEPLOYED','RETRACTING'].map(s=>'VEHICLE_COMPONENT_DEPLOYMENT_STATE_'+s);
export const RECORDING_FIELDS=Object.freeze({
 'vehicle.state.flight.state.gear':gearValues,
 'vehicle.state.flight.state.vtol':gearValues,
 'vehicle.state.flight.state.is_landed':'boolean',
 ...Object.fromEntries(['speed','hydrogen_fuel','altitude','radar_altitude','vertical_speed_indicator','atmospheric_density','boost.reserves','g_meter.max'].map(s=>['vehicle.state.flight.instruments.'+s,'number'])),
 ...Object.fromEntries(['powerplants','engines','weapons','coolers','life_support','gravity_generators','sensors','shield_generators','shield_emitters'].map(s=>['vehicle.state.power.'+s,'boolean'])),
 ...Object.fromEntries(['health.current','health.max','oxygen.current','oxygen.max'].map(s=>['actor.vitals.'+s,'number']))
});
export function sanitizeFrame(frame){
 const out={};
 for(const [field,kind]of Object.entries(RECORDING_FIELDS)){
  const parts=field.split('.');let value=frame;
  for(const key of parts){if(!value||typeof value!=='object'||!Object.hasOwn(value,key)){value=undefined;break;}value=value[key];}
  if(Array.isArray(kind)?!kind.includes(value):typeof value!==kind||kind==='number'&&!Number.isFinite(value))continue;
  let parent=out;for(const key of parts.slice(0,-1))parent=parent[key]??={};parent[parts.at(-1)]=value;
 }return out;
}
export function sanitizeRecording(records){
 let firstTime;
 return records.map((record,index)=>{
  if(!record||typeof record!=='object'||!record.frame||typeof record.frame!=='object'||Array.isArray(record.frame))throw Error(`Record ${index+1} needs a frame object`);
  const time=typeof record.time==='string'?Date.parse(record.time):NaN;
  if(firstTime===undefined&&Number.isFinite(time))firstTime=time;
  const offset=Number.isFinite(time)&&firstTime!==undefined?Math.max(0,time-firstTime):null;
  return {offset_ms:offset,frame:sanitizeFrame(record.frame)};
 });
}
