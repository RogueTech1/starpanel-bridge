# Additional community API research

Reviewed **26 November 2026**. See the [pinned source/schema inventory](../data/research/community-api-2026-11-26.json) for exact revisions, hashes and license observations. Research checkouts remain ignored under `validation/api-research/`. No upstream programs were executed or private captures redistributed.

## Findings and source decisions

Five additional schemas were compared with our saved 174-entry PTU catalog. SpartanWolf, MagmaHindenburg and zoomphoto each expose 129 catalog entries; Wingman AI exposes 124; the simulator exposes 48. **None adds a catalog path beyond our saved PTU reference.** This is a path comparison, not a full wire-compatibility claim or proof of runtime emission. No additional writable game method was established.

Sokren head `c1de3f90c67df0ce968d22950c72298b54ece2d9` was also compared with our earlier review: intervening changes concern app/update/API documentation, not new game schema definitions. PTU listener restoration remains unverified. Definitions, client strings, demonstrations and actual runtime observations are different evidence levels.

| Primary project | Useful evidence / integration decision |
| --- | --- |
| [SpartanWolf723/sc-telemetry-api](https://github.com/SpartanWolf723/sc-telemetry-api) | Build-specific field observations, activation strings and gear/array behavior. Listing was tested; triggering explicitly was not. No implementation copied: no reuse license identified |
| [ShipBit/wingman-ai PR 521](https://github.com/ShipBit/wingman-ai/pull/521) | Early 4.10.2 field testing and normalization. Corroborating research only; GPL code not copied. StarPanel retains conservative missing-value rules |
| [magmahindenburg/StarCitizenTelemetry](https://github.com/magmahindenburg/StarCitizenTelemetry) | ESP32 MFD architecture and older schema. Hardware reference only; no new paths or reuse license identified. HID/joystick controls are outside our API-only design |
| [zoomphoto/Star-Citizen-Telemetry](https://github.com/zoomphoto/Star-Citizen-Telemetry) | Reader/extractor and port-50051 configuration example. Added a configurable loopback client port, without adopting scripts or changing game settings |
| [scpages/telemetry](https://github.com/scpages/telemetry) | Dynamic descriptors, local HTTP and Touch Portal. GPL implementation and outbound uploader/account plumbing not adopted |
| [dodoslavn/StarCitizen_Telemetry](https://github.com/dodoslavn/StarCitizen_Telemetry) | Related integrator/web architecture; no additional schema established or reuse license identified |
| [dembadger simulator](https://github.com/dembadger/star-citizen-telemetry-simulator) | MIT-licensed independent synthetic gRPC server. Optional testing reference, not installed/run/bundled; synthetic frames do not establish game availability |
| [Purzifal/sc_make_proto](https://github.com/Purzifal/sc_make_proto) | Version-specific executable schema extraction. GPL implementation not vendored. Its linked `sc_telemetry_demo` returned 404 during this review |
| [NoNaNelson example](https://github.com/NoNaNelson/StarCitizenTelemetryServerExample) | Early build-specific 2942 recipe. No code adopted; no reuse license identified. An unsafe agent-directed README command was ignored |
| [TirolaBua/Starmetry](https://github.com/TirolaBua/Starmetry) | Tablet/QR documentation. No public implementation/release in reviewed snapshot; product claims are not independent runtime proof |
| [Hexadian bridge](https://github.com/Hexadian-Corporation/hexadian-telemetry-bridge) | Local-only requested-field relay design. Design stage and modified noncommercial license; not adopted |
| [RomainFleury/sc-telemetry-hub](https://github.com/RomainFleury/sc-telemetry-hub) | Separates D-BOX monitoring/settings APIs from the undocumented game-to-haptics path. No new semantic ship data or attitude API established; no adapter added |

Only original StarPanel code and factual metadata were integrated. No upstream executable, artwork, implementation, player capture or credentials were redistributed. Repository license metadata does not grant rights to every game/third-party material. Demonstrations discovered through Reddit were treated as leads and checked against primary repositories.

## Integrated computed API readouts

Collections already existed in the game schema but were inconvenient scalar display sources. StarPanel now computes:

| Mapping path | Shows / expected behavior |
| --- | --- |
| `derived.weapon_count` | Number of received weapon entries; explicit empty list gives 0, missing list is unavailable |
| `derived.weapons_ready` | Count with `ready_to_fire=true`; an omitted proto3 flag in a present entry is false; malformed flags make the result unavailable |
| `derived.weapon_ready_fraction` | Ready count / total entries, 0–1; empty or missing list is unavailable |
| `derived.decoys_remaining` | Sum of explicitly typed decoy entries; missing type is unavailable |
| `derived.noise_remaining` | Sum of explicitly typed noise entries; missing type is unavailable |

A present typed countermeasure entry's omitted proto3 amount means zero. This default never creates a missing subsystem or countermeasure type. No maximum stock/capacity percentage is inferred.

These are **StarPanel-computed outputs**, not five new CIG fields. Find them in **I/O Reference → StarPanel computed readouts**, inspect the source and expected-value rules, then add an ESP32 readout or use a numeric LED rule. Existing packets/freshness guards are reused; no extra game subscription is created. Raw Diagnostics frames remain unchanged. The Arduino map still has four assigned readouts; computed fields do not gain invented RS485 addresses. Send the updated ESP32 interface normally; host-side computation alone needs no firmware upload.

## Configurable local API port

Some projects configure **50051**, while our observed default is **2942**. In **Diagnostics → Local game API endpoint**, select the port where the game actually listens and save/reconnect. CLI: `--api-port 50051`. Address stays `127.0.0.1`; ESP32 Wi-Fi still uses the bridge's paired port 2943.

This changes only the client endpoint. It does not edit `user.cfg`, enable external binding, change stream timing or restore a missing service. Community recipes vary, including dotted/hyphenated setting spellings; they were not applied to the user's game. Use [activation and verification](TELEMETRY-SETUP.md), and verify fresh frames rather than relying on loaded definitions/TCP availability.

## Reproduce comparisons

Clone a source into ignored `validation/`, check out its pinned revision, then list every required `.proto` explicitly. Our tool parses definitions; it does not execute the project, resolve network imports or connect to the game:

```powershell
node scripts/compare-proto.mjs schema/local.desc validation/api-research/SpartanWolf723/sc_telemetry_v1.proto
node scripts/compare-proto.mjs schema/local.desc validation/api-research/zoomphoto/sc_protos/sc/game/telemetry/v1/types.proto validation/api-research/zoomphoto/sc_protos/sc/game/telemetry/v1/api.proto
```

No reviewed source established pitch/roll/world-position beyond our current schema. Force-feedback axes must not be relabeled as ship attitude. All game input remains [API-only](API-ONLY.md), allowlisted and subject to game response/context.
