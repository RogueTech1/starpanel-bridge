// For SLAVES only. Never upload a slave sketch to a DCSBIOSKit master.
#include <Arduino.h>
#define DCSBIOS_DISABLE_SERVO
#ifdef SC_RS485
#define DCSBIOS_RS485_SLAVE 1
#define TXENABLE_PIN 2
#define DCSBIOS_DEFER_RS485_PROCESSING
#define DCSBIOS_INCOMING_DATA_BUFFER_SIZE 256
#else
#define DCSBIOS_DEFAULT_SERIAL
#endif
#include <DcsBios.h>
#include <U8x8lib.h>
U8X8_SSD1306_128X64_NONAME_HW_I2C display(U8X8_PIN_NONE);
char speedText[9]="--",altitudeText[11]="--",gearText[13]="--",oxygenText[9]="--";
unsigned int flags=0,lamps=0;unsigned long received=0,paint=0;
void onStatus(unsigned int value){flags=value;}
void onLamps(unsigned int value){lamps=value;}
void onHeartbeat(unsigned int){received=millis();}
void onSpeed(char* v){strncpy(speedText,v,8);speedText[8]=0;}
void onAltitude(char* v){strncpy(altitudeText,v,10);altitudeText[10]=0;}
void onGear(char* v){strncpy(gearText,v,12);gearText[12]=0;}
void onOxygen(char* v){strncpy(oxygenText,v,8);oxygenText[8]=0;}
DcsBios::IntegerBuffer status(0x5000,0xffff,0,onStatus);
DcsBios::IntegerBuffer indicators(0x5002,0xffff,0,onLamps);
DcsBios::IntegerBuffer heartbeat(0xfffe,0xffff,0,onHeartbeat);
// Use LENGTH-1 because DCS-BIOS listener ranges include the terminating byte.
DcsBios::StringBuffer<7> speed(0x5010,onSpeed);
DcsBios::StringBuffer<9> altitude(0x5020,onAltitude);
DcsBios::StringBuffer<11> gear(0x5030,onGear);
DcsBios::StringBuffer<7> oxygen(0x5040,onOxygen);
DcsBios::ActionButton gearButton("SC_GEAR","1",8);
DcsBios::ActionButton lightsButton("SC_LIGHTS","1",9);
DcsBios::ActionButton flashlightButton("SC_FLASHLIGHT","1",10);
void setup(){
 pinMode(6,OUTPUT);pinMode(7,OUTPUT);DcsBios::setup();
 display.begin();display.setFont(u8x8_font_chroma48medium8_r);
}
void row(uint8_t y,const char* label,const char* value){
 char text[17];snprintf(text,sizeof(text),"%-5s%-11s",label,value);display.drawString(0,y,text);
}
void loop(){
 DcsBios::loop();bool valid=(flags&1)&&received&&millis()-received<2000;
 digitalWrite(6,valid);digitalWrite(7,valid&&(lamps&1));
 if(millis()-paint>250){paint=millis();display.drawString(0,0,(flags&2)?"SC BRIDGE DEMO  ":"SC BRIDGE LIVE  ");
  if(!valid){display.drawString(0,1,"NO FRESH DATA   ");for(uint8_t y=2;y<6;y++)display.drawString(0,y,"                ");}
  else{row(1,"SPD",speedText);row(2,"ALT",altitudeText);row(3,"GEAR",gearText);row(4,"O2",oxygenText);}
 }
}
