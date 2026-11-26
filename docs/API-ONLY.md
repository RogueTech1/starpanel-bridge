# API-only game interaction

StarPanel 0.9.0 and later read game outputs through `TelemetryStream` and send game inputs only through `TriggerGameAction`, using the current `ListTriggerableActions` response. There is no OS key-press emulation, keyboard helper, focus requirement or key-binding fallback. Physical board commands still use the existing USB/RS485/IP protocols, then the host resolves their aliases to API actions.

**LIVE 4.10.3 is readout-only.** Its schema has no action RPCs. A future/compatible game build must start its service, expose the action methods and advertise the selected action before inputs can work. A historical PTU action list does not enable input support. See [activation and verification](TELEMETRY-SETUP.md).

## Configure inputs

Use the current advertised actions in **I/O Reference** or the designer's API-action suggestions. For maintained switches, choose an ON action and a separate OFF action when available, plus fresh telemetry feedback. For example, use `v_power_set_on` / `v_power_set_off` or `v_deploy_landing_system` / `v_retract_landing_system` only on builds that advertise and accept them. A confirmed toggle can use the same action in both directions. Existing stabilization, stale-data, conflict, rate and uncertainty guards remain in force.

## Upgrade existing mappings

Legacy `key_` mappings are disabled in memory at startup; the app reports the number disabled. Readouts remain usable and original saved configuration/design files are not automatically rewritten. There is no guessed conversion from a key to an API action, because custom game bindings may differ.

Open each affected saved panel, replace the old action with an advertised API action, set its OFF action if maintained, and save/program the interface normally. Imported designs and advanced mapping saves reject keyboard mappings. Existing board reports referencing disabled aliases cannot trigger game input. Before a compatible action-capable game build is available, keep the readouts/LEDs and leave inputs disabled.

The installer no longer contains the old helper. No board firmware update is required solely to remove host-side emulation; API mapping changes still need the normal interface/EEPROM programming workflow. Simulator remains explicitly simulated and never sends game commands.
