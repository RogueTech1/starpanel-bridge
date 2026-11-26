# Project status and handoff

Review date: **November 26, 2026**. This report describes the documentation/data follow-up on `main` after the original **v0.5.0** release. Use `git rev-parse HEAD` or the GitHub commit history to identify the exact checkout being used.

## Available to other builders

- Public [repository](https://github.com/RogueTech1/starpanel-bridge), [installer/source release](https://github.com/RogueTech1/starpanel-bridge/releases/tag/v0.5.0), and published SHA-256 checksums.
- [Quick start](QUICKSTART.md), [board/topology guide](HARDWARE.md), [build recipes](BUILD-RECIPES.md), [designer/logic guide](DESIGNER.md) and [advanced protocol guide](PROGRAMMING.md).
- [Clean source recreation](REPRODUCING.md), including preparation of native/upload tools from a new checkout.
- [Public recorded snapshots and synthetic scenarios](DATA-REUSE.md), integrity manifests, offline packet replay and an allowlisted private-recording sanitizer.
- Five importable panel designs and an [AI programming skill](AI-ASSISTANT.md).
- Credits to DCSBIOSKit and DCS-BIOS in the app, README, release notes and notices.

## Checks completed for this follow-up

| Check | Observed result |
| --- | --- |
| Existing public checkout | `npm ci`, original 27 tests and native-helper self-test passed before the follow-up changes |
| New staged source snapshot | Fresh dependency installation and all 31 tests passed |
| Public firmware assets | Eight ESP32 and eight AVR image profiles verified against manifests |
| Public data assets | Seven schema/sample/scenario assets verified against their data manifest |
| Shared designs | All five examples validate against board/pin/mapping constraints |
| Documentation | Local file links and Markdown heading anchors pass, including nested data/skill guides |
| Dependency audit | No known vulnerabilities reported in the reviewed dependency tree |
| Native/upload preparation | `npm run prepare:desktop` passed in the isolated source snapshot |
| Installer build | NSIS Windows x64 package built from that source snapshot |
| Packaged UI | Simulator smoke passed: eight dashboard cards, designer save, maintained switch, seven-pixel rules, separate mappings, Live Data rows and tray close/reopen |
| Visual review | Dashboard and designer screenshots inspected; no overlap or broken layout observed at the smoke-test window size |
| Data tools | Recorded snapshot and synthetic scenario replay tested; output is always marked demo and stale data becomes unavailable |
| Privacy boundary | Shared samples use an explicit field allowlist; raw logs, app data, credentials and local validation captures stay outside the public commit |

The local review installer is a development build. Published v0.5.0 assets retain their original release identity and checksums. The new data/tools/guides are on `main`, so users needing them should follow the current-checkout instructions.

## What still needs physical confirmation

Earlier in the session, actual LIVE character/ship telemetry, the physical C3 Super Mini upload, gear-rule responses, seven configured pixels and the setup HTTP page were observed. The user saw a red pulse while telemetry reported deployed. These historical observations are distinct from the synthetic fixtures used for repeatable tests.

Other listed boards and DCSBIOSKit buses need bench checks. Home-network provisioning with a user's real credentials and actual in-game keyboard acceptance remain unverified claims. The game was closed for the final installed live-read check in the release session. This follow-up used offline/simulator verification and did not create new game telemetry evidence. See the [validation matrix](VALIDATION.md) for the full boundary.

## Suggested next physical session

1. Launch the matching LIVE build and enter a pilot seat; confirm fresh values in **Live Data**.
2. Confirm all seven WS2812 pixels follow deployed, moving and retracted states, then verify loss of telemetry turns them off.
3. Provision the board to the private LAN and confirm it appears as an authenticated IP client before relying on Wi-Fi.
4. Validate the user's actual key bindings with a momentary button before enabling a maintained switch.
5. Bench-test each additional exact board/bus topology before changing its validation level.

Record version, image hash, design, wiring and observations using the [recreation guide](REPRODUCING.md#6-record-a-result-others-can-assess). Keep uncertain support claims visible so the next builder can assess them accurately.
