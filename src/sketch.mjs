const outputs={
 'vehicle.state.flight.instruments.speed':{address:'0x5010',length:7},
 'vehicle.state.flight.instruments.altitude':{address:'0x5020',length:9},
 'vehicle.state.flight.state.gear':{address:'0x5030',length:11},
 'actor.vitals.oxygen.current':{address:'0x5040',length:7}
};
export function generateSketch(p){
 if(!['mega','nano'].includes(p.board))throw Error('Sketch export is for DCSBIOSKit Mega/Nano designs');
 const rows=p.components.filter(c=>c.kind==='readout');
 for(const c of rows)if(!outputs[c.path])throw Error('DCS-BIOS prototype readouts support speed, altitude, gear and oxygen; use ESP32 for other fields');
 const literal=text=>JSON.stringify(String(text).replace(/[^\x20-\x7e]/g,'?'));
 return `// Generated Star Citizen slave panel. Never flash the master controller.\n// Give every slave on a bus a unique address (1..126).\n#include <Arduino.h>\n#define DCSBIOS_RS485_SLAVE 1\n#define TXENABLE_PIN 2\n#define DCSBIOS_DEFER_RS485_PROCESSING\n#define DCSBIOS_INCOMING_DATA_BUFFER_SIZE 256\n#define DCSBIOS_DISABLE_SERVO\n#include <DcsBios.h>\n#include <U8x8lib.h>\nU8X8_SSD1306_128X64_NONAME_HW_I2C screen(U8X8_PIN_NONE);\nunsigned int statusFlags=0;unsigned long received=0,paint=0;\nvoid statusChanged(unsigned int v){statusFlags=v;}\nvoid heartbeat(unsigned int){received=millis();}\nDcsBios::IntegerBuffer status(0x5000,0xffff,0,statusChanged);\nDcsBios::IntegerBuffer tick(0xfffe,0xffff,0,heartbeat);\n${rows.map((c,i)=>`char text${i}[${outputs[c.path].length+1}]=\"--\";\nvoid changed${i}(char* value){strncpy(text${i},value,${outputs[c.path].length});text${i}[${outputs[c.path].length}]=0;}\nDcsBios::StringBuffer<${outputs[c.path].length}> output${i}(${outputs[c.path].address},changed${i});`).join('\n')}\n${p.components.filter(c=>c.kind==='button').map(c=>`DcsBios::ActionButton button${c.id}(\"SC_${p.id.toUpperCase()}_${c.id.toUpperCase()}\",\"1\",${c.pin});`).join('\n')}\nvoid setup(){DcsBios::setup();screen.begin();screen.setFont(u8x8_font_chroma48medium8_r);}\nvoid loop(){DcsBios::loop();if(millis()-paint<250)return;paint=millis();bool fresh=(statusFlags&1)&&received&&millis()-received<2000;\nscreen.drawString(0,0,(statusFlags&2)?\"SC BRIDGE DEMO  \":\"SC BRIDGE LIVE  \");\nif(!fresh){screen.drawString(0,1,\"NO FRESH DATA   \");for(byte y=2;y<8;y++)screen.drawString(0,y,\"                \");return;}\n${rows.map((c,i)=>`{char line[17];snprintf(line,sizeof(line),\"%-5.5s%-11.11s\",${literal(c.label)},text${i});screen.drawString(0,${i+1},line);}`).join('\n')}\n}\n`;
}
