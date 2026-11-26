import test from 'node:test';
import assert from 'node:assert/strict';
import grpc from '@grpc/grpc-js';
import {Panel, Lines, atPath} from '../src/panel.mjs';
import {Game, loadSchema, codec, SERVICE} from '../src/game.mjs';
import {Bridge} from '../src/bridge.mjs';
import {catalog} from '../src/catalog.mjs';
import {EventEmitter} from 'node:events';
const config = {fields: {speed: 'vehicle.state.flight.instruments.speed'}, buttons: {gear: 'v_deploy_landing_system'}};
function fixture(options = {}) {
  let now = 1000, calls = 0;
  const game = {call: async () => {calls++; return {status: 'TRIGGER_GAME_ACTION_STATUS_OK'};}};
  const panel = new Panel({config, game, allowActions: true, now: () => now, ...options});
  panel.update({vehicle: {state: {flight: {instruments: {speed: 0}}}}});
  panel.actions.add(config.buttons.gear); panel.packet();
  const cmd = id => ({v: 1, type: 'press', id, session: panel.session, seq: panel.seq, button: 'gear'});
  return {panel, cmd, calls: () => calls, advance: ms => {now += ms;}};
}
test('absent values remain null; explicit zero and false survive', () => {
  assert.equal(atPath({a: 0}, 'a'), 0); assert.equal(atPath({a: false}, 'a'), false);
  assert.equal(atPath({}, 'a.b'), null);
  assert.equal(atPath({altitude:3.4028234663852886e38},'altitude'),null);
  const f = fixture(); assert.equal(f.panel.packet().values.speed, 0);
  f.advance(2001); assert.equal(f.panel.packet().values.speed, null);
});
test('LIVE 4.10.3 schema is read-only and rejects action RPCs locally',async()=>{
  const root=loadSchema(new URL('../schema/live/sc_extrait.desc',import.meta.url));const game=new Game(root);
  try{assert.equal(game.supports('TelemetryStream'),true);assert.equal(game.supports('TriggerGameAction'),false);
    await assert.rejects(game.call('ListTriggerableActions'),e=>e.code===grpc.status.UNIMPLEMENTED);
  }finally{game.close();}
});
test('commands enforce live allowlist, freshness, session, deduplication, and rate limit', async () => {
  const f = fixture();
  assert.equal((await f.panel.command({...f.cmd('x'), session: 'old'})).ok, false);
  assert.equal((await f.panel.command(f.cmd('a'))).ok, true);
  assert.equal((await f.panel.command(f.cmd('a'))).ok, false);
  assert.equal((await f.panel.command(f.cmd('b'))).ok, false);
  f.advance(201); f.panel.actions.clear();
  assert.equal((await f.panel.command(f.cmd('c'))).ok, false);
  f.panel.actions.add(config.buttons.gear); f.advance(2001);
  assert.equal((await f.panel.command(f.cmd('d'))).ok, false); assert.equal(f.calls(), 1);
});
test('read-only and unknown button never call game', async () => {
  const f = fixture({allowActions: false});
  assert.equal((await f.panel.command(f.cmd('a'))).ok, false);
  assert.equal((await f.panel.command({...f.cmd('b'), button: 'unknown'})).ok, false);
  assert.equal(f.calls(), 0);
});
test('timed-out actions are not retried', async () => {
  let calls = 0;
  const f = fixture({game: {call: async () => {calls++; throw Error('deadline');}}});
  const result = await f.panel.command(f.cmd('a'));
  assert.match(result.message, /Outcome unknown/); assert.equal(calls, 1);
});
test('serial framing tolerates chunks and discards overflow', () => {
  const lines = []; const parser = new Lines(line => lines.push(line), 10);
  parser.feed('{"a":'); parser.feed('1}\n' + 'x'.repeat(20)); parser.feed('\n{}\n');
  assert.deepEqual(lines, ['{"a":1}', '{}']);
});
test('real gRPC transport streams frames, discovers actions and encodes commands', async t => {
  const root = loadSchema(new URL('../schema/local.desc', import.meta.url));
  const server = new grpc.Server(); let received;
  const definition = {};
  for (const name of ['TelemetryStream', 'ListTriggerableActions', 'TriggerGameAction']) {
    const req = codec(root, `${name}Request`), res = codec(root, `${name}Response`);
    definition[name] = {path: `/${SERVICE}/${name}`, requestStream: false, responseStream: name === 'TelemetryStream',
      requestSerialize: req.serialize, requestDeserialize: req.deserialize, responseSerialize: res.serialize, responseDeserialize: res.deserialize};
  }
  server.addService(definition, {
    TelemetryStream(call) {call.write({vehicle: {state: {flight: {instruments: {speed: 123}}}}}); call.end();},
    ListTriggerableActions(call, cb) {cb(null, {actions: [{action_name: config.buttons.gear}]});},
    TriggerGameAction(call, cb) {received = call.request; cb(null, {status: 'TRIGGER_GAME_ACTION_STATUS_OK'});}
  });
  const port = await new Promise((resolve, reject) => server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (err, port) => err ? reject(err) : resolve(port)));
  const game = new Game(root, `127.0.0.1:${port}`);
  t.after(() => {game.close(); server.forceShutdown();});
  assert.equal((await game.call('ListTriggerableActions')).actions[0].action_name, config.buttons.gear);
  assert.equal((await game.call('TriggerGameAction', {action_name: config.buttons.gear})).status, 'TRIGGER_GAME_ACTION_STATUS_OK');
  assert.equal(received.action_name, config.buttons.gear);
  const frame = await new Promise((resolve, reject) => {game.stream(resolve, err => {if (err) reject(err);});});
  assert.equal(atPath(frame, config.fields.speed), 123);
  assert.equal(atPath(frame, 'vehicle.state.flight.instruments.altitude'), null);
  assert.ok(catalog(root).some(row => row.path.includes('quantum_travel')));
});
test('simulator changes gear through same command path without game connection', async t => {
  const bridge = new Bridge({config, game: {close() {}}, demo: true});
  t.after(() => bridge.stop()); bridge.start();
  await new Promise(resolve => bridge.once('raw', resolve)); bridge.panel.packet();
  assert.equal((await bridge.press('gear')).ok, true);
  await new Promise(resolve => bridge.once('raw', resolve));
  assert.equal(bridge.panel.frame.vehicle.state.flight.state.gear, 'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED');
});
test('two serial panels subscribe independently and return button commands', async t => {
  const ports = new Map();
  class MockSerial extends EventEmitter {
    constructor(options) {super(); this.path = options.path; this.written = []; ports.set(this.path, this);}
    open(cb) {this.isOpen = true; queueMicrotask(() => cb());}
    write(data, cb) {this.written.push(JSON.parse(data)); queueMicrotask(() => cb());}
    drain(cb) {queueMicrotask(cb);}
    close() {this.isOpen = false; this.emit('close');}
  }
  const bridge = new Bridge({config, game: {close() {}}, demo: true, Serial: MockSerial});
  t.after(() => bridge.stop()); bridge.start(); bridge.attach('PANEL1'); bridge.attach('PANEL2');
  ports.get('PANEL1').emit('data', Buffer.from('null\n{"v":1,"type":"subscribe","fields":["speed"],"name":"Speed"}\n'));
  ports.get('PANEL2').emit('data', Buffer.from('{"v":1,"type":"subscribe","fields":[],"name":"Buttons"}\n'));
  await new Promise(resolve => bridge.once('telemetry', resolve));
  await new Promise(resolve => setImmediate(resolve));
  const first = ports.get('PANEL1').written.find(p => p.type === 'telemetry');
  const second = ports.get('PANEL2').written.find(p => p.type === 'telemetry');
  assert.deepEqual(Object.keys(first.values), ['speed']); assert.deepEqual(second.values, {});
  ports.get('PANEL2').emit('data', Buffer.from(JSON.stringify({v: 1, type: 'press', id: 'board2:1', button: 'gear', session: second.session, seq: second.seq}) + '\n'));
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(ports.get('PANEL2').written.some(p => p.type === 'ack' && p.ok));
  assert.equal(bridge.demoGear, true);
  bridge.detach('PANEL1'); assert.equal(bridge.devices.size, 1);
});
