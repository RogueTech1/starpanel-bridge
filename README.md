# StarPanel Bridge

**Build a physical Star Citizen cockpit, one panel at a time.**

StarPanel Bridge is a Windows tray app that sends live game instruments to ESP32 and Arduino panels, turns physical buttons into game controls, and keeps maintained switches aligned with their physical positions. Design an interface with dropdowns, upload firmware from the app, and connect over USB, Wi-Fi, or a DCSBIOSKit RS485 bus.

[Download the Windows installer](https://github.com/RogueTech1/starpanel-bridge/releases/latest) · [Quick start](docs/QUICKSTART.md) · [Choose hardware](docs/HARDWARE.md) · [Designer & logic](docs/DESIGNER.md) · [Advanced programming](docs/PROGRAMMING.md) · [Troubleshooting](docs/TROUBLESHOOTING.md)

## What you can build

- OLED flight instruments, fuel and character readouts from the live field catalog.
- Pushbutton panels using your Star Citizen keyboard bindings.
- Maintained switches that make the game follow the physical switch, using telemetry feedback.
- WS2812 indicators with up to four ordered rules: comparisons, colors, pulsing, strobing and steady light.
- Several independent USB panels, paired Wi-Fi panels, or DCSBIOSKit slaves behind one master.
- Shareable panel designs that contain mappings and wiring choices, without Wi-Fi credentials or pairing keys.

The installer includes the app, firmware images and upload tools. Users do not need Node.js, Python, PlatformIO or an Arduino IDE for the built-in board profiles.

## Supported hardware paths

| Hardware | Connection | Setup from app | Readouts / effects |
| --- | --- | --- | --- |
| ESP32-C3 Super Mini, 4 MB, native USB | USB or Wi-Fi | Firmware upload + saved interface | Catalog fields, SSD1306, WS2812 rules |
| ESP32-C3 DevKitM-1, 4 MB | USB UART or Wi-Fi | Firmware upload + saved interface | Same |
| ESP32 Dev Module / WROOM-32 DevKitC V4 / DOIT DevKit V1, 4 MB | USB or Wi-Fi | Firmware upload + saved interface | Same |
| ESP32-S3 DevKitC-1, 8 MB | USB or Wi-Fi | Firmware upload + saved interface | Same |
| DCSBIOSKit Mega slave / Mega shield | Vendor programmer, then RS485 master | Firmware + EEPROM design upload | Speed, altitude, gear, oxygen on SSD1306 |
| DCSBIOSKit Nano slave / Nano shield | Vendor programmer, then RS485 master | Firmware + EEPROM design upload | Same |
| Standalone Arduino Mega 2560, Uno R3, classic Nano ATmega328P | Separate USB per board | Firmware + EEPROM design upload | Same four readouts; no DCSBIOSKit required |

Nano profiles cover modern and old bootloaders. Nano Every, Uno R4, ESP32-S2/C6, TFT panels and arbitrary board variants are not interchangeable with these targets. Check the [exact wiring and flash requirements](docs/HARDWARE.md) before buying or uploading.

## Install and build a panel

1. Download the `.exe` installer from [Releases](https://github.com/RogueTech1/starpanel-bridge/releases/latest), install, and open **StarPanel Bridge**. The Windows build is unsigned; verify the release's SHA-256 checksum.
2. Click **Enable telemetry startup setting**. Safely close Star Citizen, fully quit RSI Launcher, then reopen both once so the game inherits the setting. Enter a pilot seat for ship readouts.
3. Open **Panel designer**, choose the exact board, and add readouts, buttons, maintained switches or a WS2812 rule. Match button keys to your game's bindings.
4. Select the board's COM port. Check **Replace the selected board program** and upload the bundled firmware. For an ESP32, follow with **Send interface to board**; Arduino uploads already include the selected design.
5. For Wi-Fi, enter credentials through the USB designer or the board's first-start setup page. Enable **IP panels** on the gaming PC. [Wi-Fi setup](docs/QUICKSTART.md#wi-fi-panels) explains addresses and pairing.
6. Enable controls when ready. Keyboard commands require Star Citizen to be the foreground application. Closing the window keeps the bridge running in the tray; **Quit** stops it.

**DCSBIOSKit uses powered RS485, not Ethernet.** Follow the [manufacturer's instructions](https://dcsbioskit.com/instructions/): power off the bus before changing cables, never connect it to network equipment, and disconnect the slave from the powered bus before using USB or its programmer. Upload slave firmware only to slaves; retain the master's firmware.

## Example: a landing-gear lamp

Our first physical test uses an ESP32-C3 Super Mini and seven WS2812 pixels on GPIO 3:

| Live gear state | Indication |
| --- | --- |
| Deployed | Red pulse, 2.4-second cycle |
| Retracting or deploying | Yellow slow strobe, 2-second cycle |
| Retracted | Steady green |
| Missing or stale telemetry | Off |

The designer's **Add WS2812 rule** creates this editable example. The matching [shareable design](examples/supermini-gear.starpanel.json) is included. Rules are evaluated on the board, so fades remain smooth between telemetry packets.

## Maintained switches: physical state wins

Choose the game's feedback field and its ON/OFF values, then assign the ON and OFF bindings. If the switch is OFF when you enter a powered ship, the bridge observes power ON and sends the OFF binding. A toggle binding can serve both directions because it is sent only after a confirmed mismatch.

The bridge waits for fresh, stable feedback, waits through moving-gear states, rejects conflicting switches, and sends one command per mismatch while awaiting confirmation. It does not repeatedly toggle an unresponsive system. Feedback availability and your bindings determine which systems can synchronize; see [switch configuration](docs/DESIGNER.md#maintained-switches).

## Compatibility and validation

LIVE 4.10.3 character and MISC Starlancer MAX ship telemetry were verified locally on November 26, 2026, at roughly 16 game frames/second. Panel telemetry publishes at 5 Hz. That schema exposes 124 catalog entries; the app offers keyboard bindings for controls independently of telemetry action RPCs. API actions appear only when supported and advertised by the active source. Work on newer game schemas is separate from this release.

The C3 Super Mini was physically flashed and acknowledged the gear rule, each simulated deployment-state branch, stale-data handling and real game telemetry; the user confirmed a red pulse while the game reported deployed. Other board profiles compile but still need bench verification. Maintained-switch logic and native input guards are tested in software; in-game keyboard acceptance, every ship/system, vendor buses, and other display models are not claimed physically validated. See the [release verification matrix](docs/VALIDATION.md).

## Documentation

- [Quick start & Wi-Fi setup](docs/QUICKSTART.md)
- [Step-by-step panel recipes and importable examples](docs/BUILD-RECIPES.md)
- [Board selection, parts, wiring and DCSBIOSKit](docs/HARDWARE.md)
- [Panel designer, logic rules and switch synchronization](docs/DESIGNER.md)
- [Custom firmware, protocol and architecture](docs/PROGRAMMING.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Building and releasing from source](docs/DEVELOPMENT.md)
- [AI-assisted panel programming](docs/AI-ASSISTANT.md)
- [Validation and known scope](docs/VALIDATION.md)
- [Security and privacy](SECURITY.md)
- [Credits and dependency notices](THIRD-PARTY-NOTICES.md)

## Inspiration and credits

**DCSBIOSKit and DCS-BIOS inspired this project.** Thank you to [DCSBIOSKit](https://dcsbioskit.com/) for its modular cockpit hardware ecosystem and [DCS-BIOS](https://github.com/DCS-Skunkworks/dcs-bios) and its contributors for the open cockpit-interface architecture. The Arduino bus firmware uses the [DCSBIOSKit Arduino library fork](https://github.com/DCSBIOSKit/dcs-bios-arduino-library); its original MIT notice is preserved.

Thanks also to [Sokren's sc-telemetry-deck](https://github.com/Sokren/sc-telemetry-deck) for community telemetry research, and to Espressif, Arduino, Adafruit and U8g2 for their tools and libraries.

StarPanel Bridge is independent community software, not affiliated with or endorsed by Cloud Imperium Games, DCSBIOSKit, Eagle Dynamics or the DCS-BIOS maintainers. Star Citizen and other product names belong to their owners. Project code is [MIT licensed](LICENSE); third-party software and interoperability definitions retain their respective ownership and notices.


## AI-assisted panel building

A reusable [StarPanel Bridge AI skill](skills/starpanel-bridge/SKILL.md) helps assistants create designs, review wiring, troubleshoot connections and extend firmware. Read [installation and example prompts](docs/AI-ASSISTANT.md). Validate generated designs with `node scripts/validate-design.mjs <file>` before importing them.

Additional common profiles include **Leonardo, Micro, Pro Micro 5 V/16 MHz**, **LOLIN S2 Mini**, and **S3 N16/N16R8**. See the [expanded board and topology matrix](docs/HARDWARE.md#additional-common-board-profiles), including master-port protection and families requiring a separate port.

## App preview

![StarPanel Bridge panel designer in Simulator mode](docs/images/designer.png)
