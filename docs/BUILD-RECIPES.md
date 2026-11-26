# Panel build recipes

These designs are editable starting points. Import them into the designer, review the exact board and pins, save, then program the intended hardware. **G** and **U** are example bindings, not a detection of your game's controls; replace them with your actual gear and ship-power bindings before enabling controls.

## Seven-pixel landing-gear indicator

Parts: ESP32-C3 Super Mini 4 MB with native USB, a seven-pixel WS2812 RGB module/chain, suitable power, common ground, and data on GPIO 3. Follow the [LED electrical guidance](HARDWARE.md#starter-parts-and-connections).

Import [`supermini-gear.starpanel.json`](../examples/supermini-gear.starpanel.json). Its three ordered rules pulse red for deployed, strobe yellow for both moving states, and show steady green for retracted. All seven pixels share the indication. Stale or unknown data turns them off.

Upload the Super Mini firmware once, then **Send interface to board**. You can start over USB and later send Wi-Fi credentials or use the first-start setup page. This is the physically tested project example; it does not require an OLED or any buttons.

## Wireless flight display

Parts: ESP32 Dev Module/WROOM-32 compatible with the 4 MB profile and an SSD1306 128×64 I2C OLED at 0x3C. SDA → GPIO 21, SCL → GPIO 22, with compatible power and ground.

Import [`esp32-flight-display.starpanel.json`](../examples/esp32-flight-display.starpanel.json). It shows speed, radar altitude, hydrogen fuel and gear. Upload the Wi-Fi firmware target, then supply your Wi-Fi credentials, PC LAN address and pairing key through the app. This is a build-validated template; physical OLED testing remains necessary. Raw fuel values are not silently converted to percentages.

## Standalone Mega power switch and display

Parts: Arduino Mega 2560, SSD1306 I2C OLED (SDA 20/SCL 21), maintained SPST switch from GPIO 8 to GND, and USB cable.

Import [`standalone-mega-power.starpanel.json`](../examples/standalone-mega-power.starpanel.json). Match its ON/OFF key to your ship-power binding. Save and **Upload saved Arduino design**. After reboot, connect the board under **Standalone Arduino USB · 250000 baud**.

With controls enabled and the game focused, physical OFF requests power OFF if fresh telemetry reports it ON. The app confirms state through `vehicle.state.power.powerplants` rather than repeatedly pressing a toggle. The OLED shows speed, gear and oxygen. This template compiles/validates but is not a claim of bench validation.

## DCSBIOSKit master with two slaves

Parts: compatible vendor master, hub/power/cables as needed, a Mega slave/shield, a Nano slave/shield, programmer, and each panel's local inputs/display. Follow [vendor wiring and power instructions](https://dcsbioskit.com/instructions/).

Import [`dcsbioskit-mega-slave-1.starpanel.json`](../examples/dcsbioskit-mega-slave-1.starpanel.json) and [`dcsbioskit-nano-slave-2.starpanel.json`](../examples/dcsbioskit-nano-slave-2.starpanel.json). They use distinct bus addresses 1 and 2 and different command aliases. The Mega example has a maintained power switch; the Nano example has a momentary gear button. Both use pin 8 locally; pins may repeat on different physical boards.

1. Power down/disconnect the relevant slave from the bus. Connect only its programmer.
2. Select that slave's design and its programmer COM port. Upload firmware plus EEPROM design. Repeat for the other slave.
3. Disconnect programmers. Wire the vendor bus with power off, then power it according to vendor instructions.
4. Connect the master's USB runtime port to StarPanel as **DCSBIOSKit Main / Master Controller**. This marks the port as protected from panel firmware uploads. The factory routing firmware works; use the [dedicated master flow](DCSBIOSKIT.md#program-or-restore-the-master) if restoring/reprogramming it.
5. Confirm fresh outputs before enabling controls. Use unique addresses for every additional slave. Do not run a DCS aircraft export into that master simultaneously.

Master/hub behavior follows the vendor protocol and the adapter implementation; this topology still needs physical bus validation. Standard Arduino USB or ESP32 panels can run alongside the master as separate host connections.
