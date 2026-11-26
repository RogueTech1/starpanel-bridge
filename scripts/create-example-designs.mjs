import fs from 'node:fs';
import {validateProfile} from '../src/profiles.mjs';
import {catalog} from '../src/catalog.mjs';
import {loadSchema} from '../src/game.mjs';
const paths=new Set(catalog(loadSchema(new URL('../schema/live/sc_extrait.desc',import.meta.url))).map(f=>f.path));
const read=(id,label,path)=>({id,kind:'readout',label,path});
const power={id:'power1',kind:'switch',label:'Ship power',pin:8,action:'v_power_set_on',offAction:'v_power_set_off',path:'vehicle.state.power.powerplants',onValue:true,offValue:false};
const panels=[
 ['standalone-mega-power',{id:'power001',name:'Mega power & instruments',board:'mega-usb',components:[power,read('speed1','Speed','vehicle.state.flight.instruments.speed'),read('gear01','Gear','vehicle.state.flight.state.gear'),read('oxyg01','Oxygen','actor.vitals.oxygen.current')]}],
 ['esp32-flight-display',{id:'espread1',name:'ESP32 flight display',board:'esp32',components:[read('speed1','Speed','vehicle.state.flight.instruments.speed'),read('radar1','Radar alt','vehicle.state.flight.instruments.radar_altitude'),read('fuel01','Hydrogen','vehicle.state.flight.instruments.hydrogen_fuel'),read('gear01','Gear','vehicle.state.flight.state.gear')]}],
 ['dcsbioskit-mega-slave-1',{id:'dcsmega1',name:'DCSBIOSKit Mega slave 1',board:'mega',address:1,components:[power,read('speed1','Speed','vehicle.state.flight.instruments.speed'),read('gear01','Gear','vehicle.state.flight.state.gear')]}],
 ['dcsbioskit-nano-slave-2',{id:'nanosl02',name:'DCSBIOSKit Nano slave 2',board:'nano',address:2,components:[{id:'gearbt',kind:'button',label:'Gear button',pin:8,action:'v_deploy_landing_system'},read('alt001','Altitude','vehicle.state.flight.instruments.altitude'),read('gear01','Gear','vehicle.state.flight.state.gear')]}]
];
fs.mkdirSync('examples',{recursive:true});for(const [name,panel]of panels){validateProfile(panel,paths);fs.writeFileSync(`examples/${name}.starpanel.json`,JSON.stringify({format:'starpanel-1',panel},null,2)+'\n');}
console.log(`Generated and validated ${panels.length} panel examples.`);
