(() => {
  const el=id=>document.getElementById(id);
  let reference={actions:[],game_version:''},fields=[],snapshot=null,signature='';
  const names={lights_controller:'Exterior lights',player:'Character controls',player_emotes:'Emotes',seat_general:'Seat and operator modes',spaceship_docking:'Docking',spaceship_general:'Ship and doors',spaceship_movement:'Flight controls and assists',spaceship_power:'Power systems',spaceship_quantum:'Quantum travel',spaceship_radar:'Radar',spaceship_target_hailing:'Target hailing'};
  function outputGroup(path){
    if(path.startsWith('actor.vitals'))return 'Character · vitals';
    if(path.startsWith('actor.environment'))return 'Character · environment';
    if(path.includes('tracked_contract'))return 'Character · tracked contracts';
    if(path.includes('location'))return 'Character · location';
    if(path.startsWith('actor.'))return 'Character · state';
    if(path.includes('quantum_travel'))return 'Ship · quantum travel';
    if(path.includes('flight.'))return 'Ship · flight and instruments';
    if(path.includes('shields'))return 'Ship · shields';
    if(path.includes('power.'))return 'Ship · power systems';
    if(path.includes('annunciators'))return 'Ship · warning lights';
    if(path.startsWith('vehicle.'))return 'Ship · state';
    if(path.startsWith('force_feedback'))return 'Haptic feedback';
    if(path.startsWith('weapons'))return 'Weapons and countermeasures';
    if(path.startsWith('game.debug'))return 'Game · performance and network';
    return path.split('.')[0];
  }
  function value(path){let v=snapshot?.raw;for(const key of path.split('.')){if(!v||typeof v!=='object'||!Object.hasOwn(v,key))return null;v=v[key];}if(typeof v==='number'&&(!Number.isFinite(v)||Math.abs(v)>=3.402823e38))return null;return v??null;}
  function group(container,heading){let section=[...container.children].find(s=>s.dataset.group===heading);if(!section){section=document.createElement('article');section.dataset.group=heading;const h=document.createElement('h3');h.textContent=heading;section.append(h);container.append(section);}return section;}
  function row(parent,title,detail){const item=document.createElement('div');item.className='mapping-row';const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=title;small.textContent=detail;item.append(strong,small);parent.append(item);}
  function draw(){
    if(!snapshot)return;const q=el('mappingSearch').value.toLowerCase();
    const live=new Map((snapshot.actionDetails??[]).map(a=>[a.action_name,a]));
    const actions=new Map(reference.actions.map(a=>[a.action_name,a]));for(const [name,a]of live)actions.set(name,{...actions.get(name),...a});
    el('inputGroups').replaceChildren();el('outputGroups').replaceChildren();
    el('inputEvidence').textContent=`${snapshot.keyboardSupported?'Keyboard bindings are available for your selected game keys. ':''}${snapshot.demo?'Simulator':'Running game'} advertises ${snapshot.actions.length} API actions. Historical reference: ${reference.actions.length} actions from ${reference.game_version}; reference-only API entries cannot be sent.`;
    for(const [alias,action]of Object.entries(snapshot.config.buttons))if(action.startsWith('key_')&&`${alias} ${action}`.toLowerCase().includes(q))row(group(el('inputGroups'),'Keyboard bindings'),alias,`${action.slice(4).replaceAll('_',' + ')} · ${snapshot.config.switches?.[alias]?'Maintained switch with telemetry feedback':'Discrete press'} · Requires Enable controls and game focus`);
    for(const [name,a]of actions){const category=names[a.category]??a.category??'Other actions';if(!`${name} ${category}`.toLowerCase().includes(q))continue;
      const mapped=Object.entries(snapshot.config.buttons).filter(([,action])=>action===name).map(([alias])=>alias);
      row(group(el('inputGroups'),category),name,`${snapshot.actions.includes(name)?(snapshot.demo?'Simulator available':'Advertised by running game'):'Reference only'} · ${a.holdable?'Hold supported by schema; current panels send discrete presses':'Discrete action'}${mapped.length?' · Mapped: '+mapped.join(', '):''}`);
    }
    for(const f of fields){const category=outputGroup(f.path);if(!`${f.path} ${category}`.toLowerCase().includes(q))continue;
      const v=snapshot.packet.stale?null:value(f.path);const raw=v===null?'Not received':JSON.stringify(v).slice(0,160);
      const mapped=Object.entries(snapshot.config.fields).filter(([,path])=>path===f.path).map(([alias])=>alias);
      row(group(el('outputGroups'),category),f.path,`${f.type}${f.repeated?'[]':''} · ${raw}${mapped.length?' · Mapped: '+mapped.join(', '):''}`);
    }
  }
  el('mappingSearch').oninput=draw;
  el('showInputs').onclick=()=>{el('inputMappings').classList.remove('hidden');el('outputMappings').classList.add('hidden');el('showInputs').classList.add('active');el('showOutputs').classList.remove('active');};
  el('showOutputs').onclick=()=>{el('inputMappings').classList.add('hidden');el('outputMappings').classList.remove('hidden');el('showOutputs').classList.add('active');el('showInputs').classList.remove('active');draw();};
  async function refresh(){if(document.hidden||el('mapping').classList.contains('hidden')){setTimeout(refresh,1000);return;}try{snapshot=await window.bridge.snapshot();const next=JSON.stringify([snapshot.actions,snapshot.config]);if(next!==signature||!el('mapping').classList.contains('hidden')){signature=next;draw();}}catch{}setTimeout(refresh,1000);}
  void Promise.all([window.bridge.inputReference(),window.bridge.catalog()]).then(([r,f])=>{reference=r;fields=f;void refresh();});
})();
