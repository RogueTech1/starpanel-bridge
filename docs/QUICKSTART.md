# Quick start

## Before installation

Use Windows 10/11 x64, a supported Star Citizen build with its local telemetry service, a data-capable USB cable, and one of the exact [supported boards](HARDWARE.md). First try **Simulator** in the app if the game is unavailable; simulator values are clearly labeled and never send game commands.

The installer bundles firmware and programming tools. Obtain it from [official project releases](https://github.com/RogueTech1/starpanel-bridge/releases/latest). Install under your Windows user, then open StarPanel Bridge from the Start menu or desktop shortcut.

## Connect the game

Click **Enable telemetry startup setting** in the app. This writes the Windows user environment variable `GRPC_CLIENT_SERVER_ENABLED=true`. It does not inject into or modify the running game. After saving, safely close the game and completely exit RSI Launcher, including its tray process. Reopen the launcher and game. Enter a pilot seat.

The app reconnects automatically to `127.0.0.1:2942`. **Receiving** means fresh frames, rather than a successful TCP probe alone. Character data may arrive before vehicle data. Use **Diagnostics** to inspect the decoded frame and log. Missing data displays as unavailable.

## First ESP32 panel

1. Open **Panel designer** → **New panel**. Choose the exact board, not just a similar chip family.
2. Use **Flight readout template** for an OLED, or **Add WS2812 rule** for the gear lamp. The template creates a C3 Super Mini design; choose your actual board afterward and review its pins.
3. Check the wiring hint and [hardware guide](HARDWARE.md). Review every GPIO, including preselected defaults. Save the design.
4. Select the board COM port. Close serial monitors and other programs using that port.
5. Check **Replace the selected board program** → **Upload firmware & Arduino design**. ESP32 upload verifies the detected chip family and flash capacity before writing.
6. Click **Send interface to board**. Wait for **Interface saved to board**. This acknowledgment comes from the board after saving its configuration.
7. Future mapping changes need **Send interface** again; they do not need recompilation or a firmware upload.

For C3 Super Mini, use the native USB profile. For UART-based C3 DevKitM-1, use its separate profile. A WS2812 on GPIO 3 uses the default gear rule. Its peak brightness defaults to 64/255; do not assume the board's supply can power a strip.

## Wi-Fi panels

The ESP32 joins a **2.4 GHz Wi-Fi network** that can reach the gaming PC. The panel does not need an internet service or cloud account. In the app, enable **IP panels**, note the gaming PC's LAN address, and click **Show pairing key**. The listener is TCP port **2943**. Permit the app on your private network when Windows Firewall asks; do not expose this port to the internet.

Choose one provisioning method:

### USB provisioning

Select **Wi-Fi / IP** in the designer. Enter your Wi-Fi name, your router's Wi-Fi password, and the gaming PC's LAN address. Select the matching Wi-Fi firmware target when initially uploading, then **Send interface to board**. The app sends credentials and its pairing key over USB. Wait for the panel to appear under **IP display panels** before disconnecting USB data.

C3 Super Mini firmware includes both transports. Other ESP32 profiles have separate USB/Wi-Fi images. Use the USB programmer connection to update credentials later. Wi-Fi passwords are cleared from the visible form after programming.

### First-start setup page

Wi-Fi-capable firmware without saved network credentials starts a setup access point:

- Network: **`StarPanel-<board identifier>`**; the app also reports its name when connected over USB.
- Setup network password: **`StarPanel123`**. This is not your router password.
- Address: **http://192.168.4.1/**. Open it manually if a captive-portal window does not appear.

Connect a phone to this network. Enter your home Wi-Fi name/password, gaming PC LAN address and the app's 64-character pairing key. Save. Return the phone to your normal network. The setup access point closes after fresh network telemetry arrives or after ten minutes. If it times out before provisioning, power-cycle the unconfigured board to reopen it.

If you saved incorrect credentials, reconnect by USB and use designer Wi-Fi provisioning to replace them. An IP panel can use USB for power, but runtime telemetry uses only its selected transport. Do not run another bridge on the same COM port.

## Arduino and DCSBIOSKit

Choose a standalone Uno/Nano/Mega profile for independent USB boards, or a DCSBIOSKit slave profile for the vendor bus. Add supported readouts and controls, then save. For bus slaves choose a unique address from **1–126**; the app checks saved designs for duplicates.

Select the slave's programmer COM port, confirm replacement, and choose **Upload saved Arduino design**. The app writes and verifies the bundled firmware and EEPROM design. Arduino mapping changes require this upload again. No Arduino IDE is needed for this workflow.

For standalone boards, connect their USB ports under **Panels & controls**, choosing **Arduino / DCSBIOSKit · 250000 baud**. Multiple standalone boards use separate COM ports. For vendor slaves, disconnect the programmer, connect the powered bus following the [vendor instructions](https://dcsbioskit.com/instructions/), and connect only the master's USB port to the app with the same 250000-baud protocol. Never flash slave firmware to the master.

## Controls and tray operation

Match the selected keyboard chord to the corresponding binding in Star Citizen. **Enable controls** is off at each app start. The game must have focus; the helper refuses to type into another foreground application. Maintained switches can act as soon as controls are enabled and their physical positions plus valid feedback arrive, so set them intentionally first.

Close the window to keep panels running. Click the tray icon to reopen it. Tray menu → **Start with Windows** enables automatic tray startup. Tray menu → **Quit** stops telemetry and releases serial ports. Reinstalling preserves designs; back up `%APPDATA%\StarCitizenHardwareBridge` before manually resetting app data.


## Offline help and AI assistance

**About & help → Offline guides** opens the documentation bundled with the installer. For custom assistance, install the included [AI skill](AI-ASSISTANT.md); the release includes a separate skill ZIP for sharing. The [Live Data tab](DESIGNER.md#live-data-view) inspects current fields at 1 Hz only while visible; tray operation continues without rendering it.

Guides on `main` can be newer than the released installer. For current sample data and helper scripts, use a [source checkout](REPRODUCING.md) and [data-reuse instructions](DATA-REUSE.md). A locally rebuilt installer includes the current data and example designs; advanced source/script links refer to the repository checkout.
