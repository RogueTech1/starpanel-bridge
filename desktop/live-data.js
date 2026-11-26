(() => {
 const $=id=>document.getElementById(id),rows=new Map();let last=0,latest=null;
 function flatten(value,prefix='',out=[]){
  if(out.length>=1000)return out;
  if(value!==null&&typeof value==='object'){for(const [key,v]of Object.entries(value)){flatten(v,prefix?prefix+'.'+key:key,out);if(out.length>=1000)break;}}
  else out.push({path:prefix,value:typeof value==='number'&&(!Number.isFinite(value)||Math.abs(value)>=3.402823e38)?null:value,type:value===null?'unavailable':typeof value});
  return out;
 }
 function draw(snapshot,force=false){
  latest=snapshot;if(document.hidden||$('live').classList.contains('hidden')||!force&&Date.now()-last<1000)return;last=Date.now();
  const fields=snapshot.packet.stale?[]:flatten(snapshot.raw),query=$('liveSearch').value.toLowerCase(),seen=new Set();
  for(const f of fields){if(!f.path.toLowerCase().includes(query))continue;seen.add(f.path);let tr=rows.get(f.path);
   if(!tr){tr=document.createElement('tr');for(let i=0;i<3;i++)tr.append(document.createElement('td'));tr.children[0].textContent=f.path;$('liveRows').append(tr);rows.set(f.path,tr);}
   const value=f.value===null?'Unavailable':typeof f.value==='number'?String(Math.round(f.value*1000000)/1000000):String(f.value);
   if(tr.children[1].textContent!==value)tr.children[1].textContent=value;tr.children[2].textContent=f.type;
  }
  for(const [key,row]of rows)if(!seen.has(key)){row.remove();rows.delete(key);}
  $('liveSummary').textContent=snapshot.packet.stale?'Waiting for fresh game data.':`${snapshot.demo?'Simulator':'Live game'} · ${fields.length} current scalar fields · ${rows.size} shown · refresh 1 Hz while visible. Minimize or switch tabs to pause rendering.`;
 }
 document.addEventListener('bridge-snapshot',event=>draw(event.detail));$('liveSearch').oninput=()=>{if(latest)draw(latest,true);};
 document.querySelector('[data-tab="live"]').addEventListener('click',()=>{if(latest)draw(latest,true);});
})();
