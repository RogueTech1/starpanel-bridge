# Reusable StarPanel telemetry data

This directory supplies small, reviewable examples for reproducing panel behavior without a running game. Read [Data reuse and recording](../docs/DATA-REUSE.md) before using them as evidence or sharing your own captures.

| File | What it contains | Evidence level |
| --- | --- | --- |
| [Character snapshot](samples/live-4.10.3-character.json) | Allowlisted health/oxygen from a real LIVE capture | One recorded, sanitized snapshot |
| [Seated snapshot](samples/live-4.10.3-seated.json) | Selected flight, power and vital fields from a real seated capture | One recorded, sanitized snapshot |
| [Gear scenario](scenarios/gear-cycle.ndjson) | Deployed → retracting → retracted → deploying → deployed → stale | Synthetic test sequence; not recorded gameplay |
| [Manifest](manifest.json) | SHA-256 and byte counts for samples and interoperability definitions | Integrity/provenance reference |

The metadata gives the original capture's overall frame count and elapsed time. It **does not mean every frame is published**. These files are selected snapshots, not full recordings, and do not establish telemetry support for every ship or build.

Public samples exclude player/account names, unique ship entity IDs, positions/locations, contracts, addresses, credentials and precise absolute capture timestamps. Numeric instrument readings and enum states are preserved; the unavailable altitude sentinel remains in the raw seated snapshot so client normalization can be reproduced.

Original example code and documentation use the project [MIT license](../LICENSE). These measurements and interface definitions are provided for interoperability and testing, without a claim to ownership of Star Citizen or its assets. Third-party ownership/notices remain applicable. No game executable or asset is included.
