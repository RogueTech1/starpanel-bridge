const title=text=>text.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bScm\b/g,'SCM').replace(/\bEva\b/g,'EVA').replace(/\bVtol\b/g,'VTOL');
const unavailable='Missing parent/field, stale telemetry or an invalid sentinel means unavailable, not OFF or zero. Schema definitions do not guarantee a value is emitted.';
function booleanLabels(path){
 if(path==='vehicle.state.lights_enabled')return ['On','Off'];
 if(path==='vehicle.state.flight.state.is_landed')return ['Landed','Not landed'];
 if(path.endsWith('gimbals_locked'))return ['Locked','Unlocked'];
 if(path.endsWith('breathable_atmosphere'))return ['Breathable','Not breathable'];
 if(path==='game.menu_open')return ['Open','Closed'];
 if(path.endsWith('.critical'))return ['Critical','Not critical'];
 if(path.endsWith('.engaged'))return ['Engaged','Not engaged'];
 if(path.endsWith('.spooled'))return ['Spooled','Not spooled'];
 if(path.endsWith('ifcs_coupled.active'))return ['Coupled','Decoupled'];
 if(path.endsWith('.active'))return ['Active','Inactive'];
 if(path.startsWith('vehicle.state.power.'))return ['Power enabled','Power disabled'];
 if(path.endsWith('.enabled'))return ['Enabled / available flag','Disabled / unavailable flag'];
 return ['Enabled / true','Disabled / false'];
}
export function outputStates(field){
 const path=field.path;
 if(field.enums){
  const names=Object.keys(field.enums),parts=names.map(n=>n.split('_'));let common=0;
  while(parts.every(p=>p.length>common+1&&p[common]===parts[0][common]))common++;
  const meanings={UNSPECIFIED:'Unspecified or unknown; do not infer a physical switch position.',RETRACTED:'Fully retracted or stowed.',DEPLOYING:'Moving toward the deployed position.',DEPLOYED:'Fully deployed.',RETRACTING:'Moving toward the retracted position.',OPENED:'Reported open.',CLOSED:'Reported closed.',LOCKED:'Reported locked.',UNLOCKED:'Reported unlocked.',NOMINAL:'Normal/nominal indicator state.',OFF:'Reported off.',MINOR_FLASHING:'Minor warning with flashing indication.',MINOR_ON:'Minor warning with steady indication.',MAJOR_FLASHING:'Major warning with flashing indication.',MAJOR_ON:'Major warning with steady indication.'};
  return {summary:'Named enum states from this field’s schema. The decoded stream uses the full constant name; numeric codes are shown for reference. Unrecognized future values are unknown, not OFF.',unavailable,states:names.map(value=>{const suffix=value.split('_').slice(common).join('_');return {value,number:field.enums[value],label:title(suffix),meaning:meanings[suffix]??`Reported ${title(suffix).toLowerCase()} state; availability depends on game context.`};})};
 }
 if(field.repeated)return {summary:'A collection of entries, not a single ON/OFF state. Count/order may vary; parse each entry or face separately.',unavailable,states:[{value:'[]',label:'Empty collection',meaning:'An explicitly decoded empty list has no entries; an omitted list remains unavailable in this app.'},{value:'[...]',label:'Entries present',meaning:'One or more values/messages; inspect each entry and its type before mapping.'}]};
 if(field.type==='bool'){
  const [on,off]=booleanLabels(path);
  return {summary:'Boolean true/false. Proto3 false defaults are applied only inside a received parent message; an absent parent is never fabricated.'+(path.includes('.settings.ifcs_')&&/\.(active|enabled)$/.test(path)?' Read enabled and active together: an unavailable/disabled assist is not established as a usable physical-switch feedback source.':''),unavailable,states:[{value:true,label:on,meaning:`Reports ${on.toLowerCase()}.`},{value:false,label:off,meaning:`Reports ${off.toLowerCase()} within a present subsystem.`}]};
 }
 if(field.type==='string')return {summary:'Text supplied by the game. Empty/default text does not prove that the underlying object or feature exists.',unavailable,states:[]};
 if(['int64','uint64','sint64','fixed64','sfixed64'].includes(field.type))return {summary:`${field.type.startsWith('u')||field.type==='fixed64'?'Unsigned':'Signed'} 64-bit integer, decoded as decimal text to preserve precision. Timestamp fields use the units shown; this is not a floating-point gauge.`,unavailable,states:[]};
 if(/^(?:u?int|sint|s?fixed)32$/.test(field.type))return {summary:`${field.type==='uint32'||field.type==='fixed32'?'Non-negative':'Signed'} integer. Counts and indices have no universal per-ship maximum in this reference.`,unavailable,states:[]};
 const normalized=['vehicle.state.shields.level','vehicle.state.health','vehicle.state.flight.instruments.boost.reserves','vehicle.state.flight.instruments.hydrogen_fuel','vehicle.state.quantum_travel.spool_ratio','vehicle.state.quantum_travel.calibration_ratio'];
 let summary='Finite numeric reading. A verified range/scale is not established here; do not assume 0–100 or convert it to a percentage without confirmation.';
 if(normalized.includes(path))summary='Expected normalized fraction, usually 0–1 (0–100% when multiplied by 100), based on the referenced reader/field semantics. This is display guidance, not a schema-enforced bound.';
 if(path.startsWith('actor.vitals.')&&/\.(current|max)$/.test(path))summary='Numeric gauge value. Use the paired current/max fields when received; the maximum and units depend on the gauge. Missing max is not replaced with 100.';
 if(path.endsWith('.g_meter.max'))summary='Numeric recorded peak G-force, not a maximum permitted G-force limit. It may change when the G-meter peak is reset.';
 if(path.endsWith('.altitude')||path.endsWith('.radar_altitude'))summary='Numeric distance when valid. Float-max/out-of-range sentinels display as unavailable; there is no universal valid upper range for every context.';
 return {summary,unavailable,states:[]};
}
