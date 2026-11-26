import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {once} from 'node:events';
import {Bridge} from '../src/bridge.mjs';
import {NetworkPanels} from '../src/network.mjs';
import {Lines} from '../src/panel.mjs';
import {encodeBios, BIOS_MAP} from '../src/dcsbios.mjs';
const config = {fields: {speed: 'vehicle.state.flight.instruments.speed', gear: 'vehicle.state.flight.state.gear'}, buttons: {gear: 'v_deploy_landing_system'}};
test('IP panels authenticate, receive subscriptions, and return actions over real TCP', async t => {
  const bridge = new Bridge({config, game: {close() {}}, demo: true}); bridge.start();
  const token = 'a'.repeat(64); const network = new NetworkPanels(bridge, {token, host: '127.0.0.1', port: 0});
  t.after(() => {network.stop(); bridge.stop();}); await network.start();
  const socket = net.connect(network.port, '127.0.0.1'); t.after(() => socket.destroy());
  const messages = []; const waiters = [];
  socket.on('data', (() => {const lines = new Lines(line => {const m = JSON.parse(line); messages.push(m); for (const w of [...waiters]) if (w.p(m)) {waiters.splice(waiters.indexOf(w),1); w.r(m);}}); return chunk => lines.feed(chunk);})());
  const next = p => messages.find(p) ? Promise.resolve(messages.find(p)) : new Promise((r, reject) => {
    const timer = setTimeout(() => reject(Error('Timed out waiting for IP frame')), 3000);
    waiters.push({p, r: m => {clearTimeout(timer); r(m);}});
  });
  await once(socket, 'connect');
  socket.write(JSON.stringify({v:1, type:'subscribe', token, name:'Flight display', fields:['speed']})+'\n');
  await next(m => m.type === 'subscribed'); const frame = await next(m => m.type === 'telemetry');
  assert.deepEqual(Object.keys(frame.values), ['speed']); assert.equal(frame.source, 'demo');
  socket.write(JSON.stringify({v:1,type:'press',id:'tcp:1',session:frame.session,seq:frame.seq,button:'gear'})+'\n');
  assert.equal((await next(m => m.type === 'ack')).ok, true); assert.equal(bridge.demoGear, true);
  assert.equal(network.status().clients[0].name, 'Flight display');
});
test('IP panels reject invalid and non-ASCII tokens without disclosing data', async t => {
  const bridge = new Bridge({config, game: {close() {}}, demo: true}); bridge.start();
  const network = new NetworkPanels(bridge, {token:'a'.repeat(64), host:'127.0.0.1',port:0});
  t.after(() => {network.stop();bridge.stop();}); await network.start();
  for (const token of ['wrong', 'é'.repeat(64)]) {
    const socket = net.connect(network.port,'127.0.0.1'); let bytes=0;
    socket.on('data', data => {bytes+=data.length;}); await once(socket,'connect');
    socket.write(JSON.stringify({v:1,type:'subscribe',token,fields:['speed']})+'\n');
    await once(socket,'close'); assert.equal(bytes,0);
  }
});
test('DCS-BIOS adapter writes private addresses, strings, stale status and end marker', () => {
  function decode(bytes) {
    assert.deepEqual([...bytes.subarray(0,4)],[85,85,85,85]); const map=new Map();
    for(let i=4;i<bytes.length;) {const address=bytes.readUInt16LE(i),size=bytes.readUInt16LE(i+2); map.set(address,bytes.subarray(i+4,i+4+size));i+=4+size;}
    return map;
  }
  const packet={stale:false,connected:true,source:'demo',values:{speed:123,altitude:800,gear:'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED',lights:true}};
  const map=decode(encodeBios(packet)); assert.equal(map.get(BIOS_MAP.status).readUInt16LE(),3);
  assert.equal(map.get(BIOS_MAP.speed).toString().replaceAll('\0',''),'123');
  assert.equal(map.get(BIOS_MAP.lamps).readUInt16LE(),15); assert.ok(map.has(0xfffe));
  const stale=decode(encodeBios({...packet,stale:true})); assert.equal(stale.get(BIOS_MAP.status).readUInt16LE(),2);
  assert.equal(stale.get(BIOS_MAP.speed).toString().replaceAll('\0',''),'--');
});
