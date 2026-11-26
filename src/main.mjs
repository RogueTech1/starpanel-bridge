import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import readline from 'node:readline';
import {SerialPort} from 'serialport';
import {Game, loadSchema} from './game.mjs';
import {Bridge} from './bridge.mjs';
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = name => {const i = args.indexOf(name); if (i < 0) return null; if (!args[i+1] || args[i+1].startsWith('--')) throw Error(`${name} needs a value`); return args[i+1];};
if (args.includes('--help')) {
  console.log('node src/main.mjs [--demo] [--port COM5,COM6] [--allow-actions] [--schema file.desc] [--config file.json] [--record] [--seconds N]\n--ports lists serial ports. Commands: status, raw, actions, press gear, press lights, quit.');
  process.exit(0);
}
if (args.includes('--ports')) {console.table(await SerialPort.list()); process.exit(0);}
const demo = args.includes('--demo');
const config = JSON.parse(fs.readFileSync(option('--config') ?? path.join(base, 'panel.json')));
const local = path.join(base, 'schema/live/sc_extrait.desc');
const schemaPath = option('--schema') ?? (fs.existsSync(local) ? local : path.join(base, 'vendor/sc-telemetry-deck/schema/sc_extrait.desc'));
const game = demo ? {close() {}} : new Game(loadSchema(schemaPath));
const bridge = new Bridge({config, game, demo, allowActions: args.includes('--allow-actions')});
let recording;
if (args.includes('--record')) {
  fs.mkdirSync(path.join(base, 'recordings'), {recursive: true});
  recording = fs.createWriteStream(path.join(base, 'recordings', `${Date.now()}.ndjson`));
  recording.on('error', err => {console.error('Recording stopped:', err.message); recording = null;});
  bridge.on('raw', frame => {if (recording && !recording.writableNeedDrain) recording.write(JSON.stringify({time: new Date().toISOString(), frame}) + '\n');});
}
bridge.on('log', entry => console.log(entry.message));
let ticks = 0;
bridge.on('telemetry', packet => {if (++ticks % 5 === 0) console.log(JSON.stringify(packet));});
bridge.start();
const protocol=option('--protocol')??'json';if(!['json','dcsbios','dcsbios-master'].includes(protocol))throw Error('Use --protocol json, dcsbios or dcsbios-master');
for (const port of option('--port')?.split(',') ?? []) bridge.attach(port,protocol);
console.log(`${demo ? 'SIMULATOR: no game commands' : 'LIVE GAME'} | ${bridge.panel.allowActions ? 'actions enabled' : 'read-only'}`);
console.log('Commands: status, raw, actions, press gear, press lights, quit');
const terminal = readline.createInterface({input: process.stdin});
terminal.on('line', async line => {
  const [verb, button] = line.trim().split(/\s+/);
  if (verb === 'quit') return shutdown();
  if (verb === 'status') console.log(bridge.status());
  else if (verb === 'raw') console.dir(bridge.panel.frame, {depth: null});
  else if (verb === 'actions') {await bridge.refreshActions(); console.log([...bridge.panel.actions]);}
  else if (verb === 'press') console.log(await bridge.press(button));
});
const seconds = option('--seconds');
const deadline = seconds ? setTimeout(shutdown, Number(seconds) * 1000) : null;
let stopped = false;
function shutdown() {if (stopped) return; stopped = true; clearTimeout(deadline); bridge.stop(); terminal.close(); recording?.end();}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
