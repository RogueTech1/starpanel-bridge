import test from 'node:test';
import assert from 'node:assert/strict';
import {derivedValues} from '../src/derived.mjs';
import {Panel,atPath} from '../src/panel.mjs';
import {catalog,panelCatalog} from '../src/catalog.mjs';
import {loadSchema} from '../src/game.mjs';
import {localEndpoint} from '../src/endpoint.mjs';
const frame={weapons:{weapons:[{ready_to_fire:true},{ready_to_fire:false},{}],countermeasures:[{type:'COUNTERMEASURE_TYPE_DECOY',amount:4},{type:'COUNTERMEASURE_TYPE_DECOY',amount:2},{type:'COUNTERMEASURE_TYPE_NOISE'}]}};
test('computed readouts count received weapons and typed stock without inferring capacity',()=>{
 const values=derivedValues(frame);assert.equal(values.weapon_count,3);assert.equal(values.weapons_ready,1);assert.equal(values.weapon_ready_fraction,1/3);assert.equal(values.decoys_remaining,6);assert.equal(values.noise_remaining,0);
 const empty=derivedValues({weapons:{weapons:[],countermeasures:[]}});assert.equal(empty.weapon_count,0);assert.equal(empty.weapon_ready_fraction,null);assert.equal(empty.decoys_remaining,null);
 for(const value of Object.values(derivedValues({})))assert.equal(value,null);
 assert.equal(derivedValues({weapons:{weapons:[{ready_to_fire:'true'}]}}).weapons_ready,null);
 assert.equal(derivedValues({weapons:{countermeasures:[{type:'COUNTERMEASURE_TYPE_DECOY',amount:-1}]}}).decoys_remaining,null);
});
test('computed fields travel through normal mapping freshness guards without changing the raw frame',()=>{
 let now=0;const p=new Panel({config:{buttons:{},fields:{stock:'derived.decoys_remaining'}},game:{},now:()=>now});p.update(frame);assert.equal(p.packet().values.stock,6);assert.equal(frame.derived,undefined);
 now=2001;assert.equal(p.packet().values.stock,null);assert.equal(atPath({derived:{decoys_remaining:999}},'derived.decoys_remaining'),null);
 const root=loadSchema('schema/live/sc_extrait.desc');assert.equal(catalog(root).length,124);assert.equal(panelCatalog(root).length,129);
});
test('custom endpoints remain loopback-only with a validated non-privileged port',()=>{
 assert.equal(localEndpoint(), '127.0.0.1:2942');assert.equal(localEndpoint(50051),'127.0.0.1:50051');
 for(const value of [0,1023,65536,2942.5,'50051','0.0.0.0:2942',NaN])assert.throws(()=>localEndpoint(value),/port/);
});
