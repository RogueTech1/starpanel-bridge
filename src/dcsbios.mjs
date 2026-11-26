import {randomUUID} from 'node:crypto';
import {Lines} from './panel.mjs';

// Private Star Citizen address map; do not mix with a DCS aircraft export session.
export const BIOS_MAP = {status: 0x5000, lamps: 0x5002, speed: 0x5010, altitude: 0x5020, gear: 0x5030, oxygen: 0x5040};
function block(address, data) {
  const header = Buffer.alloc(4); header.writeUInt16LE(address); header.writeUInt16LE(data.length, 2);
  return Buffer.concat([header, data]);
}
function word(n) {const b = Buffer.alloc(2); b.writeUInt16LE(n); return b;}
function text(value, size) {
  const b = Buffer.alloc(size); b.write(String(value ?? '--').replace(/[^\x20-\x7e]/g, '?').slice(0, size - 1), 'ascii'); return b;
}
export function encodeBios(packet) {
  const v = packet.values, valid = !packet.stale && packet.connected;
  const gear = valid ? v.gear?.replace('VEHICLE_COMPONENT_DEPLOYMENT_STATE_', '') : null;
  const lamps = valid ? ((gear === 'DEPLOYED' ? 1 : 0) | (v.lights === true ? 2 : 0) | (gear != null ? 4 : 0) | (v.lights != null ? 8 : 0)) : 0;
  return Buffer.concat([Buffer.from([0x55, 0x55, 0x55, 0x55]),
    block(BIOS_MAP.status, word((valid ? 1 : 0) | (packet.source === 'demo' ? 2 : 0))),
    block(BIOS_MAP.lamps, word(lamps)),
    block(BIOS_MAP.speed, text(valid ? v.speed : null, 8)),
    block(BIOS_MAP.altitude, text(valid ? v.altitude : null, 10)),
    block(BIOS_MAP.gear, text(gear, 12)),
    block(BIOS_MAP.oxygen, text(valid ? v.oxygen : null, 8)),
    block(0xfffe, word((packet.seq ?? 0) & 0xffff))]);
}
export class DcsBiosPanel {
  constructor(bridge, path, Serial) {
    Object.assign(this, {bridge, path, Serial, protocol: 'dcsbios', name: 'DCSBIOSKit / DCS-BIOS', wanted: true, busy: false, fields: null});
    this.open();
  }
  open() {
    if (!this.wanted || !this.bridge.running) return;
    this.busy = false;
    const lines = new Lines(line => {
      const match = /^(SC_[A-Z0-9_]{1,24}) ([01])$/.exec(line);
      if (!match) return;
      const custom=this.bridge.panel.config.legacyInputs??{};
      const button = Object.hasOwn(custom,match[1])?custom[match[1]]:{SC_GEAR: 'gear', SC_LIGHTS: 'lights', SC_FLASHLIGHT: 'flashlight'}[match[1]];
      if(!button)return;
      // Legacy protocol has no command/session IDs. Never retry or buffer presses.
      const p = this.bridge.panel;
      if(match[2]==='0'&&!p.config.switches?.[button])return;
      void p.command({v: 1, type: p.config.switches?.[button]?'switch':'press',state:match[2]==='1',id: randomUUID(), session: p.session, seq: p.seq, button})
        .then(ack => this.bridge.log(`${this.path}: ${ack.message}`));
    }, 128);
    this.port = new this.Serial({path: this.path, baudRate: 250000, autoOpen: false});
    this.port.on('data', data => lines.feed(data));
    this.port.on('error', err => this.bridge.log(`${this.path}: ${err.message}`));
    const retry = () => {if (this.wanted && this.bridge.running && !this.retry) this.retry = setTimeout(() => {this.retry = null; this.open();}, 3000);};
    this.port.on('close', retry);
    this.port.open(err => {if (err) {this.bridge.log(`${this.path}: ${err.message}`); retry();} else this.bridge.log(`${this.path}: experimental DCS-BIOS adapter at 250000 baud`);});
  }
  send(packet) {
    if (!this.port?.isOpen || this.busy) return;
    this.busy = true;
    this.port.write(encodeBios(packet), err => {
      if (err) {this.busy = false; this.bridge.log(`${this.path}: ${err.message}`);}
      else this.port.drain(() => {this.busy = false;});
    });
  }
  stop() {
    this.wanted = false; clearTimeout(this.retry);
    if (this.port?.isOpen) this.port.close();
    else if (this.port?.opening) this.port.once('open', () => this.port.close());
  }
}
