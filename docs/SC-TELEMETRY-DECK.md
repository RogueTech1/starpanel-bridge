# SC Telemetry Deck research and I/O cross-reference

Reviewed **26 November 2026**, pinned to [Sokren/sc-telemetry-deck commit f6e8fe8](https://github.com/Sokren/sc-telemetry-deck/tree/f6e8fe8a71c2bd07724f5e2fe8b803da9d2a0d66). This is an independently written factual reference for StarPanel, not upstream code or a promise that schema entries produce live values. See [our saved activation steps](TELEMETRY-SETUP.md) for configuration.

## What the crawl covered

Inspected the README, observed game API documentation, schema/update notes, descriptor, action snapshot, ship function/state handling, display readers, web API contract and setup UI. No upstream programs were executed. No player capture, executable, UI artwork or implementation was copied into StarPanel. Upstream lists its license as **To be decided**; this reference links to the original sources instead of vendoring them.

Primary references at the reviewed revision:

- [README: setup, compatibility and limitations](https://github.com/Sokren/sc-telemetry-deck/blob/f6e8fe8a71c2bd07724f5e2fe8b803da9d2a0d66/README.md)
- [Observed game API and build status](https://github.com/Sokren/sc-telemetry-deck/blob/f6e8fe8a71c2bd07724f5e2fe8b803da9d2a0d66/docs/api/game-telemetry-api.md)
- [Descriptor extraction/update workflow](https://github.com/Sokren/sc-telemetry-deck/blob/f6e8fe8a71c2bd07724f5e2fe8b803da9d2a0d66/schema/README.md)
- [Action names and metadata](https://github.com/Sokren/sc-telemetry-deck/blob/f6e8fe8a71c2bd07724f5e2fe8b803da9d2a0d66/schema/actions.json)
- [Stateful ship action reference](https://github.com/Sokren/sc-telemetry-deck/blob/f6e8fe8a71c2bd07724f5e2fe8b803da9d2a0d66/src/ship/functions.ts)
- [Web API: a separate application API](https://github.com/Sokren/sc-telemetry-deck/blob/f6e8fe8a71c2bd07724f5e2fe8b803da9d2a0d66/docs/api/web-app-api.md)

## Comparison with StarPanel

| Reference | Catalog entries | Result |
| --- | ---: | --- |
| StarPanel LIVE descriptor | 124 | Production 4.10.3 readout baseline |
| Upstream reviewed descriptor | 174 | 50 added catalog paths, none removed, two presence changes compared with LIVE |
| StarPanel saved PTU descriptor | 174 | Same catalog entries/metadata as the reviewed descriptor |
| Historical PTU action snapshot | 112 | Same names and metadata as StarPanel's saved input reference |

There are no newly discovered action names to add from this snapshot. The two RPCs beyond LIVE are `ListTriggerableActions` and `TriggerGameAction`. Presence changed to explicit for `vehicle.state.flight.instruments.quantum_fuel` and `.altitude`. Catalog counts flatten non-repeated messages; repeated message collections occupy one entry, so these counts differ from upstream's count of newly declared protobuf fields.

The [machine-readable comparison](../data/research/sc-telemetry-deck-2026-11-26.json) includes all 50 added paths, types, enums, changed presence, RPC differences, descriptor hashes and provenance. It contains names/definitions, not gameplay values. Current StarPanel production builds keep using the LIVE descriptor. This documentation update does not silently enable PTU actions or change board firmware.

## Outputs: game to displays and indicators

Useful existing LIVE paths below are already cataloged; actual population depends on build, seat, ship and subsystem. A catalog entry is an available definition, not evidence it was received.

| Panel purpose | Field or family |
| --- | --- |
| Health, oxygen, hunger, thirst, body temperature | `actor.vitals.<gauge>.current` and `.max` |
| Heart rate, pressure, gravity, intoxication | `actor.vitals.heart_rate`, `.pressure`, `.gravity`, `.intoxication_level` |
| Outside conditions | `actor.environment.external_temperature`, `.ambient_radiation_rate`, `.breathable_atmosphere` |
| Seat/role and balance | `actor.state.locomotion`, `.crew_role`, `.seat_name`, `.uec_balance` |
| Gear, VTOL, transformation | `vehicle.state.flight.state.gear`, `.vtol`, `.transformation` |
| Flight instruments | `vehicle.state.flight.instruments.speed`, `.vertical_speed_indicator`, `.radar_altitude`, `.altitude`, `.heading` |
| Boost, fuel and G | `vehicle.state.flight.instruments.boost.*`, `.hydrogen_fuel`, `.quantum_fuel`, `.g_meter.*` |
| Lighting, doors and power | `vehicle.state.lights_enabled`, `.doors.*`, `.power.*` |
| Assists and warning lights | `vehicle.state.flight.settings.*`, `vehicle.state.annunciators.*` |
| Weapons / countermeasures | `weapons.weapons`, `weapons.countermeasures`, `weapons.preset_index`, `.preset_name`, `.settings.gimbals_locked` |
| Haptics / turret | `force_feedback.*`, `turret.light_amplification` |

`weapons.weapons` and `weapons.countermeasures` are repeated message arrays. Custom software must inspect each entry/type; an array index is not a stable device identity. Upstream derives weapon-ready counts by counting entries, and countermeasure percentages from the highest observed stock per model, not a game-provided capacity. Do not label such an estimate as a true maximum. Upstream notes absent hydrogen values on some ships and sentinel altitude values. StarPanel keeps unavailable readings distinct from valid zero/false and rejects the float-max sentinel.

### Additional PTU candidates already in our saved PTU schema

| Family | Potential panel use | Evidence boundary |
| --- | --- | --- |
| `header.sequence`, `.game_time_unix_ms` | Sequence/time diagnostics | Definition only in this comparison |
| `vehicle.state.shields.level`, `.faces`, `.health` | Shield faces and hull gauge | Requires receipt from matching build; do not assume 4.10.3 emits them |
| `vehicle.state.master_mode.*` | SCM/NAV and spool indicators | Definition does not supply an accepted mode command |
| `vehicle.state.quantum_travel.*` | State, spool/calibration, destination, ETA, distance | Upstream says the newer service was not starting; unverified here |
| `actor.state.operator_mode`, `.location.*` | Seat mode, location/jurisdiction, armistice indicator | Location collections need custom formatting |
| `actor.state.tracked_contract.*` | Contract title, objective progress, deadline | Private gameplay context; sanitize captures |
| `actor.state.crime_stat`, `.player_name` | Status/name display | Player identity must not enter public fixtures |
| `game.state`, `.menu_open`, `.game_mode` | Scene/menu status | Definition only |
| `game.debug.*` | FPS/timing, VRAM, network, server, shard diagnostics | Population/debug setting unverified; shard data may identify a session |

ESP32 readouts/LED rules can use supported scalar fields once the active schema and fresh stream supply them. Arduino/DCSBIOSKit readouts currently expose only speed, altitude, gear and oxygen in StarPanel's fixed RS485 map. Additional game fields do not automatically gain RS485 addresses: extend both host encoding and slave listeners as explained in [the master/slave guide](DCSBIOSKIT.md).

## Inputs: controls sent toward the game

Read `ListTriggerableActions` at runtime on a supported PTU build. Use that response as the advertised set; inspect the returned status after a call. The historical snapshot is a reference only. LIVE 4.10.3 has no game action RPCs; the existing keyboard path remains separate.

Examples from the historical PTU action reference:

| Function | Explicit actions or limitation |
| --- | --- |
| Gear | `v_deploy_landing_system` / `v_retract_landing_system` |
| Exterior lights | `v_lights_on` / `v_lights_off` |
| VTOL | `v_vtol_on` / `v_vtol_off` |
| Transformation | `v_transform_deploy` / `v_transform_retract` |
| Decoupling | `v_ifcs_vector_decoupling_on` / `v_ifcs_vector_decoupling_off` |
| G-safe / proximity assist | `v_ifcs_gsafe_on` / `_off`; `v_ifcs_proximity_assist_on` / `_off` |
| ESP | `v_ifcs_toggle_esp`; requires reliable feedback for position matching |
| Night vision | `v_light_amplification_on` / `v_light_amplification_off` |
| Master mode | `v_master_mode_set_nav` / `v_master_mode_set_scm` |
| Main power | `v_power_set_on` / `v_power_set_off` |
| Engine / weapon / shield power | `v_power_set_thrusters_on`, `v_power_set_weapons_on`, `v_power_set_shields_on`, with corresponding `_off` actions |
| Doors / locks | Names exist in snapshot, but upstream reports nine door/lock/port actions were refused in tested PTU contexts |
| Cruise / countermeasures / weapon groups / gimbals | Upstream reports no corresponding action RPC in this snapshot; readout availability does not establish writable controls |
| Character / emotes / flight-ready / ATC / ping / quantum | Browse the existing 112-entry input reference and runtime response; acceptance remains context-dependent |

For a physical maintained switch, prefer separate ON/OFF commands when advertised and working. Compare fresh feedback with the physical position; send only the required change and verify the result. A missing/unknown state must not become a repeated blind toggle. Deploying and retracting are distinct enum states, even when both display yellow in the gear lamp. The flashlight's state is not exposed in upstream's reference, so its toggle cannot reliably implement a maintained position switch.

## Reproduce the crawl without copying upstream implementation

Run from a developer checkout with Node dependencies installed. The upstream checkout remains under ignored `validation/` and is not included in releases:

```powershell
git clone https://github.com/Sokren/sc-telemetry-deck.git validation/sc-telemetry-deck
git -C validation/sc-telemetry-deck checkout f6e8fe8a71c2bd07724f5e2fe8b803da9d2a0d66
node scripts/compare-telemetry.mjs schema/live/sc_extrait.desc validation/sc-telemetry-deck/schema/sc_extrait.desc desktop/assets/input-reference.json validation/sc-telemetry-deck/schema/actions.json
node scripts/compare-telemetry.mjs schema/local.desc validation/sc-telemetry-deck/schema/sc_extrait.desc
```

The comparison tool reads definitions only and does not connect to the game or execute upstream code. It compares catalog metadata and service names/signatures, not full protobuf wire compatibility or every nested repeated-message definition. For future updates, extract a descriptor from your own matching game build, inspect tag/type/enum changes, and record actual listener/stream/action results separately. Upstream's extraction utilities are linked for reference; obtain permission/a suitable license before redistributing its implementation.

SC Telemetry Deck's HTTP port **8743**, REST routes, SSE events and bearer token belong to that application. They are not extra CIG RPCs or StarPanel endpoints. StarPanel does not require installing it, opening its LAN access or importing its tokens. Keep our [activation guide](TELEMETRY-SETUP.md), [advanced board protocol](PROGRAMMING.md) and [privacy audit](PRIVACY-AUDIT.md) together when sharing this research.
