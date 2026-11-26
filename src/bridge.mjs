import {EventEmitter} from 'node:events';
import {randomUUID} from 'node:crypto';
import {SerialPort} from 'serialport';
import {Panel, Lines} from './panel.mjs';
import {DcsBiosPanel} from './dcsbios.mjs';

export class Bridge extends EventEmitter {
  constructor({config, game, keyboard, demo = false, allowActions = false, Serial = SerialPort}) {
    super();
    this.panel = new Panel({config, game, keyboard, demo, allowActions});
    this.game = game; this.demo = demo; this.Serial = Serial; this.devices = new Map(); this.running = false;
    this.demoGear = false; this.demoLights = false;
    if (demo) this.game.call = async (method, req) => {
      if (method === 'ListTriggerableActions') return {actions: Object.values(this.panel.config.buttons).map(action_name => ({action_name}))};
      if (req.action_name === config.buttons.gear) this.demoGear = !this.demoGear;
      if (req.action_name === config.buttons.lights) this.demoLights = !this.demoLights;
      return {status: 'TRIGGER_GAME_ACTION_STATUS_OK'};
    };
  }
  log(message) { this.emit('log', {time: new Date().toISOString(), message}); }
  async refreshActions() {
    if(this.game.supports&&!this.game.supports('ListTriggerableActions')){this.actionDetails=[];this.panel.actions.clear();return;}
    try {
      const actions = await this.game.call('ListTriggerableActions');
      if (this.running) {this.actionDetails=actions.actions??[];this.panel.actions = new Set(this.actionDetails.map(a => a.action_name));}
    } catch (err) { this.actionDetails=[];this.panel.actions.clear(); this.log(`Actions unavailable: ${err.message}`); }
  }
  receive(frame) { this.panel.update(frame); this.emit('raw', frame); }
  start() {
    this.running = true;
    const connect = () => {
      if (!this.running) return;
      this.panel.disconnect('Connecting to game');
      this.cancelStream = this.game.stream(frame => this.receive(frame), err => {
        const message=err?.message??'Disconnected';
        this.panel.disconnect(message.includes('ECONNREFUSED') ? 'No local telemetry server on 127.0.0.1:2942. Enable startup settings and restart both RSI Launcher and the game. This PTU build may disable the service.' : message);
        this.log(`Game disconnected: ${message}`);
        if (this.running) this.retry = setTimeout(connect, 3000);
      });
      void this.refreshActions();
    };
    if (!this.demo) connect();
    else {
      let t = 0;
      this.demoTimer = setInterval(() => {
        t += 0.1;
        this.receive({vehicle: {state: {lights_enabled: this.demoLights, flight: {
          state: {gear: this.demoGear ? 'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED' : 'VEHICLE_COMPONENT_DEPLOYMENT_STATE_RETRACTED'},
          instruments: {speed: Math.round(120 + 40 * Math.sin(t)), altitude: Math.round(800 + 50 * Math.sin(t / 3)), radar_altitude: 120}
        }}}, actor: {vitals: {health: {current: 100}, oxygen: {current: 100}}}});
      }, 100);
      void this.refreshActions();
    }
    this.actionTimer = setInterval(() => {if (this.panel.frame) void this.refreshActions();}, 10000);
    this.publishTimer = setInterval(() => {
      const packet = this.panel.packet(); this.emit('telemetry', packet);
      for (const d of this.devices.values()) {
        if (d.protocol === 'dcsbios') d.send(packet);
        else {this.send(d, d.fields ? {...packet,
          values: Object.fromEntries(Object.entries(packet.values).filter(([key]) => d.fields.includes(key)))} : packet);
          if(!d.lastIdentify||Date.now()-d.lastIdentify>5000){d.lastIdentify=Date.now();this.send(d,{v:1,type:'identify'});}
        }
      }
    }, 200);
  }
  status() {
    return {demo: this.demo, inputsSupported:!!this.panel.keyboard||this.demo||!this.game.supports||this.game.supports('TriggerGameAction'), rpcInputsSupported:this.demo||!this.game.supports||this.game.supports('TriggerGameAction'), keyboardSupported:!!this.panel.keyboard, allowActions: this.panel.allowActions, actions: [...this.panel.actions], actionDetails:this.actionDetails??[], config: this.panel.config,
      switchStatus:this.panel.switchStatus,
      devices: [...this.devices.values()].map(d => ({port: d.path, open: d.port?.isOpen ?? false, fields: d.fields, name: d.name, role:d.role,info:d.info,protocol: d.protocol ?? 'json'})),
      packet: this.panel.packet()};
  }
  press(button) {return this.panel.command({v: 1, type: 'press', id: randomUUID(), session: this.panel.session, seq: this.panel.seq, button});}
  attach(path, protocol = 'json') {
    if (this.devices.has(path)) return;
    if (protocol === 'dcsbios'||protocol==='dcsbios-master') {const d=new DcsBiosPanel(this,path,this.Serial);if(protocol==='dcsbios-master'){d.role='master';d.name='DCSBIOSKit Master Controller';}this.devices.set(path,d);return;}
    const d = {path, name: path, wanted: true, busy: false, fields: null, acks: []};
    this.devices.set(path, d);
    const open = () => {
      if (!this.running || !d.wanted) return;
      d.busy = false; d.acks = [];
      const lines = new Lines(line => {
        let cmd;
        try {cmd = JSON.parse(line);} catch {this.log(`${path}: malformed JSON ignored`); return;}
        if (!cmd || typeof cmd !== 'object' || Array.isArray(cmd)) {this.log(`${path}: invalid command ignored`); return;}
        if (cmd.type === 'config_ack' && cmd.v === 1) {this.emit('config-ack', {port:path,...cmd}); return;}
        if (cmd.type === 'device_info' && cmd.v === 1) {d.info={board:cmd.board,firmware:cmd.firmware,setupActive:cmd.setupActive,setupSsid:cmd.setupSsid,ip:cmd.ip,transport:cmd.transport,fresh:cmd.fresh,activeRule:cmd.activeRule};return;}
        if (cmd.v === 1 && cmd.type === 'subscribe' && Array.isArray(cmd.fields) && cmd.fields.length <= 64) {
          d.fields = cmd.fields.filter(key => typeof key === 'string' && Object.hasOwn(this.panel.config.fields, key));
          d.name = typeof cmd.name === 'string' ? cmd.name.slice(0, 48) : path;
          this.log(`${path}: subscribed to ${d.fields.join(', ')}`); return;
        }
        void this.panel.command(cmd).then(ack => {this.log(`${path}: ${ack.message}`); this.send(d, ack);});
      });
      const port = new this.Serial({path, baudRate: 115200, autoOpen: false}); d.port = port;
      const retry = () => {if (this.running && d.wanted && !d.retry) d.retry = setTimeout(() => {d.retry = null; open();}, 3000);};
      port.on('data', chunk => lines.feed(chunk));
      port.on('error', err => this.log(`${path}: ${err.message}`)); port.on('close', retry);
      port.open(err => {if (err) {this.log(`${path}: ${err.message}`); retry();} else {port.set?.({dtr:true,rts:false},e=>{if(e)this.log(`${path}: ${e.message}`);});this.log(`${path}: connected at 115200 baud`);}});
    };
    open();
  }
  send(d, packet) {
    if (!d.port?.isOpen) return;
    if (packet.type !== 'telemetry' && packet.type !== 'flush' && d.acks.length < 16) d.acks.push(packet);
    if (d.busy) return;
    const next = d.acks.shift() ?? packet; d.busy = true;
    d.port.write(JSON.stringify(next) + '\n', err => {
      if (err) {d.busy = false; this.log(`${d.path}: ${err.message}`);}
      else d.port.drain(() => {d.busy = false; if (d.acks.length) this.send(d, {type: 'flush'});});
    });
  }
  detach(path) {
    const d = this.devices.get(path); if (!d) return;
    if (d.protocol === 'dcsbios') {d.stop(); this.devices.delete(path); return;}
    d.wanted = false; clearTimeout(d.retry);
    if (d.port?.isOpen) d.port.close();
    else if (d.port?.opening) d.port.once('open', () => d.port.close());
    this.devices.delete(path);
  }
  async program(path, profile) {
    const d=this.devices.get(path);
    if(!d || d.protocol==='dcsbios' || !d.port?.isOpen)throw Error('Connect the board using USB JSON first');
    const id=randomUUID();
    const packet={v:1,type:'configure',id,profile};
    if(Buffer.byteLength(JSON.stringify(packet))>3500)throw Error('Panel configuration is too large');
    return new Promise((resolve,reject)=>{
      const handler=ack=>{if(ack.port===path&&ack.id===id){clearTimeout(timer);this.off('config-ack',handler);ack.ok?resolve(ack):reject(Error(ack.message??'Board rejected configuration'));}};
      const timer=setTimeout(()=>{this.off('config-ack',handler);reject(Error('Board did not acknowledge configuration. Upload supported firmware first.'));},5000);
      this.on('config-ack',handler);this.send(d,packet);
    });
  }
  stop() {
    this.running = false; clearTimeout(this.retry); this.cancelStream?.();
    clearInterval(this.publishTimer); clearInterval(this.actionTimer); clearInterval(this.demoTimer);
    for (const path of [...this.devices.keys()]) this.detach(path);
    this.game.close();
  }
}
