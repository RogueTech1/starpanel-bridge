const {app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {randomBytes} = require('node:crypto');
const base = path.resolve(__dirname, '..');
let win, bridge, schema, Game, loadSchema, Bridge, NetworkPanels, network, catalog, ports, validateProfile, compileProfile, flashFirmware, logs = [];
let flashing=false, flashState={busy:false,log:[]},WindowsKeyboard,keyboard,BOARDS,KEYS,isAvr,flashAvr,flashMaster,BIOS_FIELDS;
const smoke = process.argv.includes('--smoke-test');
const liveCheck = process.argv.includes('--live-check');
const startHidden = process.argv.includes('--hidden');
let tray, trayMenu, quitting = false, trayTimer;
app.setName('StarPanel Bridge');
app.setAppUserModelId('net.nidavard.starcitizen-hardware-bridge');
app.setPath('userData', path.join(app.getPath('appData'), smoke ? 'StarCitizenHardwareBridge-Smoke' : liveCheck ? 'StarCitizenHardwareBridge-LiveCheck' : 'StarCitizenHardwareBridge'));
if (!app.requestSingleInstanceLock()) app.exit(0);
app.on('second-instance', () => {if (win) {win.show(); win.focus();}});
const userDir = app.getPath('userData');
fs.mkdirSync(userDir, {recursive: true});
const configPath = path.join(userDir, 'panel.json');
if (!fs.existsSync(configPath)) fs.copyFileSync(path.join(base, 'panel.json'), configPath);
const settingsPath = path.join(userDir, 'settings.json');
const panelsPath=path.join(userDir,'panels.json');
let panels=[];
try {panels=JSON.parse(fs.readFileSync(panelsPath));if(!Array.isArray(panels))panels=[];} catch {}
if(smoke)panels=[];
let settings = {demo: false, ports: []};
try {settings = {...settings, ...JSON.parse(fs.readFileSync(settingsPath))};} catch {}
if (!Array.isArray(settings.ports)) settings.ports = [];
if (typeof settings.networkToken !== 'string' || settings.networkToken.length !== 64) settings.networkToken = randomBytes(32).toString('hex');
let networkGeneration = 0, networkTask = Promise.resolve();
function restartNetwork() {
  const generation = ++networkGeneration;
  networkTask = networkTask.catch(() => {}).then(async () => {
    network?.stop(); network = null;
    if (!settings.networkEnabled || generation !== networkGeneration) return;
    const next = new NetworkPanels(bridge, {token: settings.networkToken}); network = next;
    try {await next.start();} catch (err) {next.stop(); log({time: new Date().toISOString(), message: `IP listener failed: ${err.message}`});}
  });
  return networkTask;
}
function saveSettings() {if (!smoke) fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));}
function openWindow() {if (win) {if (win.isMinimized()) win.restore(); win.show(); win.focus();}}
function updateTray() {
  if (!tray || tray.isDestroyed()) return;
  const fresh = bridge.panel.received !== null && Date.now() - bridge.panel.received <= 2000;
  const status = `${bridge.demo ? 'Simulator' : 'Live game'} · ${fresh ? 'Receiving' : 'Waiting for telemetry'}`;
  tray.setToolTip(`StarPanel Bridge\n${status}`);
  if (trayMenu?.items[0]?.label === status) return;
  trayMenu = Menu.buildFromTemplate([
    {label: status, enabled: false},
    {label: 'Open StarPanel Bridge', click: openWindow},
    {type: 'separator'},
    {label: 'Live game', type: 'radio', checked: !bridge.demo, click: () => start(false)},
    {label: 'Simulator', type: 'radio', checked: bridge.demo, click: () => start(true)},
    {type: 'separator'},
    {label: 'Start with Windows', type: 'checkbox', enabled: app.isPackaged && !smoke,
      checked: app.isPackaged && app.getLoginItemSettings().openAtLogin,
      click: item => app.setLoginItemSettings({openAtLogin: item.checked, path: process.execPath, args: ['--hidden']})},
    {label: 'Quit', click: () => app.quit()}
  ]);
  tray.setContextMenu(trayMenu);
}
function log(entry) {logs.push(entry); logs = logs.slice(-80);}
function privateAddress(address){const parts=address.split('.').map(Number);return parts[0]===10||(parts[0]===192&&parts[1]===168)||(parts[0]===172&&parts[1]>=16&&parts[1]<=31);}
function start(demo) {
  if(flashing)return;
  bridge?.stop();
  const config = JSON.parse(fs.readFileSync(configPath));
  if(smoke)config.buttons={gear:'v_deploy_landing_system',lights:'v_lights',flashlight:'pl_toggle_flashlight'};
  bridge = new Bridge({config, game: demo ? {close() {}} : new Game(schema), keyboard, demo});
  bridge.on('log', log);
  bridge.start();
  for (const port of settings.ports) {
    if (typeof port === 'string') bridge.attach(port);
    else if (port && typeof port.path === 'string') bridge.attach(port.path, ['dcsbios','dcsbios-master'].includes(port.protocol)?port.protocol:'json');
  }
  settings.demo = demo; saveSettings();
  trayMenu = null; updateTray();
  void restartNetwork();
  log({time: new Date().toISOString(), message: demo ? 'Simulator started. No game commands are sent.' : 'Connecting to local game API.'});
}
app.whenReady().then(async () => {
  ({Game, loadSchema} = await import('../src/game.mjs'));
  ({Bridge} = await import('../src/bridge.mjs'));
  ({NetworkPanels} = await import('../src/network.mjs'));
  ({validateProfile,compileProfile,BOARDS,isAvr} = await import('../src/profiles.mjs'));
  ({WindowsKeyboard,KEYS}=await import('../src/keyboard.mjs'));
  ({flashAvr,flashMaster}=await import('../src/avr.mjs'));
  ({BIOS_FIELDS}=await import('../src/dcsbios.mjs'));
  const helper=app.isPackaged?path.join(process.resourcesPath,'tools/StarPanelKeyboard.exe'):path.join(base,'native/StarPanelKeyboard.exe');
  if(process.platform==='win32'&&fs.existsSync(helper))keyboard=new WindowsKeyboard(helper);
  ({flashFirmware} = await import('../src/flasher.mjs'));
  ({catalog} = await import('../src/catalog.mjs'));
  ({SerialPort: ports} = await import('serialport'));
  const local = smoke ? (app.isPackaged ? path.join(process.resourcesPath,'schema/ptu.desc') : path.join(base,'schema/local.desc')) : (app.isPackaged ? path.join(process.resourcesPath, 'schema/telemetry.desc') : path.join(base, 'schema/live/sc_extrait.desc'));
  schema = loadSchema(fs.existsSync(local) ? local : path.join(base, 'vendor/sc-telemetry-deck/schema/sc_extrait.desc'));
  start(!liveCheck&&(process.argv.includes('--demo') || settings.demo === true));
  tray = new Tray(path.join(__dirname, 'assets/icon.ico'));
  tray.on('double-click', openWindow); tray.on('click', openWindow);
  updateTray(); trayTimer = setInterval(updateTray, 1000);
  win = new BrowserWindow({width: 1220, height: 850, minWidth: 900, minHeight: 650, show: false,
    icon: path.join(__dirname, 'assets/icon.ico'),
    title: 'StarPanel Bridge', backgroundColor: '#101722',
    webPreferences: {preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true}});
  win.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
  win.once('ready-to-show', () => {if (!smoke && !liveCheck && !startHidden) win.show();});
  win.on('close', event => {if (!quitting) {event.preventDefault(); win.hide();}});
  win.setMenuBarVisibility(false);
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.loadFile(path.join(__dirname, 'index.html'));
  ipcMain.handle('snapshot', () => ({...bridge.status(), raw: bridge.panel.frame, logs,
    flash:flashState,
    network: {...(network?.status() ?? {listening: false, port: 2943, clients: []}), enabled: settings.networkEnabled === true,
      addresses: Object.values(os.networkInterfaces()).flat().filter(a => a && a.family === 'IPv4' && !a.internal).map(a => a.address).sort((a,b)=>Number(privateAddress(b))-Number(privateAddress(a)))}}));
  ipcMain.handle('network', async (_event, enabled) => {
    if (typeof enabled !== 'boolean') throw Error('Invalid network setting');
    settings.networkEnabled = enabled; saveSettings(); await restartNetwork();
  });
  ipcMain.handle('network-token', () => settings.networkToken);
  ipcMain.handle('panels',()=>panels);
  ipcMain.handle('hardware',()=>({boards:BOARDS,keys:Object.keys(KEYS)}));
  ipcMain.handle('share-panel',async(_event,id)=>{
    const p=panels.find(p=>p.id===id);if(!p)throw Error('Save the design first');
    const result=await dialog.showSaveDialog(win,{title:'Share panel design',defaultPath:`${p.name.replace(/[^a-zA-Z0-9-]/g,'-')}.starpanel.json`,filters:[{name:'StarPanel design',extensions:['json']}]});
    if(!result.canceled)fs.writeFileSync(result.filePath,JSON.stringify({format:'starpanel-1',panel:p},null,2));
  });
  ipcMain.handle('import-panel',async()=>{
    const result=await dialog.showOpenDialog(win,{title:'Import panel design',properties:['openFile'],filters:[{name:'StarPanel design',extensions:['json']}]});
    if(result.canceled)return null;if(fs.statSync(result.filePaths[0]).size>32000)throw Error('Design is too large');
    const data=JSON.parse(fs.readFileSync(result.filePaths[0]));if(data.format!=='starpanel-1')throw Error('Unsupported design format');
    validateProfile(data.panel,new Set(catalog(schema).map(f=>f.path)));return data.panel;
  });
  const links={docs:'https://github.com/RogueTech1/starpanel-bridge#readme',issues:'https://github.com/RogueTech1/starpanel-bridge/issues',dcsbioskit:'https://dcsbioskit.com/',dcsbios:'https://github.com/DCS-Skunkworks/dcs-bios',releases:'https://github.com/RogueTech1/starpanel-bridge/releases'};
  ipcMain.handle('help',async(_event,key)=>{if(key==='offline'){await shell.openPath(app.isPackaged?path.join(process.resourcesPath,'docs'):path.join(base,'docs'));return;}if(!Object.hasOwn(links,key))throw Error('Unknown help link');await shell.openExternal(links[key]);});
  ipcMain.handle('enable-telemetry',async()=>{
    const {execFile}=require('node:child_process');
    await new Promise((resolve,reject)=>execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',"[Environment]::SetEnvironmentVariable('GRPC_CLIENT_SERVER_ENABLED','true','User')"],{windowsHide:true},e=>e?reject(e):resolve()));
    return 'Telemetry startup setting saved. Safely exit Star Citizen and fully quit RSI Launcher, then reopen the launcher and game. No restart is needed if already receiving.';
  });
  ipcMain.handle('save-panel',(_event,p)=>{
    validateProfile(p,new Set(catalog(schema).map(f=>f.path)));
    if(panels.length>=16&&!panels.some(old=>old.id===p.id))throw Error('Maximum 16 saved panels');
    const clean={id:p.id,name:p.name,board:p.board,address:p.address??1,components:p.components.map(c=>c.kind==='readout'?{id:c.id,kind:c.kind,label:c.label,path:c.path}:c.kind==='led'?{id:c.id,kind:c.kind,label:c.label,pin:c.pin,count:c.count??1,path:c.path,match:c.match,operator:c.operator??'equals',effect:c.effect??'pulse',color:c.color??'#ff0000',brightness:c.brightness??64,...(c.rules?{rules:c.rules.map(r=>({operator:r.operator??'equals',match:r.match,effect:r.effect??'solid',color:r.color??'#ff0000',brightness:r.brightness??64,periodMs:r.periodMs??2400}))}:{})}:{id:c.id,kind:c.kind,label:c.label,pin:c.pin,action:c.action,...(c.kind==='switch'?{path:c.path,onValue:c.onValue,offValue:c.offValue,offAction:c.offAction}:{})})};
    if(['mega','nano'].includes(clean.board)&&panels.some(old=>old.id!==clean.id&&['mega','nano'].includes(old.board)&&(old.address??1)===clean.address))throw Error('Another saved slave uses this address. Choose a unique slave address.');
    panels=panels.filter(old=>old.id!==p.id);panels.push(clean);fs.writeFileSync(panelsPath,JSON.stringify(panels,null,2));return clean;
  });
  ipcMain.handle('program-panel',async(_event,id,port,wifi)=>{
    if(flashing)throw Error('Wait for firmware upload to finish');
    const p=panels.find(p=>p.id===id);if(!p)throw Error('Save the panel first');
    validateProfile(p,new Set(catalog(schema).map(f=>f.path)));
    const compiled=compileProfile(p,bridge.panel.config);
    compiled.device.transport=wifi?'wifi':'usb';
    if(wifi){
      if(typeof wifi.ssid!=='string'||!wifi.ssid.length||wifi.ssid.length>32||typeof wifi.password!=='string'||wifi.password.length>63||typeof wifi.host!=='string'||!/^([a-zA-Z0-9.-]){1,100}$/.test(wifi.host))throw Error('Enter a valid Wi-Fi SSID, password and PC address');
      compiled.device.wifi={ssid:wifi.ssid,password:wifi.password,host:wifi.host,port:2943,token:settings.networkToken};
      settings.networkEnabled=true;saveSettings();await restartNetwork();
      if(!network?.listening)throw Error('IP listener could not start. See connection log.');
    }
    const result=await bridge.program(port,compiled.device);
    bridge.panel.config=compiled.config;fs.writeFileSync(configPath,JSON.stringify(compiled.config,null,2));
    return result;
  });
  ipcMain.handle('flash',async(_event,port,profile,confirmed)=>{
    if(confirmed!==true)throw Error('Confirm that replacing the board program is intended');
    if((settings.masterPorts??[]).includes(port))throw Error('This port is designated as a DCSBIOSKit master. Slave/panel firmware uploads are blocked. Use the separate slave programmer port.');
    if(flashing)throw Error('An upload is already running');
    const info=(await ports.list()).find(p=>p.path===port);if(!info)throw Error('Select a connected board');
    const design=panels.find(p=>p.id===profile);
    if(!design&&!['esp32s3','esp32','esp32c3','esp32c3supermini','esp32s2mini','esp32s3-wifi','esp32-wifi','esp32c3-wifi'].includes(profile))throw Error('Unsupported board target');
    if(design)validateProfile(design,new Set(catalog(schema).map(f=>f.path)));
    flashing=true;flashState={busy:true,log:['Connecting to the selected board…']};
    try {
      const serial=bridge.devices.get(port)?.port;
      const closed=serial?.isOpen?new Promise(resolve=>serial.once('close',resolve)):Promise.resolve();
      bridge.detach(port);await closed;
      const root=app.isPackaged?path.join(process.resourcesPath,'firmware-images'):path.join(base,'firmware-images');
      const progress=message=>{flashState.log.push(message);flashState.log=flashState.log.slice(-80);};
      const result=design&&isAvr(design.board)?await flashAvr({root,tools:app.isPackaged?path.join(process.resourcesPath,'tools/avrdude'):path.join(base,'tools/avrdude'),port,profile:design,progress}):await flashFirmware({info,root,profile,progress});
      if(design&&isAvr(design.board)){const compiled=compileProfile(design,bridge.panel.config);bridge.panel.config=compiled.config;fs.writeFileSync(configPath,JSON.stringify(compiled.config,null,2));}
      flashState.log.push(result.message);return result;
    }catch(err){flashState.log.push(err.message);throw err;}
    finally{flashing=false;flashState.busy=false;}
  });
  ipcMain.handle('flash-master',async(_event,port,confirmed)=>{
    if(confirmed!==true)throw Error('Confirm replacing the identified DCSBIOSKit Master firmware');
    if(flashing)throw Error('An upload is already running');
    if(!(settings.masterPorts??[]).includes(port))throw Error('Connect this port as DCSBIOSKit Main / Master Controller first');
    if(!(await ports.list()).some(p=>p.path===port))throw Error('Selected master port is disconnected');
    flashing=true;bridge.panel.allowActions=false;flashState={busy:true,log:['Uploading master routing firmware; live controls disabled.']};
    try{
      const serial=bridge.devices.get(port)?.port;
      const closed=serial?.isOpen?new Promise(resolve=>serial.once('close',resolve)):Promise.resolve();
      bridge.detach(port);await closed;
      const root=app.isPackaged?path.join(process.resourcesPath,'firmware-images'):path.join(base,'firmware-images');
      const tools=app.isPackaged?path.join(process.resourcesPath,'tools/avrdude'):path.join(base,'tools/avrdude');
      const result=await flashMaster({root,tools,port,confirmed:true,progress:message=>{flashState.log.push(message);flashState.log=flashState.log.slice(-80);}});
      await new Promise(resolve=>setTimeout(resolve,1200));bridge.attach(port,'dcsbios-master');flashState.log.push(result.message);return result;
    }catch(e){flashState.log.push(e.message);throw e;}finally{flashing=false;flashState.busy=false;}
  });
  ipcMain.handle('ports', () => ports.list());
  ipcMain.handle('wifi-setup',(_event,port)=>{const d=bridge.devices.get(port);if(!d||d.protocol==='dcsbios'||!d.port?.isOpen)throw Error('Connect the ESP32 with USB JSON first');bridge.send(d,{v:1,type:'wifi_setup'});return 'Setup requested. Connect to the StarPanel Wi-Fi network (password StarPanel123), then open http://192.168.4.1/';});
  ipcMain.handle('catalog', () => catalog(schema).map(f=>({...f,bios:BIOS_FIELDS[f.path]??null})));
  ipcMain.handle('input-reference',()=>JSON.parse(fs.readFileSync(path.join(__dirname,'assets/input-reference.json'))));
  ipcMain.handle('mode', (_event, demo) => {if (typeof demo !== 'boolean') throw Error('Invalid mode'); start(demo);});
  ipcMain.handle('arm', (_event, enabled) => {if (typeof enabled !== 'boolean') throw Error('Invalid state');if(enabled&&!bridge.status().inputsSupported)throw Error('This game version exposes read-only telemetry');bridge.panel.allowActions = enabled;});
  ipcMain.handle('device', async (_event, port, attach, protocol = 'json') => {
    if(flashing)throw Error('Wait for firmware upload to finish');
    if (typeof port !== 'string' || typeof attach !== 'boolean') throw Error('Invalid device');
    if (!['json', 'dcsbios','dcsbios-master'].includes(protocol)) throw Error('Invalid protocol');
    if (attach && !(await ports.list()).some(p => p.path === port)) throw Error('Select a detected port');
    const existing=bridge.devices.get(port);
    if(attach&&existing&&(existing.protocol??'json')!==protocol){
      const closed=existing.port?.isOpen?new Promise(resolve=>existing.port.once('close',resolve)):Promise.resolve();
      bridge.detach(port);await closed;
    }
    settings.ports = settings.ports.filter(p => typeof p === 'string' ? p !== port : p.path !== port);
    if (attach) {bridge.attach(port, protocol); settings.ports.push({path: port, protocol});}
    else bridge.detach(port);
    if(attach&&protocol==='dcsbios-master')settings.masterPorts=[...new Set([...(settings.masterPorts??[]),port])];
    saveSettings();
  });
  ipcMain.handle('press', (_event, button) => {if (typeof button !== 'string') throw Error('Invalid button'); return bridge.press(button);});
  ipcMain.handle('save-config', (_event, text) => {
    if (typeof text !== 'string' || text.length > 32000) throw Error('Configuration too large');
    const config = JSON.parse(text);
    for (const key of ['fields', 'buttons']) {
      if (!config[key] || Array.isArray(config[key]) || typeof config[key] !== 'object') throw Error(`Missing ${key} object`);
      if (Object.keys(config[key]).length > 32) throw Error('Maximum 32 fields/buttons');
      for (const [alias, value] of Object.entries(config[key])) {
        if (!/^[a-z][a-z0-9_]{0,31}$/.test(alias) || typeof value !== 'string' || value.length > 200) throw Error('Invalid mapping');
      }
    }
    const valid = new Set(catalog(schema).map(row => row.path));
    for (const value of Object.values(config.fields)) if (!valid.has(value)) throw Error(`Unknown schema path: ${value}`);
    // Keep serial packets within the starter firmware buffer; use multiple panels for larger layouts.
    if (JSON.stringify(config.fields).length > 3000) throw Error('Too many field mappings');
    fs.copyFileSync(configPath, `${configPath}.bak`);
    fs.writeFileSync(`${configPath}.tmp`, JSON.stringify(config, null, 2) + '\n');
    fs.renameSync(`${configPath}.tmp`, configPath);
    const demo = bridge.demo; start(demo);
    return config;
  });
  if(liveCheck){
    const timeout=setTimeout(()=>{console.error('LIVE_CHECK_FAILED: no telemetry frames');app.exit(1);},15000);
    let count=0,finished=false;const began=Date.now();
    bridge.on('raw',async()=>{
      if(finished||++count<30)return;finished=true;clearTimeout(timeout);
      const out=path.join(userDir,'validation');fs.mkdirSync(out,{recursive:true});const status=bridge.status();
      fs.writeFileSync(path.join(out,'live-app-check.json'),JSON.stringify({frames:count,elapsedMs:Date.now()-began,packaged:app.isPackaged,inputsSupported:status.inputsSupported,packet:status.packet,actor:bridge.panel.frame?.actor?.vitals,ship:bridge.panel.frame?.vehicle?.state?.class_name},null,2));
      if(status.packet.stale||status.rpcInputsSupported){console.error('LIVE_CHECK_FAILED: invalid live state');app.exit(1);return;}
      win.show();await new Promise(resolve=>setTimeout(resolve,400));fs.writeFileSync(path.join(out,'live-app.png'),(await win.webContents.capturePage()).toPNG());console.log('LIVE_CHECK_OK');app.exit(0);
    });
  }
  if (smoke) {
    win.webContents.once('did-finish-load', async () => {
      win.show();
      const out = app.isPackaged ? path.join(userDir, 'validation') : path.join(base, 'validation'); fs.mkdirSync(out, {recursive: true});
      try {
        const errors = [];
        win.webContents.on('console-message', event => {if (/Error|Uncaught/.test(event.message)) errors.push(event.message);});
        const result = await win.webContents.executeJavaScript(`(async () => {
          await window.bridge.mode(true);
          await new Promise(resolve => setTimeout(resolve, 700));
          const before = await window.bridge.snapshot();
          const ack = await window.bridge.press('gear');
          await new Promise(resolve => setTimeout(resolve, 300));
          const after = await window.bridge.snapshot();
          const fields = await window.bridge.catalog();
          const ports = await window.bridge.ports();
          document.querySelector('[data-tab="live"]').click();
          await new Promise(resolve=>setTimeout(resolve,1200));
          const liveRows=document.querySelectorAll('#liveRows tr').length;
          if(liveRows<3)throw Error('Live Data view did not receive current telemetry');
          document.querySelector('[data-tab="editor"]').click();
          document.getElementById('newPanel').click();
          document.getElementById('panelName').value='Tray smoke panel';
          document.getElementById('addButton').click();
          document.getElementById('componentLabel').value='Gear';
          document.getElementById('componentKey').value='G';
          document.getElementById('addReadout').click();
          await document.getElementById('savePanel').onclick();
          const designs=await window.bridge.panels();
          const design=designs.filter(p=>p.name==='Tray smoke panel').at(-1);
          if(!design||design.components.length!==2||design.components[0].action!=='key_G')throw Error('Panel designer save failed');
          document.getElementById('addLed').click();
          document.getElementById('ledCount').value='7';
          await document.getElementById('savePanel').onclick();
          const logic=(await window.bridge.panels()).find(p=>p.id===design.id).components.find(c=>c.kind==='led');
          if(logic?.count!==7||logic.rules?.length!==3)throw Error('Seven-pixel rule designer failed');
          document.getElementById('addSwitch').click();
          await document.getElementById('savePanel').onclick();
          const maintained=(await window.bridge.panels()).find(p=>p.id===design.id).components.find(c=>c.kind==='switch');
          if(maintained?.offAction!=='key_G'||!maintained.path)throw Error('Maintained switch designer failed');
          document.querySelector('[data-tab="mapping"]').click();
          await new Promise(resolve=>setTimeout(resolve,1100));
          document.getElementById('showInputs').click();
          const inputRows=document.querySelectorAll('#inputGroups .mapping-row').length;
          document.getElementById('showOutputs').click();
          const outputRows=document.querySelectorAll('#outputGroups .mapping-row').length;
          if(inputRows<100||outputRows<170)throw Error('Separate input/output mappings failed');
          return {before: before.packet, after: after.packet, ack, fieldCount: fields.length, portCount: ports.length,
            cards: document.querySelectorAll('.value').length, status: document.getElementById('status').textContent,designerSaved:true,inputRows,outputRows,liveRows};
        })()`);
        if (!result.ack.ok || result.before.stale || result.after.values.gear !== 'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED' || result.cards !== 8) throw Error(JSON.stringify(result));
        win.show(); win.close();
        const trayChecks = {created: !tray.isDestroyed(), closeHides: !win.isDestroyed() && !win.isVisible(), bridgeContinues: bridge.running};
        trayMenu.items.find(item => item.label === 'Open StarPanel Bridge').click();
        trayChecks.menuRestoresWindow = win.isVisible();
        if (Object.values(trayChecks).some(value => !value)) throw Error(JSON.stringify(trayChecks));
        fs.writeFileSync(path.join(out, 'desktop-smoke.json'), JSON.stringify({...result, trayChecks, packaged: app.isPackaged, configPath, errors}, null, 2));
        await win.webContents.executeJavaScript(`document.getElementById('welcome').open=false;document.querySelector('[data-tab="editor"]').click();document.getElementById('componentList').children[2].click();window.scrollTo(0,0);`);
        await new Promise(resolve=>setTimeout(resolve,300));
        fs.writeFileSync(path.join(out, 'desktop-designer.png'), (await win.webContents.capturePage()).toPNG());
        await win.webContents.executeJavaScript(`document.querySelector('[data-tab="panels"]').click();window.scrollTo(0,0);`);
        fs.writeFileSync(path.join(out, 'desktop-demo.png'), (await win.webContents.capturePage()).toPNG());
        if (errors.length) throw Error(errors.join('\n'));
        console.log('DESKTOP_SMOKE_OK'); app.exit(0);
      } catch (err) {fs.writeFileSync(path.join(out, 'desktop-error.txt'), err.stack); console.error(err); app.exit(1);}
    });
  }
});
app.on('before-quit', () => {quitting = true; ++networkGeneration; network?.stop(); clearInterval(trayTimer); bridge?.stop(); tray?.destroy();});
app.on('window-all-closed', () => {});
