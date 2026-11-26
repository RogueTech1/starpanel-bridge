# DCSBIOSKit hardware

The maintained guide is [Hardware and wiring](docs/HARDWARE.md), including the master controller, hubs, Nano/Mega slaves, shields, programmer and standalone Arduino alternatives.

Use the app's **DCSBIOSKit Main / Master Controller** connection role for runtime master ports; it protects designated master ports from slave/panel firmware uploads. Keep the vendor master firmware intact. Upload a design to a disconnected slave through its programmer, then reconnect the powered bus following [DCSBIOSKit instructions](https://dcsbioskit.com/instructions/).

Thank you to [DCSBIOSKit](https://dcsbioskit.com/) and [DCS-BIOS](https://github.com/DCS-Skunkworks/dcs-bios) for the inspiration and open cockpit ecosystem.
