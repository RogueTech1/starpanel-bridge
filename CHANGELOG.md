# Changelog

## 0.9.0 — API interaction only

- Removed the Windows keyboard helper, emulation implementation, key-binding UI and native build/package steps. All game inputs now use advertised API actions.
- Reject legacy key mappings in imported/saved designs and advanced configurations. At startup, disable legacy input mappings in memory while preserving readouts and original files; show a migration notice.
- Added separate ON/OFF API action fields for maintained switches and converted shipped examples/tests to API actions.
- LIVE 4.10.3 is explicitly readout-only; there is no fallback input path when the game lacks action RPCs.

## 0.8.1 — dedicated master controller section

- Made the DCSBIOSKit Master Controller prominent in Board library and separately grouped in the designer dropdown as a setup shortcut, preserving the current panel.
- Added a dedicated Master controller tab with its own port connection, restore controls, devices/log and fixed UART1/2/3 TX-enable D2/D3/D4 mapping.
- Kept master firmware/port protection separate from standard Mega and slave panel GPIO/EEPROM profiles.

## 0.8.0 — full vendor board library

- Added a searchable Board library covering all 16 reviewed DCSBIOSKit store products and existing standalone profiles, with product links and distinct master/slave/passive/custom roles.
- Added separate Nano Shield and Mega Shield panel profiles sharing verified slave images; address validation/collision checks include all slave variants.
- Conservatively reserved conflicting backlight pins, including removing D6 from the legacy Nano slave profile. Existing D6 designs require reassignment before upload.
- Documented DevKit controller/bootloader/pinout limits and prevented passive/unverified products from appearing as panel flash targets.
- Added plain-English names and purpose descriptions for every bundled output/action, searchable in I/O Reference and shown in designer choices; uncertain units and newly discovered actions are explicitly labeled.
- Added expected output states/values with friendly enum meanings, exact wire constants/codes, boolean semantics, numeric guidance and unavailable-state rules.

## 0.7.0 — integrated I/O Reference

- Replaced separate catalog/mapping lookup tabs with a searchable input/output reference, version/category/status filters, live readings, enums, mapped aliases and copyable examples.
- Added reference-to-designer insertion with active-schema, action-advertisement, board and component checks.
- Added exact Arduino listener snippets for assigned RS485 readouts and gated reference refresh to the visible tab.

### Telemetry research documentation

- Saved version-specific Windows/Wine telemetry activation, PTU action-enable setting, listener/stream verification and rollback instructions with upstream attribution.
- Compared SC Telemetry Deck's pinned schema/action reference: 50 catalog entries beyond LIVE, matching our saved PTU catalog, and no new action names. Documented read-only/action limitations and privacy-sensitive fields.
- Added a read-only descriptor/action comparison tool and an attributed metadata snapshot. Production game schema and board firmware remain unchanged.

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
