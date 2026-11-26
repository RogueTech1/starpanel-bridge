# Hardware and wiring

## Choose your path

Use the app's **Board library** for the full reviewed DCSBIOSKit product catalog, dedicated slave/shield choices and separate master/passive/DevKit roles. See [Board library](BOARD-LIBRARY.md) for pin reservations and revision limits.

**ESP32** is the easiest route for independent Wi-Fi panels, the full telemetry catalog, OLED readouts and rule-driven WS2812 indicators. **DCSBIOSKit** is the primary supported Arduino ecosystem for a wired cockpit with one USB master and many RS485 slaves. **Standalone Arduino USB** lets you use Uno R3, Mega 2560 or classic ATmega328P Nano boards independently, without vendor bus hardware.

The designer supports up to eight buttons/maintained switches, six OLED readouts, and one WS2812 chain per ESP32 panel. Arduino panels support the same input count and six lines chosen from four instrument sources. The host has 32 button and 32 field aliases shared by all designs; default aliases also count. The IP server accepts up to eight authenticated clients. Saving 16 designs does not mean every maximum-sized design fits the host simultaneously.

## ESP32 board profiles

| Profile | Minimum flash | OLED SDA / SCL | Available button / LED GPIOs |
| --- | --- | --- | --- |
| ESP32-S3 DevKitC-1 | 8 MB | 8 / 9 | 1,2,3,4,5,6,7,10–18,21,38–42,47,48 |
| ESP32 Dev Module, WROOM-32 DevKitC V4, DOIT DevKit V1 | 4 MB | 21 / 22 | 4,13,14,16,17,18,19,23,25,26,27,32,33 |
| ESP32-C3 DevKitM-1 (UART USB) | 4 MB | 8 / 9 | 0,1,3,4,5,6,7,10 |
| ESP32-C3 Super Mini (native USB) | 4 MB | 6 / 7 | 0,1,3,4,5,8,10 |

These are conservative pin selections, not a promise that every third-party board exposes every listed pin. Check the actual board schematic; variants may use a listed GPIO for an onboard LED or peripheral. C3 Super Mini is a family of third-party boards; the physical test used a 4 MB chip, native USB VID 303A / PID 1001. Native USB GPIOs are reserved. Use the matching profile so serial communication survives upload.

