import {SerialPort} from 'serialport';
const port=new SerialPort({path:process.env.STARPANEL_TEST_PORT??'COM3',baudRate:115200,autoOpen:false});
port.on('error',e=>console.error(e.message));port.on('data',data=>process.stdout.write(data));
await new Promise((r,j)=>port.open(e=>e?j(e):r()));
await new Promise((r,j)=>port.set({dtr:true,rts:false},e=>e?j(e):r()));
if(process.argv.includes('--configure')){
 await new Promise(r=>setTimeout(r,1000));
 const profile={board:'esp32c3supermini',name:'Gear test',transport:'usb',buttons:[],readouts:[],leds:[{pin:3,field:'gear',match:'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED',rules:[{match:'VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED',effect:'pulse',color:'#ff0000',brightness:64,periodMs:2400},{operator:'contains',match:'ING',effect:'blink',color:'#ffff00',brightness:64,periodMs:2000},{match:'VEHICLE_COMPONENT_DEPLOYMENT_STATE_RETRACTED',effect:'solid',color:'#00ff00',brightness:64,periodMs:2400}]}]};
 port.write(JSON.stringify({v:1,type:'configure',id:'direct-test',profile})+'\n');
}
const timer=setInterval(()=>port.write('{"v":1,"type":"identify"}\n'),1000);
await new Promise(r=>setTimeout(r,6000));clearInterval(timer);await new Promise(r=>port.close(r));
