# Troubleshooting

Use the version-specific [telemetry setup and verification guide](TELEMETRY-SETUP.md). The [pinned upstream research](SC-TELEMETRY-DECK.md) records PTU builds reported to read settings without starting a listener; those builds have no demonstrated configuration workaround.

| Symptom | What to check |
| --- | --- |
| Connection refused on 2942 | Save the telemetry setting, fully quit game and RSI Launcher, then reopen both. A running process cannot inherit a newly saved environment variable. Check the game's local service registration in `Game.log`. A firewall rule cannot create a missing service. |
| Character values work, ship values missing | Enter a pilot/operator seat. Some values depend on ship/context. Look at the raw frame rather than assuming every catalog field is populated. |
| Altitude shows unavailable | The game may export FLT_MAX instead of an altitude. This sentinel is intentionally null. Radar altitude is a separate field. |
| Zero/false or missing value | Explicit 0 and false are valid values. Missing messages are unavailable. Proto3 boolean defaults apply only within present parent messages. |
| No COM port | Use a data cable, check Windows Device Manager and the board's required USB-UART driver. Native C3 Super Mini and UART DevKitM-1 are different profiles. |
| Port access denied | Quit serial monitors, Arduino IDE monitors, another bridge instance or another program holding the COM port. Disconnect the port in the app before an external tool uses it. |
| Upload cannot connect | Select exact board and port; use its BOOT/reset procedure if necessary. An upload refuses chip/flash/signature mismatches. Do not defeat these checks. |
| ESP32 upload succeeds, no configuration acknowledgment | Wait for reboot, refresh ports and reconnect. Check native USB vs UART profile. Current uploader preserves DTR/RTS and sends an explicit reset pulse; older builds had a native-USB reset problem. |
| Nano upload times out | Choose modern or old bootloader profile correctly. DCSBIOSKit Nano uses modern ATmega328P per vendor instructions. |
| DCSBIOSKit bus silent | Use master COM port at 250000 baud, unique slave addresses, correct power/cabling and vendor switch settings. Disconnect programmer before bus connection. Do not flash slave images to the master. |
| OLED blank | Confirm SSD1306 128×64, address 0x3C, correct profile SDA/SCL, common ground, voltage and pull-ups. SH1106/other models are not the bundled driver. |
| Only one pixel lights | Set **LED count** to the actual chain length, then send the interface again. Seven-pixel modules are daisy-chained internally. Confirm DIN vs DOUT. |
| Wrong RGB color | Firmware uses GRB-order WS2812 RGB. Other channel orders and RGBW modules require a driver change. Check signal/power integrity. |
| LED off | Check fresh telemetry, the selected field, rule match and wiring. No match or stale data intentionally turns the chain off. Keep brightness/power within the actual module's requirements. |
| Gear lamp red vs green | Inspect current raw gear state. Red means deployed; green means retracted; yellow is moving. Hardware acceptance tests briefly use explicitly simulated states, then restore real game data. |
| Keyboard control rejected | Enable controls, focus Star Citizen, match the game's actual key binding and avoid elevation mismatches. Windows may reject synthetic input; the app does not bypass those restrictions. |
| Maintained switch does nothing | Inspect its status: missing feedback, moving gear, stale physical report, conflicting switches or disabled controls block synchronization. Uncertain results are not repeatedly toggled. |

## Wi-Fi setup page will not open

1. Connect to the board's `StarPanel-...` network using **`StarPanel123`**. That password is for setup, not your home Wi-Fi.
2. Keep the connection when the phone reports **no internet**. Temporarily turn off VPN and automatic cellular/Wi-Fi switching if the phone routes the request elsewhere.
3. Type **http://192.168.4.1/** manually. Use HTTP, not HTTPS, a search query, or your gaming PC's IP address.
4. The first-start setup network expires after ten minutes. Reopen it with **Open board Wi-Fi setup** while connected through USB JSON, or power-cycle an unconfigured board.
5. After saving, the board joins your normal 2.4 GHz network. The setup page closes after fresh network telemetry arrives; return your phone to the normal network.

The setup form was physically reached with HTTP 200 on the tested Super Mini. Successful page access is separate from joining a home network; a correct SSID/password, reachable PC address and pairing key are still required.

## Wi-Fi configured, but no telemetry

Enable **IP panels** on the app. Use a LAN IP shown in that section, not the setup address `192.168.4.1` and not `127.0.0.1`. Allow the app through Windows Firewall for the private network. Both devices need routes to each other; guest Wi-Fi, AP/client isolation and VLAN rules can block the connection. Confirm the 64-character pairing key and use TCP 2943. The app never needs port forwarding on your router.

To correct bad credentials, connect USB and use designer Wi-Fi provisioning or **Open board Wi-Fi setup**. Check **IP display panels** for an authenticated client before relying on wireless operation. Losing the game feed still leaves the network connected, but instruments become unavailable.

## Reporting a bug

Open a [GitHub issue](https://github.com/RogueTech1/starpanel-bridge/issues) with app version, game version/channel, board model/flash size, transport, display model, selected pins and reproduction steps. Include a minimal exported design when relevant. Remove passwords, pairing keys, player names, local paths and private network details from logs or screenshots. Do not upload the whole app-data directory or game executable.
