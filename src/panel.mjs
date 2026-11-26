import {randomUUID} from 'node:crypto';
import {apiOnlyConfig,isApiAction} from './api-only.mjs';

export function atPath(value, path) {
  for (const part of path.split('.')) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, part)) return null;
    value = value[part];
  }
  // The game uses FLT_MAX for unavailable instruments (observed altitude in LIVE).
  if(typeof value==='number'&&(!Number.isFinite(value)||Math.abs(value)>=3.402823e38))return null;
  return value ?? null;
}

export class Panel {
  constructor({config, game, demo = false, allowActions = false, now = Date.now}) {
    const migrated=apiOnlyConfig(config);Object.assign(this, {config:migrated.config,disabledLegacyInputs:migrated.disabled,game,demo,allowActions,now});
    this.session = randomUUID();
    this.frame = null; this.received = null; this.seq = 0;
    this.actions = new Set(); this.seen = new Set(); this.lastPress = -Infinity; this.busy = false;
    this.error = 'Waiting for telemetry';
    this.switchStates=new Map();this.switchStatus={};this.reconciling=false;
  }
  update(frame) { this.frame = frame; this.received = this.now(); this.error = null;void this.reconcile(); }
  disconnect(message) { this.frame = null; this.received = null; this.actions.clear(); this.error = message; }
  packet() {
    const age = this.received === null ? null : Math.max(0, this.now() - this.received);
    const fresh = age !== null && age <= 2000;
    return {v: 1, type: 'telemetry', session: this.session, seq: ++this.seq,
      source: this.demo ? 'demo' : 'game', connected: this.frame !== null, stale: !fresh, age_ms: age,
      error: this.error, values: Object.fromEntries(Object.entries(this.config.fields).map(
        ([name, path]) => [name, fresh ? atPath(this.frame, path) : null]))};
  }
  async command(cmd) {
    const reply = (ok, message, response = null) => ({v: 1, type: 'ack', id: cmd?.id ?? null, ok, message, response});
    if (!cmd || cmd.v !== 1 || !['press','switch'].includes(cmd.type) || typeof cmd.id !== 'string' || cmd.id.length > 100)
      return reply(false, 'Invalid command');
    // Session and sequence tie a press to telemetry just seen by this panel.
    if (cmd.session !== this.session || !Number.isInteger(cmd.seq) || cmd.seq > this.seq || cmd.seq < this.seq - 20)
      return reply(false, 'Expired session or sequence');
    if (this.seen.has(cmd.id)) return reply(false, 'Duplicate command');
    this.seen.add(cmd.id);
    if (this.seen.size > 1024) this.seen.delete(this.seen.values().next().value);
    if (this.received === null || this.now() - this.received > 2000) return reply(false, 'Telemetry unavailable or stale');
    if(cmd.type==='switch'){
      if(typeof cmd.state!=='boolean'||!Object.hasOwn(this.config.switches??{},cmd.button))return reply(false,'Unmapped maintained switch');
      const old=this.switchStates.get(cmd.button);
      this.switchStates.set(cmd.button,{state:cmd.state,received:this.now(),attempt:old?.state===cmd.state?old.attempt:null,observed:old?.observed,stableSince:old?.stableSince});
      void this.reconcile();return reply(true,'Physical switch position received');
    }
    if (!Object.hasOwn(this.config.buttons, cmd.button)) return reply(false, 'Unmapped button');
    const action = this.config.buttons[cmd.button];
    return this.perform(action,reply);
  }
  async perform(action,reply){
    if(!isApiAction(action))return reply(false,'API-only: keyboard emulation is not supported');
    if(!this.actions.has(action))return reply(false,'Action not advertised by current game');
    if (!this.demo && !this.allowActions) return reply(false, 'Read-only mode; start with --allow-actions');
    if (this.busy || this.now() - this.lastPress < 200) return reply(false, 'Rate limited');
    this.lastPress = this.now(); this.busy = true;
    try {
      const result = await this.game.call('TriggerGameAction', {action_name: action});
      const ok = result.status === 'TRIGGER_GAME_ACTION_STATUS_OK';
      return reply(ok, ok ? 'RPC accepted; check telemetry for resulting state' : 'Game rejected action', result);
    } catch (err) {
      // A deadline may occur after execution: never retry automatically.
      return reply(false, err.notSent?`Not sent: ${err.message}`:`Outcome unknown: ${err.message}; not retried`);
    } finally { this.busy = false; }
  }
  async reconcile(){
    if(this.reconciling)return;this.reconciling=true;
    try{for(const [alias,physical]of this.switchStates){
      const rule=this.config.switches?.[alias];if(!rule)continue;
      const report=message=>{this.switchStatus[alias]=message;};
      if(this.now()-physical.received>10000){report('Physical panel offline');continue;}
      if(!this.demo&&!this.allowActions){report('Waiting for Enable controls');continue;}
      if(this.received===null||this.now()-this.received>2000){report('Waiting for fresh telemetry');continue;}
      const vehicle=this.frame?.vehicle?.state;
      if(rule.path.startsWith('vehicle.')&&!vehicle){report('Waiting to enter a ship');continue;}
      const actual=atPath(this.frame,rule.path),desired=physical.state?rule.onValue:rule.offValue;
      if(actual===null||typeof actual==='object'){report('Feedback unavailable');continue;}
      if(typeof actual==='string'&&/VEHICLE_COMPONENT_DEPLOYMENT_STATE_(DEPLOYING|RETRACTING)$/.test(actual)){report('Waiting for gear movement to finish');continue;}
      if(String(actual)!==String(rule.onValue)&&String(actual)!==String(rule.offValue)){report('Feedback is outside configured ON/OFF states');continue;}
      const conflict=[...this.switchStates].some(([other,s])=>other!==alias&&this.now()-s.received<=10000&&this.config.switches?.[other]?.path===rule.path&&String(s.state?this.config.switches[other].onValue:this.config.switches[other].offValue)!==String(desired));
      if(conflict){report('Conflicting physical switches');continue;}
      if(String(actual)===String(desired)){physical.attempt=null;physical.observed=null;report('Synchronized');continue;}
      const observed=JSON.stringify([this.session,vehicle?.name??vehicle?.class_name??null,actual,desired]);
      if(physical.observed!==observed){physical.observed=observed;physical.stableSince=this.now();}
      if(this.now()-physical.stableSince<250){report('Waiting for stable feedback');continue;}
      if(physical.attempt===observed){report('Awaiting game state confirmation; no repeat toggle');continue;}
      if(this.busy||this.now()-this.lastPress<1000)continue;
      physical.attempt=observed;
      const result=await this.perform(physical.state?rule.onAction:rule.offAction,(ok,message)=>({ok,message}));
      if(result.message.startsWith('Not sent:'))physical.attempt=null;
      report(result.message);
    }}finally{this.reconciling=false;}
  }
}

// Newline framing, with a bounded buffer and discard-until-newline on overflow.
export class Lines {
  constructor(onLine, max = 2048) { this.onLine = onLine; this.max = max; this.buffer = ''; this.dropping = false; }
  feed(chunk) {
    for (const char of chunk.toString()) {
      if (char === '\n') {
        if (!this.dropping && this.buffer.trim()) this.onLine(this.buffer.trim());
        this.buffer = ''; this.dropping = false;
      } else if (!this.dropping) {
        this.buffer += char;
        if (this.buffer.length > this.max) { this.buffer = ''; this.dropping = true; }
      }
    }
  }
}
