import {referenceReading} from '../src/reference-state.mjs';

const $=id=>document.getElementById(id);
let entries=[],snapshot=null,selected=null,listSignature='',lastRefresh=0,configSignature='';
const visible=()=>!document.hidden&&!$('reference').classList.contains('hidden');
const mapped=e=>Object.entries(e.kind==='output'?snapshot.config.fields:snapshot.config.buttons).filter(([,v])=>v===e.key).map(([alias])=>alias);
const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const shortType=e=>e.kind==='output'?`${e.type.split('.').at(-1)}${e.repeated?'[]':''}`:'Game action';
function filtered(){
 const q=$('referenceSearch').value.trim().toLowerCase(),direction=$('referenceDirection').value,scope=$('referenceScope').value,status=$('referenceStatus').value;
 return entries.filter(e=>{
  if(direction!=='all'&&(direction==='output')!==(e.kind==='output'))return false;
  if(scope==='active'&&e.kind==='output'&&!e.activeSchema)return false;
  if(scope==='live'&&(e.kind!=='output'||!e.liveSchema))return false;
  if(scope==='ptu'&&(e.kind!=='output'||e.liveSchema))return false;
  if(scope==='bus'&&!e.bios)return false;
  if(scope==='derived'&&!e.derived)return false;
  if($('referenceCategory').value&&e.category!==$('referenceCategory').value)return false;
  if(status==='mapped'&&!mapped(e).length)return false;
  if(status==='received'&&!['Received','Simulator value','Computed from API','Simulator computed value','Advertised by game','Simulator action'].includes(referenceReading(e,snapshot).state))return false;
  const address=e.bios?'0x'+e.bios.address.toString(16):'';
  return `${e.label} ${e.description} ${e.key} ${e.category} ${shortType(e)} ${address} ${mapped(e).join(' ')} ${Object.keys(e.enums??{}).join(' ')}`.toLowerCase().includes(q);
 });
}
function detail(){
 const target=$('referenceDetail');target.replaceChildren();const e=entries.find(e=>e.id===selected);if(!e){target.append(node('p','No matching entries. Try another filter.'));return;}
 target.append(node('span',e.kind==='output'?'OUTPUT ← GAME':'INPUT → GAME','eyebrow'),node('h3',e.label),node('p',e.key,'reference-key'),node('p',e.description,'reference-purpose'),node('p',e.category));
 const state=node('div',undefined,'reference-reading');state.id='referenceReading';target.append(state);
 const definitions=node('dl');
 const pair=(label,value)=>definitions.append(node('dt',label),node('dd',value));
 pair('Type',shortType(e));
 if(e.unit)pair('Units',e.unit);
 pair('Description',e.descriptionSource);
 if(e.kind==='output'){
  pair('Schema',e.derived?'Computed locally from received API data; not a game protobuf field':`${e.liveSchema?'LIVE 4.10.3 + saved PTU':'Saved PTU only'} · ${e.activeSchema?'in current schema':'outside current schema'}`);
  pair('Presence',e.derived?'Requires received source collection: '+e.sources.join(', '):e.presence==='explicit'?'Explicit optional presence':'Wire presence; omitted is not proof of an available value');
  pair('Hardware',e.bios?`ESP32 + Arduino / DCSBIOSKit · 0x${e.bios.address.toString(16)} · ${e.bios.bytes} bytes ASCII`:'ESP32 scalar readout/rules; no assigned StarPanel Arduino address');
  if(e.repeated)pair('Collection','Repeated data needs custom parsing; direct designer insertion is disabled.');
 }else{
  pair('Availability','Only currently advertised actions can be used; acceptance still depends on game context');
  if(e.kind==='input')pair('Hold',e.holdable?'Historical metadata says holdable; current panel programmer uses discrete presses':'Discrete action');
 }
 pair('Mapped aliases',mapped(e).join(', ')||'None');target.append(definitions);
 if(e.expected){
  target.append(node('h4','Expected states / values'),node('p',e.expected.summary));
  if(e.expected.states.length){const table=node('table',undefined,'expected-table');const header=node('tr');for(const name of ['State','Meaning','Value'])header.append(node('th',name));table.append(header);
   for(const state of e.expected.states){const row=node('tr');row.append(node('td',state.label),node('td',state.meaning),node('td',`${typeof state.value==='string'?state.value:JSON.stringify(state.value)}${state.number===undefined?'':` (${state.number})`}`));table.append(row);}target.append(table);
  }
  target.append(node('p',e.expected.unavailable));
 }
 const controls=node('div',undefined,'row');
 const button=(label,fn,disabled=false)=>{const b=node('button',label);b.disabled=disabled;b.onclick=async()=>{try{await fn();}catch(err){$('referenceResult').textContent=err.message;}};controls.append(b);};
 button('Copy '+(e.kind==='output'?'field path':'action'),async()=>{$('referenceResult').textContent=await window.bridge.copyReference(e.id,'key');});
 const available=e.kind==='output'?e.activeSchema&&!e.repeated:snapshot.actions.includes(e.key);
 button('Add to designer',()=>{document.dispatchEvent(new CustomEvent('reference-use',{detail:{kind:e.kind,key:e.key}}));},!available);
 target.append(controls);
 target.append(node('h4','Mapping fragment'),node('p','Merge this fragment into advanced mappings; it is not a full configuration.'));
 const formats=[['mapping','Copy mapping JSON'],['component','Copy component fragment'],['arduino','Copy Arduino listener']];
 for(const [format,label]of formats)if(e.snippets[format]){const block=node('details');const summary=node('summary',label.replace('Copy ','View '));const copy=node('button',label);copy.onclick=async()=>{try{$('referenceResult').textContent=await window.bridge.copyReference(e.id,format);}catch(err){$('referenceResult').textContent=err.message;}};block.append(summary,node('pre',e.snippets[format]),copy);target.append(block);}
 if(e.snippets.component)target.append(node('p','Component fragments omit identity/GPIO; use Add to designer for a complete editable component.'));
 if(e.bios)target.append(node('p','The Arduino example requires DcsBios.h, setup/loop and fresh heartbeat/status handling. It uses StarPanel addresses, not DCS aircraft addresses.'));
 updateReading(e);
}
function updateReading(e){
 const target=$('referenceReading');if(!target||!e)return;const reading=referenceReading(e,snapshot),meaning=e.expected?.states.find(s=>s.value===reading.value);target.replaceChildren(node('strong',reading.state+(meaning?' · '+meaning.label:'')));
 if(reading.value!==null)target.append(node('pre',typeof reading.value==='string'?reading.value:JSON.stringify(reading.value,null,2)));
 const use=[...$('referenceDetail').querySelectorAll('button')].find(b=>b.textContent==='Add to designer');if(use)use.disabled=!(e.kind==='output'?e.activeSchema&&!e.repeated:snapshot.actions.includes(e.key));
}
function draw(){
 if(!snapshot||!entries.length)return;const rows=filtered();
 $('referenceCount').textContent=`${rows.length} matching / ${entries.length} entries`;
 $('referenceStats').textContent=`${entries.filter(e=>e.kind==='output'&&!e.derived).length} game outputs + ${entries.filter(e=>e.derived).length} computed · ${entries.filter(e=>e.kind==='input').length} API references`;
 if(!rows.some(e=>e.id===selected)){selected=rows[0]?.id??null;detail();}
 const signature=JSON.stringify([rows.map(e=>e.id),selected]);
 if(signature!==listSignature){listSignature=signature;$('referenceList').replaceChildren();for(const e of rows){const b=node('button',undefined,'reference-entry'+(e.id===selected?' active':''));b.dataset.id=e.id;b.title=e.description;b.append(node('strong',e.label),node('small',e.key),node('small',`${e.kind==='output'?'OUT':'IN'} · ${e.category} · ${shortType(e)}`),node('span','','reference-entry-state'));b.onclick=()=>{selected=e.id;detail();draw();};$('referenceList').append(b);}}
 for(const b of $('referenceList').children){const e=entries.find(e=>e.id===b.dataset.id);b.lastChild.textContent=referenceReading(e,snapshot).state;}
 updateReading(entries.find(e=>e.id===selected));
}
async function load(){
 try{const data=await window.bridge.reference();entries=data.entries;const category=$('referenceCategory').value;$('referenceCategory').replaceChildren(new Option('All categories',''),...[...new Set(entries.map(e=>e.category))].sort().map(c=>new Option(c,c)));$('referenceCategory').value=category;
  $('referenceEvidence').textContent=`Action reference: ${data.actionVersion}. PTU-only definitions do not enable the PTU service. Live values refresh only while this tab is open.`;
  listSignature='';detail();draw();
 }catch(err){$('referenceResult').textContent=err.message;}
}
for(const id of ['referenceSearch','referenceDirection','referenceScope','referenceCategory','referenceStatus'])$(id).addEventListener(id==='referenceSearch'?'input':'change',()=>{listSignature='';draw();});
document.addEventListener('bridge-snapshot',event=>{
 snapshot=event.detail;if(!visible()||Date.now()-lastRefresh<1000)return;lastRefresh=Date.now();
 const signature=JSON.stringify([snapshot.config,snapshot.actions,snapshot.actionDetails]);if(signature!==configSignature){configSignature=signature;void load();}else draw();
});
document.querySelector('[data-tab="reference"]').addEventListener('click',async()=>{snapshot=await window.bridge.snapshot();await load();});
