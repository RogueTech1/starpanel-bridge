# Changelog

## 0.6.0 — privacy cleanup and complete master/slave workflow

- Added vendor-compatible DCSBIOSKit Master Controller routing firmware and a separate role-checked master upload/restore flow. Slave/panel EEPROM writes remain separate.
- Documented output broadcasts, slave polling, addresses, unique input messages and BORT's contextual role. Bus-capable fields show private RS485 addresses in Mappings.
- Fixed bus readouts to use raw telemetry rather than requiring default desktop aliases.
- Audited Git history, public source and unpacked release contents. Removed local probes, unused prototypes and duplicate/session-specific writeups.
- Replaced gameplay snapshots with synthetic fixtures. Kept replay, sanitization, tests and reproducible build/deployment tools.
- Reduced notices to bundled dependencies while preserving legal attribution. Excluded unused upstream credential-bearing examples and dependency badge/readme material from cleaned packages.
- Added public-tree/privacy and history-secret checks to verification/CI.

## 0.5.0 — initial public release

Windows tray app, point-and-click panel designer, common ESP32/Arduino profiles, Wi-Fi/USB readouts, maintained switches, LED rules, Live Data and initial DCSBIOSKit slave adapter. See the current guides and validation matrix for supported scope.