[Espressif board-family guide](https://docs.espressif.com/projects/arduino-esp32/en/latest/boards/boards.html) · [DevKitC reference](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/user_guide.html) · [C3 DevKitM-1 reference](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32c3/esp32-c3-devkitm-1/user_guide.html) · [S3 DevKitC-1 reference](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide.html)

## Starter parts and connections

- One listed board and a data-capable USB cable.
- Optional SSD1306 I2C OLED, **128×64**, address **0x3C**. Other resolutions, addresses, SH1106 modules and TFT displays need different firmware.
- Momentary buttons or maintained SPST switches. Connect the selected GPIO to the switch, and the other terminal to **GND**. Internal pull-ups are enabled. Closed/to-ground means ON. Do not feed external power into an input.
- Optional WS2812-compatible RGB chain (1–64 pixels). Connect GPIO → DIN, common GND, and an appropriate LED power supply. The designer currently drives one RGB chain with GRB channel order, not an RGBW strip.

ESP32 logic is **3.3 V**. Do not connect a 5 V signal to its GPIO. Follow the actual LED module's voltage requirements and the [Adafruit NeoPixel wiring guide](https://learn.adafruit.com/adafruit-neopixel-uberguide/basic-connections), including appropriate level shifting, series resistance and power decoupling. A 5 V WS2812 may not reliably accept a 3.3 V data signal without a level shifter. Do not power a long LED strip from a board GPIO or assume USB supply capacity.

For an OLED: GND → GND; SDA/SCL → the profile's I2C pins; power → the module's supported rail. Verify the module's pull-ups and voltage compatibility. The app reserves I2C pins even if no display is fitted. Firmware works without an OLED; the LED-only Super Mini test used no display.

## DCSBIOSKit shopping and topology

Use the [Getting Started Kit](https://dcsbioskit.com/product/getting-started-kit/) or choose compatible components from [DCSBIOSKit](https://dcsbioskit.com/):

| Component | Purpose | Link |
| --- | --- | --- |
| Master Controller | USB from PC to powered RS485 buses | [Master](https://dcsbioskit.com/product/master-controller/) |
| Hub | Bus and power distribution | [Hub](https://dcsbioskit.com/product/dcs-bios-hub/) |
| Mega Slave / Mega Shield | Larger panel and accessible GPIO | [Mega shield](https://dcsbioskit.com/product/dcs-bios-mega-shield/) |
| Nano Slave / Nano Shield | Compact panel | [Shop](https://dcsbioskit.com/) |
| Slave Programmer | Programming a disconnected slave | [Instructions](https://dcsbioskit.com/instructions/) |
| RS485 DevKit | Bench experimentation | [DevKit](https://dcsbioskit.com/product/dcs-bios-rs485-devkit/) |

Topology: **PC USB → vendor master → vendor hubs/buses → unique-address slaves → local switches/display**. The factory master firmware already routes compatible traffic; use the dedicated master upload/restore flow if needed. StarPanel's slave firmware uses a private Star Citizen memory map; existing DCS aircraft sketches do not automatically become Star Citizen panels. Do not run a DCS aircraft export and StarPanel into the same master simultaneously.

Follow the exact revision's labels and [manufacturer instructions](https://dcsbioskit.com/instructions/). Powered RS485 connectors are **not Ethernet**. Never connect them to a PC network port, switch or router. Do not hot-plug powered bus cables. Never connect slave USB/programmer and its powered bus at the same time. Mega Shield text conflicts on backlight D4/D5 versus D4/D13; vendor profiles conservatively exclude all three. Nano profiles exclude D5/D6 and other revision-sensitive pins. RS485 TX-enable reserves D2. Check the exact PCB revision; see the board library guide.

OLED I2C: Mega D20/D21; Nano A4/A5 (numeric 18/19). Arduino readouts use a compact text renderer and four sources: speed, altitude, landing gear and oxygen. Other telemetry outputs remain available through an ESP32 or custom firmware. Vendor LED matrices, backlight drivers, servos and encoders need their own renderer/driver; they are not claimed plug-and-play in this release.

## Standalone Arduino USB

Use a [Mega 2560](https://docs.arduino.cc/hardware/mega-2560/), [Uno R3](https://docs.arduino.cc/hardware/uno-rev3/), or classic [Nano](https://docs.arduino.cc/hardware/nano/). Each board connects directly to the PC and appears as its own COM port; no RS485 circuitry or master is required.

Mega standalone allows GPIO 2–53 except I2C 20/21. Uno/Nano allow 2–12 and A0–A3 (14–17). Serial RX/TX and OLED I2C pins remain reserved. Nano's old bootloader uses a separate 57600-baud upload profile; runtime remains 250000 baud. Vendor Nano uses the modern 115200-baud uploader profile, per its instructions.

The built-in AVR uploader verifies the device signature and writes firmware plus EEPROM. It never uses an override that ignores signature mismatch. Pin labels, MCU model and bootloader must all match the selected profile.


## Additional common board profiles

| Board | Role and upload | OLED and pin notes |
| --- | --- | --- |
| Arduino Leonardo | Standalone USB, ATmega32U4 / Caterina | SDA 2, SCL 3; select GPIO 4–13 or A0–A3 (18–21) |
| Arduino Micro | Standalone USB, ATmega32U4 / Caterina | Same reserved I2C pins and conservative input range |
| Pro Micro, **5 V / 16 MHz** | Standalone USB, ATmega32U4 / Caterina | SDA 2, SCL 3; inputs 4–10, 16, 18–21; do not use this image for an 8 MHz clone |
| LOLIN ESP32-S2 Mini, 4 MB | Standalone native USB / Wi-Fi | SDA 33, SCL 35; separate image and pin map |
| ESP32-S3 DevKitC-1 N16 / N16R8 | Standalone USB / Wi-Fi | Uses the conservative S3 image and pin map; extra flash/PSRAM is not used |

The 32U4 uploader performs a 1200-baud touch, watches for its bootloader COM port and uses avrdude's AVR109 signature/readback checks. Runtime remains a 250000-baud virtual serial link. These profiles are build-tested; physical upload/re-enumeration remains unverified.

References: [Leonardo](https://docs.arduino.cc/hardware/leonardo/), [Micro](https://docs.arduino.cc/hardware/micro/), [LOLIN S2 Mini](https://www.wemos.cc/en/latest/s2/s2_mini.html).

## Family compatibility rather than guesswork

Uno R3 and Uno R4 have different processors; classic Nano, Nano Every and Nano ESP32 are different boards. This release does not provide Uno R4, Nano Every or Nano ESP32-specific firmware. ESP32-C6/H2/P4 are not compatible with the C3 image; the pinned official PlatformIO C6 target currently exposes ESP-IDF rather than this project's Arduino framework, so C6 is not offered as a flashable profile. See the [PlatformIO C6 framework matrix](https://docs.platformio.org/en/latest/boards/espressif32/esp32-c6-devkitc-1.html). A future port must have its own environment, manifest, GPIO validation and tests.

## Master, hub, slave and standalone roles in the app

Choose **DCSBIOSKit Main / Master Controller** when attaching the vendor master's runtime USB port. The app remembers that COM port as protected and blocks panel/slave firmware uploads to it. The master routes traffic and has a dedicated vendor-compatible firmware upload/restore flow, separate from panel designs. Hubs distribute bus/power and have no StarPanel upload operation. Nano/Mega slaves and shields are programmable design targets, through a separate programmer while disconnected from the powered bus.

Standalone Arduino boards each have their own USB runtime link. ESP32 panels each connect independently to the PC by USB or Wi-Fi; they are not automatically DCSBIOSKit-compatible RS485 subboards and no ESP32-to-ESP32 master routing is implemented. You can mix these independent panels with a vendor master in the same running app, within the documented alias/client limits.
