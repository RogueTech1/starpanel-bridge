# Recreate and verify StarPanel Bridge

This guide describes a clean Windows checkout, a source-built app, reuse of the public data and the limits of reproducibility. For installing the existing product without development tools, use the [quick start](QUICKSTART.md) and the [published installer](https://github.com/RogueTech1/starpanel-bridge/releases/latest).

## Choose a source version

- **Current `main`:** includes these recreation instructions, reusable data and offline replay tools added after the first release.
- **Tag `v0.5.0`:** the immutable original public release. Its installer/source checksums are attached to that release. Follow its version of `docs/DEVELOPMENT.md`; newer helper commands are not part of that tag.

Pin a commit/tag when sharing results. A source rebuild can reproduce behavior and verify assets, but is **not promised byte-for-byte identical** to the published installer: packaging timestamps, toolchains and dependency resolution can affect bytes. Use the official release's checksums to verify the downloaded official installer, not to reject every locally rebuilt installer.

## 1. Obtain the tools and checkout

Use Windows 10/11 x64, Git, Node.js 22+ with npm, and uv. Their upstream installation instructions are linked from [development requirements](DEVELOPMENT.md#requirements). The native helper uses the .NET Framework C# compiler supplied with supported Windows installations. First-time dependency/tool downloads require internet access.

```powershell
git clone https://github.com/RogueTech1/starpanel-bridge.git
cd starpanel-bridge
git switch main
npm ci
npm run verify
```

Run commands from the checkout root. `npm ci` uses `package-lock.json`; do not replace it with unreviewed dependency upgrades when reproducing a result. `npm run verify` runs software tests, local documentation-link checks, every firmware manifest, the public data manifest and every shared example design. It does not touch hardware or contact the game.

## 2. Rebuild the desktop app using bundled firmware

```powershell
npm run prepare:desktop
npm run dist
```

Preparation verifies the checked-in firmware images, installs the pinned PlatformIO AVR uploader package if needed, copies its Windows tools into the ignored `tools/` directory, and compiles/self-tests the native keyboard helper. It does **not** compile firmware or flash connected boards. This closes a common fresh-checkout gap: `npm ci` alone does not create the ignored native helper and AVR upload tools required by the installer.

Output: `dist/StarPanel-Bridge-Setup-<package-version>.exe`, plus `dist/win-unpacked/`. This local build is unsigned unless the release configuration is deliberately changed to provide signing. Do not overwrite published assets with a different local build under the same release/version.

The installer includes firmware and upload tools for end users. Building it from source requires the developer prerequisites above; using the published installer does not require Node, Python or PlatformIO.

## 3. Check appearance and background operation

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
& '.\dist\win-unpacked\StarPanel Bridge.exe' --smoke-test
```

This uses an isolated simulator profile and exercises mapped controls, designer save, maintained-switch configuration, the seven-pixel rule, separate mappings, Live Data and tray close/reopen behavior. It briefly shows a window. Reports/screenshots are under `%APPDATA%\StarCitizenHardwareBridge-Smoke\validation` for a packaged run; source smoke runs write to the ignored checkout `validation/` directory. Inspect the screenshots as well as the exit status.

For ordinary source use, run `Start-Bridge.ps1 -Demo`. Close the window and reopen it from the tray. The backend continues forwarding while hidden; the Live Data view renders only while visible. Simulator labels must remain visible and no real game inputs should be sent in this mode.

When the game is running, `--live-check` uses a separate profile and reads 30 frames without sending actions. The game being closed is an unavailable live check, not evidence that a simulator test proves game compatibility. Do not start it only to leave an unexplained timeout in a validation report.

## 4. Rebuild firmware only when needed

To change firmware or independently validate a target compiler build, follow [Build all firmware](DEVELOPMENT.md#build-all-firmware). Build all intended targets before `npm run firmware:package`; PlatformIO can clean other environments after project configuration changes. Packaging then hashes the actual build outputs.

There are eight ESP32 images and eight configurable AVR images. Several board menu entries share a deliberately compatible image; the 17 board/profile choices are not 17 separate firmware binaries. Keep exact chip, flash capacity, pin map and USB mode distinct. DCSBIOSKit masters retain vendor firmware; upload panel firmware only to the correct slave/programmer or standalone board.

The vendor library is pinned and the documented duplicate-definition patch is applied only to its build cache. Some upstream transitive metadata/tool behavior can change, so retain the resolved package list, source archive and image manifests when exact compiler inputs matter. Run `node scripts/verify-images.mjs` after packaging. Never turn off chip/signature/hash checks to make a mismatched build appear valid.

## 5. Reproduce data and panel examples

```powershell
node scripts/replay-telemetry.mjs data/scenarios/gear-cycle.ndjson --output gear-packets.ndjson
node scripts/validate-design.mjs examples/supermini-gear.starpanel.json
```

Read [Data reuse](DATA-REUSE.md) for provenance, units, unavailable sentinels and private recording sanitization. Read [Build recipes](BUILD-RECIPES.md) to import examples and connect actual hardware. Offline packet generation does not broadcast to a board. The beginner app's Simulator supplies its normal live-generated demonstration feed.

## 6. Record a result others can assess

Include the Git commit/tag, app/game version, exact board/flash size, transport, display/LED model, pin table, image manifest hash, test commands and observed result. Separate software tests, compile success, actual flash/readback, protocol acknowledgments and visual/in-game behavior. A compiled target is not a physically tested board.

Use a minimal exported design and sanitized sample when reporting problems. Do not publish private logs or credentials. See [Contributing](../CONTRIBUTING.md), [Security](../SECURITY.md), [Validation](VALIDATION.md) and the [AI skill](AI-ASSISTANT.md).
