# Reuse telemetry data and make your own recordings

## What is public

The repository separates three useful kinds of material:

1. **Interoperability definitions:** `schema/live/sc_extrait.desc`, its readable `.proto`, and `field-catalog.json` describe the locally verified LIVE interface. The descriptor contains types and field names, not account credentials or a game executable.
2. **Recorded observations:** two allowlisted snapshots under `data/samples/` retain selected measurements from the November 26, 2026 LIVE session. Their metadata identifies game file version `4.10.201.48085`. One capture observed character data; another observed a seated MISC Starlancer MAX. Only selected snapshots are shared, not the complete streams.
3. **Synthetic scenarios:** `data/scenarios/gear-cycle.ndjson` exercises known state transitions and stale-data handling. Its values and timing were constructed for tests. It is not proof that the game emitted that sequence.

The earlier action-capable descriptor `schema/local.desc` is a separate mock/simulator fixture. It does not enable those actions in the LIVE game. Read the [validation matrix](VALIDATION.md) when making support claims.

## Verify the data before using it

From a current checkout with `npm ci` completed:

```powershell
node scripts/data-manifest.mjs --check
node scripts/verify-images.mjs
```

`data/manifest.json` records SHA-256 digests and byte counts for the public samples and schema files. Firmware has separate manifests in each `firmware-images/<target>/` directory. Git preserves HEX as binary because changing its line endings changes its checksum even when a programmer might still parse it. Do not “fix” integrity failures by silently disabling checks.

If deliberately changing a sample/schema, review the diff and provenance first, then regenerate the data manifest with `node scripts/data-manifest.mjs`. An updated hash proves which bytes were selected, not that their measurements or support claims are true.

## Offline replay

```powershell
node scripts/replay-telemetry.mjs data/samples/live-4.10.3-seated.json --output seated-packets.ndjson
node scripts/replay-telemetry.mjs data/scenarios/gear-cycle.ndjson --output gear-packets.ndjson
```

Each output line contains `{offset_ms, packet}`. The inner packet uses the normal panel protocol and default aliases from `panel.json`. Extract `packet` if feeding a custom display parser. This tool produces packets immediately; offsets are simulated time, not wall-clock delays or a live serial/network broadcast.

**Every replay packet has `source:"demo"`**, even when the original snapshot was recorded from the game. Replaying instantiates no game client, keyboard helper, serial port or TCP listener. It cannot operate your ship or reflash a board. The normal app's **Simulator** remains the easiest way to try an actual connected panel; importing these files into the app is not implemented by this command.

Expected gear scenario results:

| Offset | Gear output | Expected gear-lamp rule |
| --- | --- | --- |
| 0 ms | Deployed | Red pulse |
| 1000 ms | Retracting | Yellow strobe |
| 3000 ms | Retracted | Green |
| 4000 ms | Deploying | Yellow strobe |
| 6000 ms | Deployed | Red pulse |
| 8501 ms | `null`, `stale:true` | Off |

The final record intentionally has no frame. Advancing the simulated clock more than two seconds past the previous frame demonstrates expiry. A record with a frame replaces the previous snapshot, matching the bridge's current frame handling. Offsets must be ordered integer milliseconds within 24 hours. Inputs are bounded to 10 MB and 10000 records.

## Read the recorded values correctly

| Public example | Recorded observation | Interpretation |
| --- | --- | --- |
| Health current/max | 100 / 100 | Gauge pair, not an arbitrary percentage conversion |
| Oxygen current/max | 1 / 1 | Full gauge in this capture; do not assume every gauge uses a 0–100 range |
| Speed | About `1.74e-7` | Effectively stationary numerical noise; preserve the raw measurement |
| Hydrogen fuel | About `0.97052` | Raw game value; universal units/scaling have not been independently validated |
| Radar altitude | About `8.05337` | Separate instrument from absolute altitude; do not infer a world position |
| Absolute altitude | About `3.402823e38` | Observed FLT_MAX unavailable sentinel; the panel output becomes `null` |
| Power flags | Selected booleans | Distinct subsystem states; not proof all ships export every flag |

The dictionary for all possible fields is [the LIVE catalog](../schema/live/field-catalog.json). A field definition does not prove runtime presence. Omitted fields remain omitted in the shared snapshots. The current decoder may supply a non-optional protobuf boolean's default false **only inside a present parent message**. Do not create an absent subsystem or turn missing telemetry into a physical OFF command.

Repeated collections and optional messages may depend on context. All display/logic implementations must preserve literal zero, false and null as distinct cases, mark stale data and retain simulator provenance. The samples intentionally keep the altitude sentinel in their raw frame so this behavior can be tested.

## Record your own session privately

From the project root, with the game's local telemetry service running:

```powershell
node src/main.mjs --record --seconds 10
```

This CLI defaults to the LIVE descriptor and read-only controls. It writes timestamped NDJSON files under the ignored `recordings/` directory. A record contains `{time, frame}`. Raw frames can contain personal game/session details; keep this directory private. The recorder may skip frames under disk backpressure, so it is not a lossless recorder or a performance benchmark.

Review the game's build/context and schema before interpreting the recording. The CLI uses the source checkout's `panel.json`, not the installed app's user-data mappings. `--schema` and `--config` can select explicit files for advanced work. `--record` does not itself arm actions.

## Prepare a shareable subset

```powershell
node scripts/sanitize-recording.mjs recordings/YOUR-CAPTURE.ndjson sanitized.ndjson
```

The sanitizer uses the explicit field allowlist in `src/recordings.mjs`. It keeps selected numeric/boolean instrument and vital fields plus known deployment enums; it drops arbitrary strings and all non-allowlisted fields. Absolute timestamps become relative offsets. Missing/invalid timestamps produce `offset_ms:null`; the replay command rejects these rather than inventing timing. Assign explicit documented offsets yourself if you want a constructed scenario.

Review the exported JSON before sharing. The allowlist reduces common disclosures; it is not a guarantee that any conceivable user-supplied file is safe or anonymous. Publish only the portion you intend to disclose. Never upload Wi-Fi configuration packets, pairing keys, app-data folders, raw game logs or game executables. Sanitized data is not automatically added to Git.

Accompany a shared file with its build/context, selection method and whether its timing is recorded or constructed. Keep synthetic or manually retimed scenarios labeled accordingly. Do not infer physical/in-game support from a successful offline replay alone.

## Use the files in another project

Copy a sample and cite its provenance and the [repository/tag](https://github.com/RogueTech1/starpanel-bridge/releases/tag/v0.5.0), or link to the current [data directory](../data/README.md) when using samples added after the original release. Pin a Git commit and retain the manifest when exact bytes matter. New data tools were added on `main` after v0.5.0; do not assume they exist in the original tagged source ZIP.

Custom clients can use `src/recordings.mjs` and `src/replay.mjs` from a checkout, or implement the documented [panel protocol](PROGRAMMING.md). Attribute DCSBIOSKit and DCS-BIOS as the architectural inspiration and preserve dependency notices when redistributing actual library code. Reusing these observations does not grant rights to unrelated game assets.
