# Release validation matrix

Release: **0.5.0**, November 26, 2026. This matrix records what was observed rather than implying every supported profile was physically tested.

| Area | Evidence / scope |
| --- | --- |
| Real LIVE telemetry | Character and seated MISC Starlancer MAX stream, roughly 16 frames/second. Health, oxygen, gear, instruments and ship identity observed. |
| Game → local IP subscriber | Fresh health, oxygen, speed and gear received through authenticated TCP panel protocol. |
| ESP32-C3 Super Mini | Real 4 MB native USB chip identified; firmware images flashed with MD5 verification. GPIO 3 seven-pixel profile acknowledged and saved. |
| Gear logic on real board | Simulated deployed/retracting/deploying/retracted inputs select red pulse/yellow strobe/green rules; stale-data indication disabled; real game feed restored. Board reports seven configured pixels. |
| User visual feedback | Red pulse observed while real game telemetry reported deployed. The seven-pixel configuration was acknowledged; visual brightness and power remain hardware checks. |
| Setup web page | PC joined the actual board setup AP and received HTTP 200 with Wi-Fi name/password, PC address and pairing-key form. |
| Home-network provisioning | Setup UI and USB provisioning implemented; successful connection with this user's home-network credentials has not been asserted. |
| Firmware compilation | Eight ESP32 images; eight configurable AVR images. Additional historical example sketches are source examples. |
| Other physical boards | ESP32/S3/UART C3, Uno/Nano/Mega and DCSBIOSKit master/slaves still need bench validation. |
| Input behavior | Software tests cover fresh-state requirements, disabled inputs, mismatch reconciliation, moving gear, conflict handling, duplicate/session/rate guards and keyboard-chord validation. Native helper verifies its ABI and foreground process guard. Actual in-game key acceptance remains dependent on bindings and Windows/game input handling. |
| Release checks | 27 unit/integration tests pass. Runtime and build dependency audits report no known vulnerabilities. Packaged UI smoke and NSIS install passed. A final installed real-feed check requires the game to be running; the game was closed during this check, so the release distinguishes that from the earlier real-feed/hardware evidence. |

The schema catalog defines possible fields, not guarantees that each is populated on every ship. Missing telemetry stays unavailable. Prototype Arduino output mapping covers speed, altitude, gear and oxygen, while ESP32 JSON panels can select the wider catalog. Physical panels render their own instruments; this is not an MFD framebuffer stream.

## Subsequent documentation and data review

The follow-up on `main` adds reusable sanitized snapshots, a synthetic gear scenario, offline replay, data manifests and fresh-checkout tooling. All 31 software tests, public asset checks and example designs pass. An isolated source snapshot also passed desktop preparation, installer build, packaged simulator smoke and screenshot review. These checks do not add physical-board or in-game evidence to the v0.5.0 matrix above. See the [handoff report](PROJECT-STATUS.md) for details and the next physical checks.
