# Build and release

## Requirements

- Windows 10/11 x64 for the desktop installer, bundled AVR uploader and keyboard helper.
- [Node.js](https://nodejs.org/) 22+ and npm.
- [uv](https://docs.astral.sh/uv/) or Python with [PlatformIO](https://docs.platformio.org/en/latest/core/installation/index.html) for firmware builds.
- Git and, for publishing, an authenticated [GitHub CLI](https://cli.github.com/).

```powershell
git clone https://github.com/RogueTech1/starpanel-bridge.git
cd starpanel-bridge
npm ci
npm test
powershell -NoProfile -File scripts/build-native.ps1
```

Start the UI using `Start-Bridge.ps1` or `npm run desktop`. `Start-Bridge.ps1 -Demo` opens the simulator. If a terminal inherited `ELECTRON_RUN_AS_NODE`, clear it before launching Electron. User data is intentionally retained at `%APPDATA%\StarCitizenHardwareBridge` for upgrades from the original app.

## Build all firmware

From the repository root:

```powershell
uv run --with platformio --with esptool==4.9.0 pio run -d firmware -e esp32s3 -e esp32 -e esp32c3 -e esp32s3-wifi -e esp32-wifi -e esp32c3-wifi -e esp32c3supermini -e esp32s2mini
uv run --with platformio pio run -d firmware-dcsbios -e mega-panel -e nano-panel -e mega-standalone -e nano-standalone -e uno-standalone -e leonardo-standalone -e micro-standalone -e promicro-standalone
uv run --with platformio pio pkg install --global --tool 'platformio/tool-avrdude@~1.60300.0'
npm run firmware:package
```

The firmware packaging scripts copy exact images and compute SHA-256 manifests. ESP32 images include bootloader, partition table, boot_app0 and application. AVR manifests cover the Intel HEX firmware; EEPROM design images are generated per upload. `node scripts/package-firmware.mjs esp32c3supermini` can package just that built target for development. Do not mix stale images into a release after changing firmware source.

Bundled firmware images are versioned for reproducible checkout tests; rebuild all targets before a tagged release. The DCSBIOSKit fork is pinned to `fa7f4dddabd20322cc1309ca0021eb0dd5428313`. Its narrowly scoped duplicate-definition patch runs only in the PlatformIO dependency cache and fails if the expected source shape changes.

## Test and package

```powershell
npm test
npm audit --omit=dev
powershell -NoProfile -File scripts/build-native.ps1
npm run dist
```

The NSIS installer is written to `dist/StarPanel-Bridge-Setup-<version>.exe`. Upload tools and images are included through `electron-builder.yml`. Builds are unsigned unless a release maintainer supplies a signing identity through electron-builder's documented environment configuration. Do not claim code signing without a certificate and verified signature.

Run `dist/win-unpacked/StarPanel Bridge.exe --smoke-test` to exercise simulator controls, the designer, separate mappings, tray hiding/reopening and UI rendering. It uses an isolated smoke profile. `--live-check` uses another isolated profile, reads 30 real game frames and writes a screenshot/report under its `validation` subdirectory. It never sends game controls. Inspect reports and screenshots; passing unit tests alone is not a physical hardware test.

Hardware script `scripts/supermini-gear-test.mjs --flash` **replaces COM3 firmware**, programs the seven-pixel GPIO 3 design, briefly sends simulated gear states to the physical board and restores live telemetry. This is a local acceptance helper, not an unattended CI task. Set `STARPANEL_TEST_PORT` for a different known board. Do not run it against an unidentified COM port or while the app owns that port. It updates the local test user's app-data design/settings, so use a dedicated test profile or back up your app data.

## Telemetry schema provenance

`schema/live/sc_extrait.desc` and its readable protocol definitions describe the locally verified LIVE interface. `schema/local.desc` retains the earlier action-capable schema for mock transport tests; shipping it does not enable those APIs in LIVE. The app chooses LIVE by default and the retained schema only for simulator smoke tests.

For personal schema investigation, obtain [Sokren's extractor](https://github.com/Sokren/sc-telemetry-deck/tree/2f5529eb4940f1c9cfdbcdd5bf719bed24d85761/tools) into the ignored `vendor/sc-telemetry-deck` checkout and read its instructions. `Refresh-Schema.ps1` reads the installed executable on disk and creates a descriptor/catalog. It does not inspect process memory or patch the executable. Review changes before replacing a release schema and retest actual field/RPC support. Do not publish game executables, account data or raw gameplay captures.

## Publication

The repository includes Windows CI tests and a manual release-artifact build workflow. A release maintainer should:

1. Update package version, changelog, validation matrix and documentation.
2. Build all firmware and native tools, run tests and audit production dependencies.
3. Smoke-test the packaged UI, inspect screenshots and install-test the NSIS package. Run the installed real-feed check when the game is running, and state separately when it was unavailable.
4. Perform hardware acceptance for the profiles being claimed physically tested.
5. Generate SHA-256 checksums and third-party notices/source archive.
6. Tag the tested commit, create its GitHub release, and attach installer, checksums and source artifacts.

The checked-in CI workflow builds artifacts for review; it does not create a release or claim physical validation automatically. Publish only the artifacts actually tested. Do not include `%APPDATA%`, Wi-Fi credentials, pairing keys, raw game logs or local validation screenshots with player data in the public repository.


The build dependency overrides pin patched minimatch 11.0.1 for electron-builder and @electron/universal to remove the globparts-amplification advisory. Revalidate packaging when changing these overrides.
