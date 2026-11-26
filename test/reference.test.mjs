import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {catalog} from '../src/catalog.mjs';
import {loadSchema} from '../src/game.mjs';
import {buildReference,referenceReading} from '../src/reference.mjs';
const live=catalog(loadSchema('schema/live/sc_extrait.desc')),ptu=catalog(loadSchema('schema/local.desc'));
const actions=JSON.parse(fs.readFileSync('desktop/assets/input-reference.json')).actions;
const entries=buildReference({activeFields:live,liveFields:live,ptuFields:ptu,actions,config:{buttons:{gear:'v_deploy_landing_system'}}});
const field=key=>entries.find(e=>e.key===key);
const snapshot={actions:[],demo:false,packet:{stale:false},raw:{vehicle:{state:{lights_enabled:false,flight:{instruments:{speed:0}}}}}};
test('reference separates supported LIVE paths and historical actions from PTU definitions',()=>{
 assert.equal(entries.filter(e=>e.kind==='output').length,174);
 assert.equal(entries.filter(e=>e.kind==='output'&&!e.liveSchema).length,50);
 assert.equal(entries.filter(e=>e.kind==='input').length,112);
 assert.equal(field('game.debug.fps').activeSchema,false);
 assert.equal(referenceReading(field('game.debug.fps'),snapshot).state,'PTU reference only');
 assert.equal(referenceReading(field('v_lights_on'),snapshot).state,'Reference only');
 assert.equal(referenceReading(field('v_lights_on'),{...snapshot,actions:['v_lights_on']}).state,'Advertised by game');
});
test('reference preserves false and zero while rejecting stale, absent and sentinel values',()=>{
 assert.equal(referenceReading(field('vehicle.state.lights_enabled'),snapshot).value,false);
 assert.equal(referenceReading(field('vehicle.state.flight.instruments.speed'),snapshot).value,0);
 assert.equal(referenceReading(field('actor.vitals.oxygen.current'),snapshot).state,'Not received');
 assert.equal(referenceReading(field('vehicle.state.lights_enabled'),{...snapshot,packet:{stale:true}}).value,null);
 assert.equal(referenceReading(field('vehicle.state.flight.instruments.speed'),{...snapshot,raw:{vehicle:{state:{flight:{instruments:{speed:3.4028234663852886e38}}}}}}).state,'Unavailable');
});
test('reference code matches fixed bus listeners and offers no invented addresses for other outputs',()=>{
 const speed=field('vehicle.state.flight.instruments.speed');assert.equal(speed.bios.address,0x5010);assert.match(speed.snippets.arduino,/StringBuffer<7> readout\(0x5010/);
 assert.equal(field('game.debug.fps').snippets.arduino,null);
 assert.equal(field('weapons.countermeasures').snippets.component,null);
 assert.equal(JSON.parse(speed.snippets.mapping).fields.my_readout,speed.key);
});
test('new runtime-advertised actions join the lookup without editing the historical snapshot',()=>{
 const current=buildReference({activeFields:live,liveFields:live,ptuFields:ptu,actions,advertisedActions:[{action_name:'future_game_action',category:'new_system',holdable:true}]});
 const entry=current.find(e=>e.key==='future_game_action');assert.equal(entry.holdable,true);assert.equal(entry.category,'new_system');
 assert.equal(referenceReading(entry,{...snapshot,actions:['future_game_action']}).state,'Advertised by game');
 assert.equal(entry.descriptionSource,'Unreviewed action name');
});
test('every bundled field and action has reviewed purpose text without inventing unknown units',()=>{
 for(const entry of entries){assert.ok(entry.label&&entry.description,entry.key);assert.equal(entry.descriptionSource,'StarPanel reference notes',entry.key);}
 assert.equal(field('vehicle.state.flight.state.gear').label,'Landing gear position');
 assert.match(field('v_retract_landing_system').description,/retraction/);
 assert.match(field('force_feedback.angular.x.resistance').description,/not a world position/);
 assert.equal(field('vehicle.state.flight.instruments.speed').unit,'m/s');
 assert.equal(field('actor.environment.ambient_radiation_rate').unit,null);
});
test('output contracts show all gear transitions, false semantics, scalar and unavailable rules',()=>{
 for(const e of entries.filter(e=>e.kind==='output'))assert.ok(e.expected.summary&&e.expected.unavailable,e.key);
 const gear=field('vehicle.state.flight.state.gear').expected.states;
 assert.deepEqual(gear.map(s=>s.label),['Unspecified','Retracted','Deploying','Deployed','Retracting']);
 assert.equal(gear.find(s=>s.label==='Deployed').number,3);
 assert.equal(field('vehicle.state.lights_enabled').expected.states.find(s=>s.value===false).label,'Off');
 assert.match(field('vehicle.state.flight.instruments.boost.reserves').expected.summary,/0–1/);
 assert.match(field('actor.environment.ambient_radiation_rate').expected.summary,/not established/);
 assert.match(field('actor.state.uec_balance').expected.summary,/64-bit integer/);
 assert.match(field('weapons.countermeasures').expected.summary,/collection/);
});
