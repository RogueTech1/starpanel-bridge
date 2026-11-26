// DCSBIOSKit Master Controller (ATmega2560), matching the vendor's sketch:
// https://dcsbioskit.com/master-controller-code/
// Master only: forwards PC output and polls slaves on three RS485 buses.
#include <Arduino.h>
#define DCSBIOS_DISABLE_SERVO
#define DCSBIOS_RS485_MASTER
#define UART1_TXENABLE_PIN 2
#define UART2_TXENABLE_PIN 3
#define UART3_TXENABLE_PIN 4
#include <DcsBios.h>
void setup(){DcsBios::setup();}
void loop(){DcsBios::loop();}
