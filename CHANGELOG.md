# Changelog

## Unreleased — reproduction and data documentation

- Added selected sanitized LIVE snapshots, a clearly synthetic gear scenario, asset hashes and data-provenance documentation.
- Added offline packet replay and an allowlisted private-recording sanitizer; replays always remain labeled demo.
- Added a fresh-checkout desktop preparation command and complete verification entry point, covering images, data, guides and every shared design.
- Expanded documentation checks to nested Markdown files and heading anchors; included data/examples in future source-built installers.
- Reviewed the public checkout, source-built installer and simulator UI. The original v0.5.0 release remains the immutable baseline for its published assets.

## 0.5.0 — StarPanel Bridge public release

- Renamed and packaged the Windows tray application as StarPanel Bridge.
- Added common ESP32/S3/C3 profiles, C3 Super Mini native USB, standalone Uno/Nano/Mega, and configurable DCSBIOSKit Nano/Mega slave uploads.
- Added point-and-click keyboard bindings and telemetry-backed maintained switches, with mismatch stabilization, transition handling and no repeated blind toggles.
- Added ordered visual LED rules, RGB effects and configurable WS2812 chain length. Deployed/tested a seven-pixel GPIO 3 gear indicator on a physical C3 Super Mini.
- Added a first-start Wi-Fi setup page and USB-triggered setup reopening. Verified the actual board's HTTP setup form.
- Fixed native serial DTR/RTS preservation and explicit reset handling, verified firmware hashes and chip/flash guards, and added board acknowledgments.
- Preserved false protobuf booleans within present subsystem messages and unavailable instrument sentinels.
- Added shareable designs, guided setup, About/help links, full user/developer documentation, credits, notices and CI.

Real LIVE telemetry and the C3 Super Mini path were observed. Other firmware profiles compile but need bench validation; actual game input acceptance depends on bindings and Windows/game handling. See [validation](docs/VALIDATION.md).
