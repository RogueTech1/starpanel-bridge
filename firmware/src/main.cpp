#include <Arduino.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>
#ifdef SC_NETWORK
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
WebServer setupServer(80);DNSServer setupDns;
bool setupActive=false;uint32_t setupStarted=0;
void beginSetup();
WiFiClient client;
uint32_t lastConnectAttempt=0;
String wifiSsid, wifiPassword, bridgeHost, bridgeToken;
uint16_t bridgePort=2943;
bool wifiRestart=false;
bool useNetwork=false;
#endif
#if CONFIG_IDF_TARGET_ESP32S3
constexpr int SDA_PIN=8,SCL_PIN=9;
const char* BOARD="esp32s3";
const int ALLOWED[]={1,2,3,4,5,6,7,10,11,12,13,14,15,16,17,18,21,38,39,40,41,42,47,48};
const int DEFAULT_PINS[]={4,5,6};
#elif defined(SC_S2MINI)
constexpr int SDA_PIN=33,SCL_PIN=35;
const char* BOARD="esp32s2mini";
const int ALLOWED[]={1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,21,34,36,37,38,39,40};
const int DEFAULT_PINS[]={4,5,6};
#elif defined(SC_SUPERMINI)
constexpr int SDA_PIN=6,SCL_PIN=7;
const char* BOARD="esp32c3supermini";
const int ALLOWED[]={0,1,3,4,5,8,10};
const int DEFAULT_PINS[]={4,5,10};
#elif CONFIG_IDF_TARGET_ESP32C3
constexpr int SDA_PIN=8,SCL_PIN=9;
const char* BOARD="esp32c3";
const int ALLOWED[]={0,1,3,4,5,6,7,10};
const int DEFAULT_PINS[]={4,5,6};
#else
constexpr int SDA_PIN=21,SCL_PIN=22;
const char* BOARD="esp32";
const int ALLOWED[]={4,13,14,16,17,18,19,23,25,26,27,32,33};
const int DEFAULT_PINS[]={25,26,27};
#endif
Adafruit_SSD1306 display(128,64,&Wire,-1);
Preferences storage;
struct Button {int pin;char name[25];bool raw,stable,maintained;uint32_t changed;};
struct Readout {char field[25],label[17];String value;};
Button buttons[8];Readout readouts[6];uint8_t buttonCount=3,readoutCount=3;
Adafruit_NeoPixel* pixel=nullptr;char ledField[25]="",ledMatch[101]="";bool ledMatches=false;uint32_t lastLed=0;
String ledOperator="equals",ledEffect="pulse";uint8_t ledR=255,ledG=0,ledB=0,ledBrightness=64;
struct LedRule {String match,op,effect;uint8_t r,g,b,brightness;uint16_t period;};
LedRule ledRules[4];uint8_t ledRuleCount=0;int8_t activeLedRule=-1;
String panelName="Flight panel",result;
uint32_t parseErrors=0;
bool hasDisplay=false,fresh=false,demo=false;
char session[48]="";
uint32_t seq=0,counter=0,bootId,lastFrame=0,lastSubscribe=0,lastPaint=0;
struct Line {char data[4096];size_t used=0;bool dropping=false;};
Line usbLine;
#ifdef SC_NETWORK
Line netLine;
#endif
Stream& connection(){
#ifdef SC_NETWORK
 if(useNetwork)return client;
 return Serial;
#else
 return Serial;
#endif
}
void send(JsonDocument& doc,Stream& stream){serializeJson(doc,stream);stream.print('\n');}
void send(JsonDocument& doc){
#ifdef SC_NETWORK
 if(useNetwork&&!client.connected())return;
#endif
 send(doc,connection());
}
bool allowed(int pin){for(int value:ALLOWED)if(value==pin)return true;return false;}
bool validate(JsonVariantConst p){
 if(!p.is<JsonObjectConst>()||p["buttons"].size()>8||p["readouts"].size()>6)return false;
 if(strcmp(p["board"]|BOARD,BOARD))return false;
 if(!p["buttons"].is<JsonArrayConst>()||!p["readouts"].is<JsonArrayConst>())return false;
 for(JsonObjectConst b:p["buttons"].as<JsonArrayConst>()){
  if(!b["pin"].is<int>()||!allowed(b["pin"])||strlen(b["name"]|"")<1||strlen(b["name"]|"")>24)return false;
  for(JsonObjectConst other:p["buttons"].as<JsonArrayConst>())if(b!=other&&b["pin"]==other["pin"])return false;
 }
 for(JsonObjectConst r:p["readouts"].as<JsonArrayConst>())if(strlen(r["field"]|"")<1||strlen(r["field"]|"")>24||strlen(r["label"]|"")>16)return false;
 if(p["leds"].size()>1)return false;
 for(JsonObjectConst led:p["leds"].as<JsonArrayConst>()){
  if(!led["pin"].is<int>()||!allowed(led["pin"])||strlen(led["field"]|"")<1||strlen(led["field"]|"")>24||strlen(led["match"]|"")>100)return false;
  if((led["count"]|1)<1||(led["count"]|1)>64)return false;
  if(led["rules"].size()>4)return false;
  for(JsonObjectConst b:p["buttons"].as<JsonArrayConst>())if(b["pin"]==led["pin"])return false;
 }
 if(p["wifi"].is<JsonObjectConst>()){
#ifndef SC_NETWORK
  return false;
#else
  if(strlen(p["wifi"]["ssid"]|"")>32||strlen(p["wifi"]["password"]|"")>63||strlen(p["wifi"]["host"]|"")>100||strlen(p["wifi"]["token"]|"")!=64)return false;
#endif
 }
 return true;
}
void apply(JsonVariantConst p){
 for(unsigned i=0;i<buttonCount;i++)pinMode(buttons[i].pin,INPUT);
 if(pixel){pixel->clear();pixel->show();delete pixel;pixel=nullptr;}
 ledField[0]=0;ledMatches=false;
 panelName=p["name"]|"Panel";buttonCount=0;readoutCount=0;
 for(JsonObjectConst b:p["buttons"].as<JsonArrayConst>()){
  Button& button=buttons[buttonCount++];button.pin=b["pin"];strlcpy(button.name,b["name"]|"",sizeof(button.name));
  button.maintained=b["maintained"]|false;
  pinMode(button.pin,INPUT_PULLUP);button.raw=button.stable=digitalRead(button.pin);button.changed=millis();
 }
 for(JsonObjectConst r:p["readouts"].as<JsonArrayConst>()){
  Readout& out=readouts[readoutCount++];strlcpy(out.field,r["field"]|"",sizeof(out.field));strlcpy(out.label,r["label"]|"",sizeof(out.label));out.value="--";
 }
 for(JsonObjectConst led:p["leds"].as<JsonArrayConst>()){
  pixel=new Adafruit_NeoPixel(led["count"]|1,led["pin"].as<int>(),NEO_GRB+NEO_KHZ800);pixel->begin();pixel->clear();pixel->show();
  strlcpy(ledField,led["field"]|"",sizeof(ledField));strlcpy(ledMatch,led["match"]|"",sizeof(ledMatch));
  ledOperator=led["operator"]|"equals";ledEffect=led["effect"]|"pulse";ledBrightness=led["brightness"]|64;
  String color=led["color"]|"#ff0000";uint32_t rgb=strtoul(color.c_str()+1,nullptr,16);ledR=rgb>>16;ledG=rgb>>8;ledB=rgb;
  ledRuleCount=0;activeLedRule=-1;
  for(JsonObjectConst rule:led["rules"].as<JsonArrayConst>()){
   LedRule& r=ledRules[ledRuleCount++];r.match=rule["match"]|"";r.op=rule["operator"]|"equals";r.effect=rule["effect"]|"solid";r.brightness=rule["brightness"]|64;r.period=constrain(rule["periodMs"]|2400,200,10000);
   String color=rule["color"]|"#ff0000";uint32_t rgb=strtoul(color.c_str()+1,nullptr,16);r.r=rgb>>16;r.g=rgb>>8;r.b=rgb;
  }
 }
#ifdef SC_NETWORK
 useNetwork=!strcmp(p["transport"]|"usb","wifi");wifiRestart=true;
 if(p["wifi"].is<JsonObjectConst>()){
  wifiSsid=p["wifi"]["ssid"].as<String>();wifiPassword=p["wifi"]["password"].as<String>();bridgeHost=p["wifi"]["host"].as<String>();bridgeToken=p["wifi"]["token"].as<String>();bridgePort=p["wifi"]["port"]|2943;wifiRestart=true;
 }
#endif
 fresh=false;lastSubscribe=0;
}
void subscribe(){
 JsonDocument doc;doc["v"]=1;doc["type"]="subscribe";doc["name"]=panelName;
 JsonArray fields=doc["fields"].to<JsonArray>();for(unsigned i=0;i<readoutCount;i++)fields.add(readouts[i].field);
 if(ledField[0])fields.add(ledField);
#ifdef SC_NETWORK
 doc["token"]=bridgeToken;
#endif
 send(doc);lastSubscribe=millis();
}
String value(JsonVariantConst v){
 if(v.isNull())return "--";
 if(v.is<const char*>()){String text=v.as<String>();text.replace("VEHICLE_COMPONENT_DEPLOYMENT_STATE_","");return text.substring(0,20);}
 if(v.is<bool>())return v.as<bool>()?"ON":"OFF";
 if(v.is<JsonObjectConst>()||v.is<JsonArrayConst>())return "[complex]";
 return String(v.as<float>(),1);
}
void receive(const char* input,Stream& reply){
 JsonDocument doc;if(deserializeJson(doc,input)){parseErrors++;return;}if(doc["v"].as<int>()!=1)return;
 const char* type=doc["type"]|"";
#ifdef SC_NETWORK
 if(!strcmp(type,"wifi_setup")){if(setupActive){setupServer.stop();setupDns.stop();}beginSetup();JsonDocument ack;ack["v"]=1;ack["type"]="setup_ack";ack["url"]="http://192.168.4.1/";send(ack,reply);return;}
#endif
 if(!strcmp(type,"identify")){
  JsonDocument status;status["v"]=1;status["type"]="device_info";status["board"]=BOARD;status["firmware"]="0.5.0";status["parseErrors"]=parseErrors;status["ledCount"]=pixel?pixel->numPixels():0;status["ledConfigured"]=pixel!=nullptr;status["ledMatches"]=ledMatches;status["activeRule"]=activeLedRule;status["ruleCount"]=ledRuleCount;status["fresh"]=fresh&&millis()-lastFrame<=2000;
  if(activeLedRule>=0){status["effect"]=ledRules[activeLedRule].effect;status["red"]=ledRules[activeLedRule].r;status["green"]=ledRules[activeLedRule].g;status["blue"]=ledRules[activeLedRule].b;}
#ifdef SC_NETWORK
  status["wifiConnected"]=WiFi.status()==WL_CONNECTED;status["ip"]=WiFi.localIP().toString();status["setupActive"]=setupActive;status["setupSsid"]=WiFi.softAPSSID();status["transport"]=useNetwork?"wifi":"usb";
#endif
  send(status,reply);return;
 }
 if(!strcmp(type,"configure")){
  JsonDocument ack;ack["v"]=1;ack["type"]="config_ack";ack["id"]=doc["id"];
  String text;serializeJson(doc["profile"],text);
  bool ok=text.length()<=3000&&validate(doc["profile"]);
  if(ok){ok=storage.putString("panel",text)>0;if(ok){
#ifdef SC_NETWORK
   if(storage.isKey("network"))storage.remove("network");
#endif
   apply(doc["profile"]);}}
  ack["ok"]=ok;ack["message"]=ok?"Interface saved to board":"Invalid profile, pins, or firmware target";send(ack,reply);return;
 }
 if(!strcmp(type,"ack")){result=doc["ok"].as<bool>()?"Accepted":"Rejected";return;}
 if(strcmp(type,"telemetry"))return;
 strlcpy(session,doc["session"]|"",sizeof(session));seq=doc["seq"]|0;lastFrame=millis();
 fresh=!doc["stale"].as<bool>()&&doc["connected"].as<bool>();demo=!strcmp(doc["source"]|"","demo");
 for(unsigned i=0;i<readoutCount;i++)readouts[i].value=value(doc["values"][readouts[i].field]);
 JsonVariantConst ledValue=doc["values"][ledField];ledMatches=false;
 activeLedRule=-1;
 if(ledField[0]&&!ledValue.isNull()){
  String actual=ledValue.as<String>();
  if(ledOperator=="equals")ledMatches=actual==ledMatch;
  else if(ledOperator=="notEquals")ledMatches=actual!=ledMatch;
  else if(ledOperator=="greater"&&ledValue.is<float>())ledMatches=ledValue.as<float>()>atof(ledMatch);
  else if(ledOperator=="less"&&ledValue.is<float>())ledMatches=ledValue.as<float>()<atof(ledMatch);
  for(unsigned i=0;i<ledRuleCount;i++){
   LedRule& r=ledRules[i];bool matches=r.op=="equals"?actual==r.match:r.op=="notEquals"?actual!=r.match:r.op=="contains"?actual.indexOf(r.match)>=0:r.op=="greater"&&ledValue.is<float>()?ledValue.as<float>()>r.match.toFloat():r.op=="less"&&ledValue.is<float>()?ledValue.as<float>()<r.match.toFloat():false;
   if(matches){activeLedRule=i;break;}
  }
  if(ledRuleCount)ledMatches=activeLedRule>=0;
 }
}
void consume(Stream& stream,Line& line){
 for(int n=0;n<512&&stream.available();n++){
  char c=stream.read();if(c=='\n'){if(!line.dropping&&line.used){line.data[line.used]=0;receive(line.data,stream);}line.used=0;line.dropping=false;}
  else if(!line.dropping){if(line.used<sizeof(line.data)-1)line.data[line.used++]=c;else{line.used=0;line.dropping=true;}}
 }
}
void press(unsigned index){
 if(!fresh||millis()-lastFrame>2000||!session[0])return;
 JsonDocument doc;doc["v"]=1;doc["type"]=buttons[index].maintained?"switch":"press";if(buttons[index].maintained)doc["state"]=!buttons[index].stable;doc["id"]=String(bootId,HEX)+":"+String(++counter);doc["session"]=session;doc["seq"]=seq;doc["button"]=buttons[index].name;send(doc);result="Sent";
}
#ifdef SC_NETWORK
void beginSetup(){
 setupActive=true;setupStarted=millis();WiFi.mode(WIFI_AP_STA);
 String name="StarPanel-"+String((uint32_t)ESP.getEfuseMac(),HEX);WiFi.softAP(name.c_str(),"StarPanel123");
 setupDns.start(53,"*",WiFi.softAPIP());
 setupServer.on("/",HTTP_GET,[](){setupServer.sendHeader("Cache-Control","no-store");setupServer.send(200,"text/html",R"HTML(<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>StarPanel Bridge setup</title><style>body{font:17px system-ui;background:#101722;color:#e5edf5;max-width:460px;margin:30px auto;padding:20px}input,button{box-sizing:border-box;width:100%;padding:12px;margin:8px 0 20px;font:inherit}button{background:#64dfc5;border:0}small{color:#acbdce}</style><h1>StarPanel Bridge</h1><p>Connect this panel to your gaming PC.</p><form action="/save" method="post"><label>Wi-Fi name (2.4 GHz)<input name="ssid" maxlength="32" required></label><label>Wi-Fi password<input type="password" name="password" maxlength="63" autocomplete="new-password"></label><label>Gaming PC IP address<input name="host" placeholder="192.168.1.100" required maxlength="100"></label><label>Panel pairing key<input type="password" name="token" minlength="64" maxlength="64" required></label><button>Save & connect</button></form><small>Find the PC address and pairing key in StarPanel Bridge → IP display panels. Setup closes after connecting or after ten minutes. Credentials stay on this board.</small>)HTML");});
 setupServer.on("/save",HTTP_POST,[](){
  if(setupServer.client().localIP()!=WiFi.softAPIP()){setupServer.send(403,"text/plain","Use the panel setup Wi-Fi");return;}
  String ssid=setupServer.arg("ssid"),password=setupServer.arg("password"),host=setupServer.arg("host"),token=setupServer.arg("token");
  bool valid=ssid.length()>0&&ssid.length()<=32&&password.length()<=63&&host.length()>0&&host.length()<=100&&token.length()==64;
  for(unsigned i=0;i<token.length();i++)if(!isxdigit(token[i]))valid=false;
  for(unsigned i=0;i<host.length();i++)if(!isalnum(host[i])&&host[i]!='.'&&host[i]!='-')valid=false;
  if(!valid){setupServer.send(400,"text/plain","Check Wi-Fi name, PC address and 64-character pairing key.");return;}
  JsonDocument net;net["ssid"]=ssid;net["password"]=password;net["host"]=host;net["token"]=token;String encoded;serializeJson(net,encoded);
  if(!storage.putString("network",encoded)){setupServer.send(500,"text/plain","Settings could not be saved");return;}
  wifiSsid=ssid;wifiPassword=password;bridgeHost=host;bridgeToken=token;useNetwork=true;wifiRestart=true;
  setupServer.send(200,"text/html","<h1>Settings saved</h1><p>The panel is connecting. Return to your normal Wi-Fi and check StarPanel Bridge for the connected panel. If connection fails, reconnect to this setup network and check the values.</p>");
 });
 setupServer.onNotFound([](){setupServer.sendHeader("Location","http://192.168.4.1/");setupServer.send(302,"text/plain","");});setupServer.begin();
}
#endif
void setup(){
 Serial.setRxBufferSize(4096);Serial.begin(115200);bootId=esp_random();storage.begin("scbridge",false);
 const char* names[]={"gear","lights","flashlight"};const char* fields[]={"speed","altitude","gear"};
 for(unsigned i=0;i<3;i++){buttons[i].pin=DEFAULT_PINS[i];strlcpy(buttons[i].name,names[i],25);pinMode(buttons[i].pin,INPUT_PULLUP);buttons[i].raw=buttons[i].stable=digitalRead(buttons[i].pin);strlcpy(readouts[i].field,fields[i],25);strlcpy(readouts[i].label,fields[i],17);readouts[i].value="--";}
 String saved=storage.isKey("panel")?storage.getString("panel",""):"";if(saved.length()){JsonDocument doc;if(!deserializeJson(doc,saved)&&validate(doc.as<JsonVariantConst>()))apply(doc.as<JsonVariantConst>());}
 Wire.begin(SDA_PIN,SCL_PIN);Wire.beginTransmission(0x3C);if(Wire.endTransmission()==0)hasDisplay=display.begin(SSD1306_SWITCHCAPVCC,0x3C);
 if(hasDisplay){display.clearDisplay();display.setTextColor(SSD1306_WHITE);display.setTextSize(1);}
#ifdef SC_NETWORK
 String savedNetwork=storage.isKey("network")?storage.getString("network",""):"";if(savedNetwork.length()){JsonDocument net;if(!deserializeJson(net,savedNetwork)){wifiSsid=net["ssid"].as<String>();wifiPassword=net["password"].as<String>();bridgeHost=net["host"].as<String>();bridgeToken=net["token"].as<String>();useNetwork=true;}}
 WiFi.mode(WIFI_STA);WiFi.setAutoReconnect(true);if(wifiSsid.length())WiFi.begin(wifiSsid.c_str(),wifiPassword.c_str());else beginSetup();
#endif
}
void loop(){
 consume(Serial,usbLine);
#ifdef SC_NETWORK
 if(setupActive){setupDns.processNextRequest();setupServer.handleClient();if((useNetwork&&fresh&&client.connected())||millis()-setupStarted>600000){setupServer.stop();setupDns.stop();WiFi.softAPdisconnect(true);WiFi.mode(WIFI_STA);setupActive=false;}}
 if(wifiRestart){wifiRestart=false;client.stop();WiFi.disconnect();if(useNetwork&&wifiSsid.length())WiFi.begin(wifiSsid.c_str(),wifiPassword.c_str());}
 if(useNetwork&&!client.connected()){
  fresh=false;if(WiFi.status()==WL_CONNECTED&&millis()-lastConnectAttempt>3000){lastConnectAttempt=millis();if(client.connect(bridgeHost.c_str(),bridgePort,200)){netLine.used=0;netLine.dropping=false;subscribe();}}
 }else if(useNetwork)consume(client,netLine);
#endif
 uint32_t now=millis();if(pixel&&now-lastLed>=25){lastLed=now;LedRule fallback={ledMatch,ledOperator,ledEffect,ledR,ledG,ledB,ledBrightness,2400};LedRule& r=activeLedRule>=0?ledRules[activeLedRule]:fallback;uint32_t phase=now%r.period;uint32_t half=r.period/2;uint32_t level=r.effect=="solid"?255:r.effect=="blink"?(phase<half?255:0):(phase<half?phase*255/half:(r.period-phase)*255/half);level=(fresh&&now-lastFrame<=2000&&ledMatches)?level*r.brightness/255:0;for(uint16_t i=0;i<pixel->numPixels();i++)pixel->setPixelColor(i,pixel->Color(r.r*level/255,r.g*level/255,r.b*level/255));pixel->show();}
 if(now-lastSubscribe>3000){subscribe();for(unsigned i=0;i<buttonCount;i++)if(buttons[i].maintained)press(i);}
 for(unsigned i=0;i<buttonCount;i++){Button& b=buttons[i];bool state=digitalRead(b.pin);if(state!=b.raw){b.raw=state;b.changed=now;}if(state!=b.stable&&now-b.changed>35){b.stable=state;if(b.maintained||!state)press(i);}}
 if(hasDisplay&&now-lastPaint>=200){lastPaint=now;display.clearDisplay();display.setCursor(0,0);display.println(demo?"SC BRIDGE / DEMO":"SC BRIDGE / LIVE");
  if(!fresh||now-lastFrame>2000)display.println("NO FRESH TELEMETRY");else for(unsigned i=0;i<readoutCount;i++){display.print(String(readouts[i].label).substring(0,8));display.print(" ");display.println(readouts[i].value);}
  display.println(result);display.display();}
}
