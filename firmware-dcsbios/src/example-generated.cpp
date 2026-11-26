// Generated Star Citizen slave panel. Never flash the master controller.
// Give every slave on a bus a unique address (1..126).
#include <Arduino.h>
#define DCSBIOS_RS485_SLAVE 1
#define TXENABLE_PIN 2
#define DCSBIOS_DEFER_RS485_PROCESSING
#define DCSBIOS_INCOMING_DATA_BUFFER_SIZE 256
#define DCSBIOS_DISABLE_SERVO
#include <DcsBios.h>
#include <U8x8lib.h>
U8X8_SSD1306_128X64_NONAME_HW_I2C screen(U8X8_PIN_NONE);
unsigned int statusFlags=0;unsigned long received=0,paint=0;
void statusChanged(unsigned int v){statusFlags=v;}
void heartbeat(unsigned int){received=millis();}
DcsBios::IntegerBuffer status(0x5000,0xffff,0,statusChanged);
DcsBios::IntegerBuffer tick(0xfffe,0xffff,0,heartbeat);
char text0[8]="--";
void changed0(char* value){strncpy(text0,value,7);text0[7]=0;}
DcsBios::StringBuffer<7> output0(0x5010,changed0);
DcsBios::ActionButton buttonabc123("SC_1234ABCD_ABC123","1",8);
void setup(){DcsBios::setup();screen.begin();screen.setFont(u8x8_font_chroma48medium8_r);}
void loop(){DcsBios::loop();if(millis()-paint<250)return;paint=millis();bool fresh=(statusFlags&1)&&received&&millis()-received<2000;
screen.drawString(0,0,(statusFlags&2)?"SC BRIDGE DEMO  ":"SC BRIDGE LIVE  ");
if(!fresh){screen.drawString(0,1,"NO FRESH DATA   ");for(byte y=2;y<8;y++)screen.drawString(0,y,"                ");return;}
{char line[17];snprintf(line,sizeof(line),"%-5.5s%-11.11s","Speed",text0);screen.drawString(0,1,line);}
}
