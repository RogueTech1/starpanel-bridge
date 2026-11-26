# Credits and third-party notices

## Inspiration

**DCSBIOSKit** and **DCS-BIOS** inspired StarPanel Bridge's modular cockpit-panel approach. We thank [DCSBIOSKit](https://dcsbioskit.com/) for its hardware ecosystem and [DCS-BIOS](https://github.com/DCS-Skunkworks/dcs-bios) and its contributors for the open cockpit interface architecture. This project is independent and does not imply endorsement.

Community telemetry research and extraction tooling: [Sokren / sc-telemetry-deck](https://github.com/Sokren/sc-telemetry-deck), examined at commit `2f5529eb4940f1c9cfdbcdd5bf719bed24d85761`. The external checkout and extractor are not bundled into the app. Interface/action names are interoperability references, not a claim of ownership of the game's API. Cloud Imperium Games retains its game and interface ownership; no game executable, assets or account information is distributed here.

## Bundled libraries and tools

| Component | Use | License / upstream |
| --- | --- | --- |
| Electron / Chromium / Node.js | Desktop runtime | MIT and upstream notices; included in installer runtime files |
| grpc-js | Local game protocol | Apache-2.0, [grpc-node](https://github.com/grpc/grpc-node) |
| protobufjs | Descriptor decoding | BSD-3-Clause, [protobuf.js](https://github.com/protobufjs/protobuf.js) |
| serialport | Native serial transport | MIT, [node-serialport](https://github.com/serialport/node-serialport) |
| esptool-js | ESP32 firmware uploader | Apache-2.0, [esptool-js](https://github.com/espressif/esptool-js) |
| ArduinoJson | ESP32 JSON framing/configuration | MIT, [ArduinoJson](https://github.com/bblanchon/ArduinoJson) |
| Adafruit SSD1306 / GFX / BusIO | ESP32 OLED | BSD licenses, [Adafruit](https://github.com/adafruit) |
| Adafruit NeoPixel | WS2812 driver | LGPL-3.0, [NeoPixel](https://github.com/adafruit/Adafruit_NeoPixel) |
| U8g2 / U8x8 | AVR text OLED | BSD-2-Clause, [U8g2](https://github.com/olikraus/u8g2) |
| Arduino cores | AVR/ESP32 firmware runtime | LGPL and additional dependency notices, [Arduino AVR](https://github.com/arduino/ArduinoCore-avr), [Arduino ESP32](https://github.com/espressif/arduino-esp32) |
| DCSBIOSKit Arduino library | AVR DCS-BIOS interface | MIT, pinned fork `fa7f4dddabd20322cc1309ca0021eb0dd5428313`, [source](https://github.com/DCSBIOSKit/dcs-bios-arduino-library) |
| avrdude 6.3 / Windows libusb | AVR programming | GPL-2.0-or-later and libusb notices, [avrdude 6.3 source](https://github.com/avrdudes/avrdude/tree/v6.3), [PlatformIO tool package](https://registry.platformio.org/tools/platformio/tool-avrdude) |

Full discovered license texts are collected under `licenses/` in the repository and bundled documentation resources. Firmware source/build configuration is included here; release source archives include available dependency source and build instructions. Compiler/tool packages can be fetched at the exact versions pinned by the PlatformIO build. Individual upstream notices take precedence over this summary.

## DCS-BIOS Arduino library notice

The MIT License (MIT)

Copyright (c) 2014 jboecker

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
