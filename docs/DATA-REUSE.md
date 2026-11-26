# Protocol fixtures and private recordings

The maintained repository contains synthetic protocol fixtures, not personal gameplay captures. Use them to develop clients and reproduce parsing, unavailable values, gear transitions and stale-data handling without the game or hardware.

| Asset | Purpose |
| --- | --- |
| [Character fixture](../data/samples/character.json) | Health/oxygen gauge example |
| [Seated fixture](../data/samples/seated.json) | Flight/power fields, explicit zero/false and an unavailable altitude sentinel |
| [Gear scenario](../data/scenarios/gear-cycle.ndjson) | Deployed, retracting, retracted, deploying and stale states |
| [Data manifest](../data/manifest.json) | SHA-256 and sizes for schemas and fixtures |
| [LIVE field catalog](../schema/live/field-catalog.json) | Types and possible fields, not a guarantee of runtime presence |

The fixtures are authored examples and must not be represented as game recordings or hardware evidence. No player names, entity IDs, locations, account data, personal capture times, Wi-Fi credentials or pairing keys are needed to recreate the project.

## Verify and replay

```powershell
npm ci
node scripts/data-manifest.mjs --check
node scripts/replay-telemetry.mjs data/samples/seated.json --output seated-packets.ndjson
node scripts/replay-telemetry.mjs data/scenarios/gear-cycle.ndjson --output gear-packets.ndjson
```

Each output line is `{offset_ms, packet}`. The inner packet uses normal panel aliases from `panel.json`. Outputs are produced immediately using a simulated clock. This command does not broadcast over USB/TCP, start the game, send keys or flash hardware. Every packet remains `source:"demo"`. The app's **Simulator** is the easy way to supply its generated feed to an actual connected panel.

| Scenario offset | Gear output | Gear-lamp example |
| --- | --- | --- |
| 0 ms | Deployed | Red pulse |
| 1000 ms | Retracting | Yellow strobe |
| 3000 ms | Retracted | Green |
| 4000 ms | Deploying | Yellow strobe |
| 6000 ms | Deployed | Red pulse |
| 8501 ms | Null/stale | Off |

The last scenario record has no frame, deliberately advancing past the two-second freshness limit. A frame replaces the previous snapshot. Replay accepts up to 10000 records/10 MB and ordered integer offsets within 24 hours.

## Value semantics

Preserve explicit zero, false and null separately. Missing data is unavailable, not a physical OFF instruction. Non-optional protobuf booleans default to false only inside a present parent message. Gauge ranges vary: health may use 100/100, oxygen 1/1. Do not assume raw fuel/instrument units or scaling universally.

The raw seated fixture includes FLT_MAX (`3.402823e38`) as an unavailable altitude example. Panel normalization converts it to null. Radar altitude is a separate field. The catalog defines possible fields; a particular ship/context may omit them. The older `schema/local.desc` is an action-capable mock fixture, separate from the default LIVE interface.

## Record privately and prepare a minimal subset

```powershell
node src/main.mjs --record --seconds 10
node scripts/sanitize-recording.mjs recordings/YOUR-CAPTURE.ndjson sanitized.ndjson
```

The recorder uses the source checkout's configuration and writes `{time, frame}` NDJSON under ignored `recordings/`. It is read-only by default and can skip frames under disk backpressure; it is not a lossless benchmark. Raw game frames may contain personal/session data. Keep them private.

The sanitizer keeps only numeric/boolean fields and known deployment enums from `src/recordings.mjs`, dropping arbitrary strings and unknown fields. Absolute times become relative offsets; missing/invalid times produce null offsets, which replay rejects rather than inventing timing. Manually retimed data should be labeled constructed/synthetic.

Review the output before sharing: an allowlist reduces common disclosures but is not a universal anonymity guarantee. Include build/schema/context and selection/timing provenance. Never publish app-data folders, configuration packets containing credentials, pairing keys, raw game logs or game executables. Sanitized output is not automatically committed.

## Reuse in another project

Pin a Git commit and keep the manifest when exact fixture/schema bytes matter. Project examples/code are MIT licensed; game/interface ownership and third-party notices remain applicable. See [Advanced programming](PROGRAMMING.md), [Recreate and verify](REPRODUCING.md), [Security](../SECURITY.md) and [Privacy audit](PRIVACY-AUDIT.md).
