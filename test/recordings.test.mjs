import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sanitizeFrame,sanitizeRecording} from '../src/recordings.mjs';
import {replayRecords} from '../src/replay.mjs';
const fields={fields:{gear:'vehicle.state.flight.state.gear',altitude:'vehicle.state.flight.instruments.altitude',speed:'vehicle.state.flight.instruments.speed'},buttons:{}};
test('recording allowlist removes identifiers, arbitrary strings and unknown data, retaining false and zero',()=>{
 const frame={actor:{name:'PRIVATE PLAYER',vitals:{health:{current:0,max:100}},location:{name:'PRIVATE LOCATION'}},vehicle:{state:{name:'PRIVATE ENTITY',power:{powerplants:false},flight:{state:{gear:'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED'},instruments:{speed:0}}}},wifi:{password:'PRIVATE SECRET'}};
 const safe=sanitizeFrame(frame),text=JSON.stringify(safe);
 assert.doesNotMatch(text,/PRIVATE|password|location/);assert.equal(safe.vehicle.state.power.powerplants,false);assert.equal(safe.vehicle.state.flight.instruments.speed,0);
 assert.deepEqual(sanitizeFrame({vehicle:{state:{flight:{state:{gear:'PRIVATE SECRET'},instruments:{speed:Infinity}}}}}),{});
 const records=sanitizeRecording([{time:'2026-11-26T00:00:00Z',frame},{time:'2026-11-26T00:00:01Z',frame}]);assert.equal(records[1].offset_ms,1000);assert.equal(Object.hasOwn(records[0],'time'),false);
 assert.equal(sanitizeRecording([{frame:{}}])[0].offset_ms,null);
});
test('offline gear replay retains transitions, labels all packets demo, and blanks stale data',()=>{
 const rows=fs.readFileSync(new URL('../data/scenarios/gear-cycle.ndjson',import.meta.url),'utf8').trim().split('\n').map(s=>JSON.parse(s));
 const replay=replayRecords(rows,fields);assert.equal(replay[2].packet.values.gear,'VEHICLE_COMPONENT_DEPLOYMENT_STATE_RETRACTED');assert.equal(replay.at(-1).packet.stale,true);assert.equal(replay.at(-1).packet.values.gear,null);assert.ok(replay.every(r=>r.packet.source==='demo'));
 assert.throws(()=>replayRecords([{offset_ms:2},{offset_ms:1}],fields),/ordered/);
});
test('public recorded snapshots replay observed measurements and the altitude sentinel without private identifiers',()=>{
 for(const name of ['live-4.10.3-character','live-4.10.3-seated']){
  const sample=JSON.parse(fs.readFileSync(new URL('../data/samples/'+name+'.json',import.meta.url)));
  assert.equal(sample.provenance.kind,'recorded-sanitized');const output=replayRecords([{offset_ms:0,frame:sample.frame}],fields)[0];assert.equal(output.packet.source,'demo');
  if(name.endsWith('seated')){assert.equal(output.packet.values.altitude,null);assert.ok(output.packet.values.speed<0.000001);}
  assert.deepEqual(sample.frame,sanitizeFrame(sample.frame));
 }
});
