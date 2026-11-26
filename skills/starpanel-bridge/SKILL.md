---
name: starpanel-bridge
description: Help build, program, configure and troubleshoot StarPanel Bridge cockpit panels using ESP32, Arduino or DCSBIOSKit hardware, including telemetry mappings, maintained switches, LED rules and custom firmware.
---

# StarPanel Bridge panel programming

Use this skill for StarPanel Bridge hardware and firmware tasks. Preserve the user's selected board, panel purpose and existing mappings. Locate the project checkout by its `package.json` name `starpanel-bridge`; if only this skill is installed, use the [public repository](https://github.com/RogueTech1/starpanel-bridge) and read the relevant documentation before editing or programming hardware.

## Route to the owning source

- Beginner setup, firmware upload and Wi-Fi: `docs/QUICKSTART.md`.
- Exact board/flash/GPIO/display and DCSBIOSKit topology: `docs/HARDWARE.md`, `src/profiles.mjs` and both `platformio.ini` files.
- Visual rules and maintained switches: `docs/DESIGNER.md`, `src/panel.mjs`, `src/profiles.mjs`.
- Custom code/protocol/EEPROM: `docs/PROGRAMMING.md`, `firmware/src/main.cpp`, `firmware-dcsbios/src/configured.cpp`, `src/avr.mjs`.
- Connection failures: `docs/TROUBLESHOOTING.md` and non-secret `device_info`.
- Source builds and tests: `docs/DEVELOPMENT.md` and `package.json`.

Read only the sources needed for the current task. Current code and manifests determine support; board aliases or a compiled image do not prove physical validation. Use `docs/VALIDATION.md` for the tested scope. Do not promise synthetic input acceptance or unobserved telemetry fields.

## Make a panel easy to review

Identify the exact board/chip/flash size, connection (USB/Wi-Fi/RS485), display or LED model and wiring. Prefer the built-in designer and exported `.starpanel.json` format for supported components. For a requested custom design, produce a concrete mapping and pin table, validate it using `node scripts/validate-design.mjs <file>`, and explain how to import/program it. Ask for genuinely missing wiring or credentials without requesting secrets in public logs or committed files.

Reuse the project's actual catalog paths and enums. Never invent a game action, unit or field from a label. Preserve absent/null versus explicit zero/false, and distinguish real telemetry from simulator data. The LIVE schema and an older action-capable test schema are separate; no cached historical action list grants live API support. Keyboard mappings must match the user's actual game bindings and only execute when enabled and Star Citizen has focus.

## Operational constraints that matter

- DCSBIOSKit **master**, **hub**, **slave/shield** and **programmer** are different roles. Keep vendor master firmware intact. Program disconnected slaves through their programmer. Powered RS485 is not Ethernet; do not connect it to network equipment or hot-plug powered bus cables.
- Board replacement requires a concrete, identified target and the user's programming request. If they already authorized programming that board, proceed without asking again. Do not flash every detected COM port or infer a board from a COM number alone. Chip/flash/signature checks must remain enabled.
- Use conservative GPIO lists from the exact profile. Reserve USB, I2C, boot/flash and bus pins. An ESP32 cannot accept a 5 V input. LED-chain count and brightness do not establish supply capacity.
- JSON panels: 115200 baud USB or paired TCP 2943. Arduino runtime: 250000 baud DCS-BIOS framing. Game telemetry: loopback gRPC 2942. Do not confuse those ports/protocols.
- Wi-Fi setup AP: `StarPanel-...`, password `StarPanel123`, **http://192.168.4.1/**. It has no internet. The home network password is supplied by the user, and the pairing key comes from their app. Do not copy credentials into designs or source.
- Maintained switches express desired state: require recent physical reports and fresh, stable feedback; wait through moving states; suppress conflicting switches and repeated uncertain toggles. Never implement a blind “toggle every poll” loop.
- LED rules use first-match priority. Missing/stale data means off. The current visual programmer drives one WS2812 chain; all its pixels share a rule. Independent pixel behavior needs a firmware change, not a claim that the existing UI already does it.

## Extend and verify

For a new board, update board metadata, runtime pin validation, firmware environment, image manifest, uploader target and docs together. Compile its exact target. Test wrong-chip/flash/MCU rejection, then perform physical checks only on an authorized identified board. For logic changes, run meaningful freshness, transition and retry tests. Keep custom display/network parsers bounded and handle reconnects without replaying inputs.

Report what was changed, how to program/use it, tests actually run and material remaining hardware checks. Credit DCSBIOSKit and DCS-BIOS when describing the architecture. Do not publish the user's data or create a repository/release unless their task authorizes publication.
