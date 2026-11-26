import {derivedValue} from './derived.mjs';
export function referenceReading(entry,snapshot){
 if(entry.kind!=='output')return {state:snapshot.actions.includes(entry.key)?(snapshot.demo?'Simulator action':'Advertised by game'):'Reference only',value:null};
 if(!entry.activeSchema)return {state:entry.derived?'Source fields outside current schema':'PTU reference only',value:null};
 if(snapshot.packet.stale)return {state:'Stale / disconnected',value:null};
 if(entry.derived){const value=derivedValue(snapshot.raw,entry.key);return {state:value===null?'Unavailable':snapshot.demo?'Simulator computed value':'Computed from API',value};}
 let value=snapshot.raw;
 for(const part of entry.key.split('.')){if(!value||typeof value!=='object'||!Object.hasOwn(value,part))return {state:'Not received',value:null};value=value[part];}
 if(value==null||(typeof value==='number'&&(!Number.isFinite(value)||Math.abs(value)>=3.402823e38)))return {state:'Unavailable',value:null};
 return {state:snapshot.demo?'Simulator value':'Received',value};
}
