// StarPanel Bridge configurable slave / standalone USB firmware.
// Profile is programmed to EEPROM by the desktop app, without compiling sketches.
#include <Arduino.h>
#include <EEPROM.h>
#include <Wire.h>
uint8_t scSlaveAddress=1;
#define DCSBIOS_DISABLE_SERVO
#ifdef SC_RS485
#define DCSBIOS_RS485_SLAVE scSlaveAddress
#define TXENABLE_PIN 2
#define DCSBIOS_DEFER_RS485_PROCESSING
#define DCSBIOS_INCOMING_DATA_BUFFER_SIZE 128
#else
#define DCSBIOS_DEFAULT_SERIAL
#endif
#include <DcsBios.h>
#include <U8x8lib.h>
struct __attribute__((packed)) ButtonConfig {uint8_t pin,maintained;char name[25];};
struct __attribute__((packed)) ReadoutConfig {uint8_t field;char label[17];};
struct __attribute__((packed)) Profile {char magic[4];uint8_t address,buttons,readouts;ButtonConfig button[8];ReadoutConfig readout[6];uint16_t checksum;};
Profile config;
bool raw[8],stable[8],hasDisplay=false;unsigned long changed[8],received=0,paint=0,lastSwitch=0;uint8_t nextSwitch=0;
unsigned int flags=0;
char values[4][12]={{'-','-',0},{'-','-',0},{'-','-',0},{'-','-',0}};
U8X8_SSD1306_128X64_NONAME_HW_I2C screen(U8X8_PIN_NONE);
void statusChanged(unsigned int v){flags=v;}
void heartbeat(unsigned int){received=millis();}
void speedChanged(char* v){strncpy(values[0],v,11);}
void altitudeChanged(char* v){strncpy(values[1],v,11);}
void gearChanged(char* v){strncpy(values[2],v,11);}
void oxygenChanged(char* v){strncpy(values[3],v,11);}
DcsBios::IntegerBuffer status(0x5000,0xffff,0,statusChanged);
DcsBios::IntegerBuffer tick(0xfffe,0xffff,0,heartbeat);
DcsBios::StringBuffer<7> speed(0x5010,speedChanged);
DcsBios::StringBuffer<9> altitude(0x5020,altitudeChanged);
DcsBios::StringBuffer<11> gear(0x5030,gearChanged);
DcsBios::StringBuffer<7> oxygen(0x5040,oxygenChanged);
bool validPin(uint8_t pin){
#if defined(__AVR_ATmega2560__)
 if(pin<2||pin>53||pin==20||pin==21)return false;
#elif defined(__AVR_ATmega32U4__)
 if(!((pin>=4&&pin<=13)||(pin>=18&&pin<=21)||pin==16))return false;
#else
 if(pin<2||pin>17||pin==13)return false;
#endif
#ifdef SC_RS485
 if(pin==2||pin==4||pin==5||pin==13)return false;
#endif
 return true;
}
bool loadProfile(){EEPROM.get(0,config);uint16_t sum=0;const uint8_t* bytes=(const uint8_t*)&config;
 for(unsigned i=0;i<sizeof(Profile)-2;i++)sum+=bytes[i];
 if(memcmp(config.magic,"SPB1",4)||sum!=config.checksum||config.address<1||config.address>126||config.buttons>8||config.readouts>6)return false;
 for(uint8_t i=0;i<config.buttons;i++){if(!validPin(config.button[i].pin)||config.button[i].name[24]!=0)return false;for(uint8_t j=0;j<i;j++)if(config.button[i].pin==config.button[j].pin)return false;}
 for(uint8_t i=0;i<config.readouts;i++)if(config.readout[i].field>3||config.readout[i].label[16]!=0)return false;
 return true;
}
void setup(){
 if(!loadProfile()){memset(&config,0,sizeof(config));config.address=1;}
 scSlaveAddress=config.address;
 for(uint8_t i=0;i<config.buttons;i++){pinMode(config.button[i].pin,INPUT_PULLUP);raw[i]=stable[i]=digitalRead(config.button[i].pin);}
 DcsBios::setup();Wire.begin();Wire.beginTransmission(0x3c);hasDisplay=Wire.endTransmission()==0;
 if(hasDisplay){screen.begin();screen.setFont(u8x8_font_chroma48medium8_r);}
}
void loop(){
 DcsBios::loop();unsigned long now=millis();bool fresh=(flags&1)&&received&&now-received<2000;
 for(uint8_t i=0;i<config.buttons;i++){bool state=digitalRead(config.button[i].pin);if(state!=raw[i]){raw[i]=state;changed[i]=now;}
  if(state!=stable[i]&&now-changed[i]>35){stable[i]=state;if(fresh&&(config.button[i].maintained||!state))DcsBios::tryToSendDcsBiosMessage(config.button[i].name,state?"0":"1");}}
 if(fresh&&config.buttons&&now-lastSwitch>=300){lastSwitch=now;uint8_t i=nextSwitch++%config.buttons;if(config.button[i].maintained)DcsBios::tryToSendDcsBiosMessage(config.button[i].name,stable[i]?"0":"1");}
 if(!hasDisplay||now-paint<250)return;paint=now;
 screen.drawString(0,0,(flags&2)?"STARPANEL DEMO  ":"STARPANEL LIVE  ");
 if(!fresh){screen.drawString(0,1,"NO FRESH DATA   ");for(uint8_t y=2;y<8;y++)screen.drawString(0,y,"                ");return;}
 for(uint8_t i=0;i<6;i++){char line[17];memset(line,' ',16);line[16]=0;if(i<config.readouts)snprintf(line,sizeof(line),"%-5.5s%-11.11s",config.readout[i].label,values[config.readout[i].field]);screen.drawString(0,i+1,line);}
}
