const $ = id => document.getElementById(id);
let fields = [], initial = true;
const handle = fn => async () => {try {await fn();} catch (e) {$('result').textContent = e.message;}};
async function ports() {
  const list = await window.bridge.ports(); $('ports').replaceChildren();
  for (const p of list) {const o = document.createElement('option'); o.value = p.path; o.textContent = `${p.path} ${p.manufacturer ?? ''}`; $('ports').append(o);}
}
$('refresh').onclick = handle(ports);
$('connect').onclick = handle(async () => {if ($('ports').value) await window.bridge.device($('ports').value, true, $('protocol').value);});
$('mode').onchange = handle(async () => {await window.bridge.mode($('mode').value === 'demo'); $('arm').checked = false;});
$('arm').onchange = handle(() => window.bridge.arm($('arm').checked));
$('networkEnable').onchange = handle(() => window.bridge.network($('networkEnable').checked));
$('showToken').onclick = handle(async () => {
  const hidden = $('networkToken').classList.contains('hidden');
  $('networkToken').textContent = hidden ? await window.bridge.networkToken() : '';
  $('networkToken').classList.toggle('hidden', !hidden);
  $('showToken').textContent = hidden ? 'Hide pairing key' : 'Show pairing key';
});
$('save').onclick = async () => {try {await window.bridge.saveConfig($('config').value); $('arm').checked = false; $('saveResult').textContent = 'Saved. Reconnect your panels.';} catch(e) {$('saveResult').textContent = e.message;}};
document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('hidden', tab.id !== button.dataset.tab));
  $('ipPanels').classList.toggle('hidden',button.dataset.tab!=='panels');
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === button));
});
function catalog() {
  $('catalogRows').replaceChildren();
  const query = $('search').value.toLowerCase();
  for (const f of fields.filter(f => f.path.toLowerCase().includes(query))) {
    const row = document.createElement('div'); row.className = 'catalog-row';
    row.textContent = `${f.path}  ·  ${f.type}${f.repeated ? '[]' : ''}`;
    if (f.enums) row.title = JSON.stringify(f.enums); $('catalogRows').append(row);
  }
}
$('search').oninput = catalog;
async function refresh() {
  if(document.hidden){setTimeout(refresh,1000);return;}
  try {
    const s = await window.bridge.snapshot(); const p = s.packet;
    document.dispatchEvent(new CustomEvent('bridge-snapshot',{detail:s}));
    if (initial) {$('config').value = JSON.stringify(s.config, null, 2); initial = false;}
    $('mode').value = s.demo ? 'demo' : 'live';
    $('networkEnable').checked = s.network.enabled;
    $('networkStatus').textContent = `${s.network.listening ? 'Listening' : 'Disabled or unavailable'} · TCP ${s.network.port}\nPC addresses: ${s.network.addresses.join(', ') || 'No LAN address detected'}`;
    $('networkClients').textContent = s.network.clients.map(c => `${c.name} · ${c.address} · ${c.fields.join(', ')}`).join('\n');
    $('status').textContent = `${s.demo ? 'SIMULATOR — generated values; no game commands' : 'LIVE GAME'} · ${p.stale ? 'No fresh telemetry' : `Receiving · age ${p.age_ms} ms`} · ${s.keyboardSupported?'Keyboard controls available · ':''}${s.actions.length} advertised API actions\n${p.error ?? 'USB and IP panels receive selected values at 5 Hz.'}`;
    $('arm').disabled=!s.inputsSupported;
    $('status').classList.toggle('good', !p.stale); $('arm').checked = s.allowActions;
    $('values').replaceChildren();
    for (const [key, value] of Object.entries(p.values)) {
      const card = document.createElement('div'); card.className = 'value';
      const label = document.createElement('small'); label.textContent = key.replaceAll('_', ' ');
      const content = document.createElement('strong');
      content.textContent = value === null ? '—' : typeof value === 'number' ? String(Math.round(value * 100) / 100) : String(value).replace('VEHICLE_COMPONENT_DEPLOYMENT_STATE_', '');
      const gaugePath=s.config.fields[key];
      if(value!==null&&typeof gaugePath==='string'&&gaugePath.endsWith('.current')){
        let max=s.raw;for(const part of gaugePath.replace(/\.current$/,'.max').split('.'))max=max?.[part];
        if(typeof max==='number'&&max>0)content.textContent=`${value} / ${max}`;
      }
      card.append(label, content); $('values').append(card);
    }
    $('devices').replaceChildren();
    for (const d of s.devices) {
      const row = document.createElement('div'); row.className = 'device';
      const label = document.createElement('span'); label.textContent = `${d.name} · ${d.port} · ${d.open ? 'connected' : 'reconnecting'}${d.info?.board?' · '+d.info.board:''}${d.info?.setupActive?' · Wi-Fi setup: '+d.info.setupSsid+' / http://192.168.4.1/ (password StarPanel123)':''}`;
      const button = document.createElement('button'); button.textContent = 'Disconnect'; button.onclick = handle(() => window.bridge.device(d.port, false));
      row.append(label, button); $('devices').append(row);
    }
    // Preserve focused buttons across updates for keyboard and mouse operation.
    const signature = JSON.stringify([s.config.buttons, s.actions, p.stale, s.demo, s.allowActions]);
    if ($('controls').dataset.signature !== signature) {
      $('controls').dataset.signature = signature; $('controls').replaceChildren();
      for (const [name, action] of Object.entries(s.config.buttons)) {
        const b = document.createElement('button'); b.textContent = name; b.title = action;
        b.disabled = !!s.config.switches?.[name] || p.stale || !(s.actions.includes(action)||(action.startsWith('key_')&&(s.keyboardSupported||s.demo))) || (!s.demo && !s.allowActions);
        b.onclick = handle(async () => {$('result').textContent = JSON.stringify(await window.bridge.press(name), null, 2);});
        $('controls').append(b);
      }
    }
    $('actionCatalog').textContent = s.actions.length ? [...s.actions].sort().join('\n') : 'No actions advertised by the current source.';
    $('switchStatus').textContent=Object.entries(s.switchStatus??{}).map(([name,status])=>`${name}: ${status}`).join('\n')||'No maintained-switch positions received.';
    if(!$('raw').classList.contains('hidden')){$('rawFrame').textContent = JSON.stringify(s.raw, null, 2); $('log').textContent = s.logs.map(l => `${l.time} ${l.message}`).join('\n');}
  } catch(e) {$('status').textContent = e.message;}
  setTimeout(refresh, 400);
}
void ports(); void window.bridge.catalog().then(rows => {fields = rows; catalog();}); void refresh();
for(const button of document.querySelectorAll('[data-help]'))button.onclick=handle(()=>window.bridge.help(button.dataset.help));
$('enableTelemetry').onclick=handle(async()=>{$('setupResult').textContent=await window.bridge.enableTelemetry();});
if(localStorage.getItem('setupCollapsed')==='true')$('welcome').open=false;
$('welcome').addEventListener('toggle',()=>localStorage.setItem('setupCollapsed',String(!$('welcome').open)));
