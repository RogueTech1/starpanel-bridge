const fields=[
 ['weapon_count','Weapon count','Number of entries in the received weapon collection.','number',['weapons.weapons'],'Non-negative count of received weapon entries; an explicit empty collection yields zero.'],
 ['weapons_ready','Weapons ready to fire','Count of received weapons whose ready-to-fire flag is true.','number',['weapons.weapons'],'Non-negative count, at most the received weapon count. Missing collections remain unavailable.'],
 ['weapon_ready_fraction','Weapon readiness fraction','Ready weapon count divided by the number of received weapon entries.','number',['weapons.weapons'],'Computed fraction 0–1. An empty collection has no meaningful readiness fraction and remains unavailable.'],
 ['decoys_remaining','Decoys remaining','Sum of amounts in received countermeasure entries explicitly typed as decoy.','number',['weapons.countermeasures'],'Non-negative stock count; no maximum capacity or percentage is inferred. A missing decoy entry is unavailable, not zero.'],
 ['noise_remaining','Noise countermeasures remaining','Sum of amounts in received countermeasure entries explicitly typed as noise.','number',['weapons.countermeasures'],'Non-negative stock count; no maximum capacity or percentage is inferred. A missing noise entry is unavailable, not zero.']
];
export const DERIVED_FIELDS=fields.map(([key,label,description,type,sources,expectedSummary])=>({path:`derived.${key}`,label,description,type,sources,expectedSummary,unit:key==='weapon_ready_fraction'?'fraction':'count',descriptionSource:'StarPanel computed readout',derived:true,repeated:false,presence:'computed',enums:null}));
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function derivedValues(frame){
 const result=Object.fromEntries(fields.map(([key])=>[key,null]));
 const weapons=frame?.weapons;if(!object(weapons))return result;
 const items=weapons.weapons;
 if(Array.isArray(items)&&items.every(object)){
  result.weapon_count=items.length;
  if(items.every(w=>w.ready_to_fire===undefined||typeof w.ready_to_fire==='boolean')){
   result.weapons_ready=items.filter(w=>w.ready_to_fire===true).length;
   if(items.length)result.weapon_ready_fraction=result.weapons_ready/items.length;
  }
 }
 if(Array.isArray(weapons.countermeasures))for(const [type,key]of [['COUNTERMEASURE_TYPE_DECOY','decoys_remaining'],['COUNTERMEASURE_TYPE_NOISE','noise_remaining']]){
  const entries=weapons.countermeasures.filter(e=>object(e)&&e.type===type);
  // A present, typed proto3 entry may omit amount when it is zero. This
  // default applies only here, never to an absent subsystem or type.
  const amounts=entries.map(e=>e.amount===undefined?0:e.amount);
  if(entries.length&&amounts.every(n=>Number.isSafeInteger(n)&&n>=0)){
   const total=amounts.reduce((a,b)=>a+b,0);if(Number.isSafeInteger(total))result[key]=total;
  }
 }
 return result;
}
export function derivedValue(frame,path){return derivedValues(frame)[path.slice('derived.'.length)]??null;}
