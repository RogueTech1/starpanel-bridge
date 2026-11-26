# Validation scope

Software tests, compiler success, firmware readback, protocol acknowledgments and physical/in-game observations are different validation levels. Use `npm run verify` for the maintained software/asset checks and GitHub Actions for the current commit's CI result.

| Area | Scope |
| --- | --- |
| LIVE interoperability | LIVE 4.10.3 character/ship telemetry was previously observed; fields depend on build, ship and context |
| ESP32-C3 Super Mini | Native USB firmware upload, gear-rule handling and setup HTTP page were previously exercised on physical hardware |
| Other ESP32 boards | Exact compiler profiles and image checks exist; bench checks remain necessary |
| Standalone/slave AVR | Compiler, EEPROM layout, address map and host transport tests; exact boards need bench checks |
| DCSBIOSKit master | Vendor-compatible ATmega2560 three-bus sketch compiles; dedicated uploader checks image role/MCU and avoids slave EEPROM writes; physical master/slave validation remains necessary |
| Slave return path | Software tests cover distinct slave aliases reaching host actions and address configuration; real RS485 polling/electrical timing is not emulated by these tests |
| Game inputs | Freshness, focus, duplication, mismatch and rate guards tested in software; actual key acceptance depends on game bindings and Windows/game handling |
| Synthetic fixtures | Exercise protocol semantics; no real-world compatibility claim follows from replay alone |
| Privacy | Git/history, public-tree and unpacked release scans are described in the privacy audit; legal third-party attribution is retained |

The Arduino readout map currently covers speed, altitude, gear and oxygen. ESP32 JSON clients can use the broader catalog. Panels render their own instruments; no MFD video export is provided. Master firmware is a transport router, not an aircraft/game-specific data mapper.

Before expanding a physical support claim, record exact board/flash/bootloader, transport, wiring, image hash, design and observed result. See [Master and slaves](DCSBIOSKIT.md), [Reproduction](REPRODUCING.md) and [Privacy audit](PRIVACY-AUDIT.md).
