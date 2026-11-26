import {BIOS_FIELDS} from './dcsbios.mjs';
import {describeInput,describeOutput} from './io-descriptions.mjs';
import {outputStates} from './io-states.mjs';
import {DERIVED_FIELDS} from './derived.mjs';

export function referenceCategory(path){
 if(path.startsWith('derived.'))return 'StarPanel / Computed readouts';
 if(path.startsWith('actor.vitals'))return 'Character / Vitals';
 if(path.startsWith('actor.environment'))return 'Character / Environment';
 if(path.includes('tracked_contract'))return 'Character / Contracts';
 if(path.includes('location'))return 'Character / Location';
 if(path.startsWith('actor.'))return 'Character / State';
 if(path.includes('quantum_travel'))return 'Ship / Quantum';
 if(path.includes('flight.'))return 'Ship / Flight';
 if(path.includes('shields'))return 'Ship / Shields';
 if(path.includes('power.'))return 'Ship / Power';
 if(path.includes('annunciators'))return 'Ship / Annunciators';
 if(path.startsWith('vehicle.'))return 'Ship / State';
 if(path.startsWith('weapons'))return 'Weapons / Countermeasures';
 if(path.startsWith('force_feedback'))return 'Haptics';
 if(path.startsWith('game.debug'))return 'Game / Diagnostics';
 return path.split('.')[0];
}
const inputCategories={lights_controller:'Ship / Lights',player:'Character / Controls',player_emotes:'Character / Emotes',seat_general:'Ship / Seat',spaceship_docking:'Ship / Docking',spaceship_general:'Ship / General',spaceship_movement:'Ship / Flight',spaceship_power:'Ship / Power',spaceship_quantum:'Ship / Quantum',spaceship_radar:'Ship / Radar',spaceship_target_hailing:'Ship / Hailing'};
const json=value=>JSON.stringify(value,null,2);
export function buildReference({activeFields,liveFields,ptuFields,actions,advertisedActions=[],config={}}){
 const active=new Map(activeFields.map(f=>[f.path,f])),live=new Set(liveFields.map(f=>f.path));
 const fields=new Map([...ptuFields,...activeFields,...DERIVED_FIELDS].map(f=>[f.path,f]));
 const outputs=[...fields.values()].map(f=>{
  const bios=BIOS_FIELDS[f.path]??null;
  return {id:`output:${f.path}`,kind:'output',key:f.path,category:referenceCategory(f.path),...f,...describeOutput(f.path),expected:outputStates(f),activeSchema:f.derived?f.sources.every(p=>active.has(p)):active.has(f.path),liveSchema:f.derived?f.sources.every(p=>live.has(p)):live.has(f.path),bios,
   snippets:{mapping:json({fields:{my_readout:f.path}}),component:!f.repeated?json({kind:'readout',label:'Readout',path:f.path}):null,
    arduino:bios?`// StarPanel RS485 map; requires fresh heartbeat/status handling.\nvoid onReadout(char* value) {\n  // Render value on your display.\n}\nDcsBios::StringBuffer<${bios.bufferLength}> readout(0x${bios.address.toString(16)}, onReadout);`:null}};
 });
 const actionMap=new Map(actions.map(a=>[a.action_name,a]));
 for(const a of advertisedActions){const item=typeof a==='string'?{action_name:a}:a;actionMap.set(item.action_name,{...actionMap.get(item.action_name),...item});}
 const inputs=[...actionMap.values()].map(a=>({id:`input:${a.action_name}`,kind:'input',key:a.action_name,...describeInput(a.action_name),category:inputCategories[a.category]??a.category??'Other actions',holdable:a.holdable===true,
  snippets:{mapping:json({buttons:{my_button:a.action_name}}),component:json({kind:'button',label:'Button',action:a.action_name})}}));
 return [...outputs,...inputs].sort((a,b)=>a.key.localeCompare(b.key));
}

export {referenceReading} from './reference-state.mjs';
