# Panel designer and logic

## Design, program, connect

A design has a board, name, component list and, for DCSBIOSKit slaves, a unique address. Components get stable host aliases when programmed, so changing a label does not change wiring. **Save design** stores it locally. **Export design** produces a `.starpanel.json` file suitable for sharing; **Import design** opens one for review. Check imported pins, bindings and slave addresses before uploading.

ESP32 workflow: upload firmware once, then **Send interface to board** after each design change. The board acknowledges saving to nonvolatile storage. Arduino workflow: **Upload saved Arduino design** writes the bundled firmware and an EEPROM configuration in one operation; repeat this after changing the design. Designs do not carry network passwords or pairing keys.

Readouts appear in component order, up to six OLED lines. Select a scalar field for a useful number/string. Complex messages/collections are available for custom clients but render as `[complex]` on the starter OLED. Values use raw game units. Character health/oxygen current/max are shown on desktop cards. Numeric FLT_MAX unavailable sentinels become `null`; stale instruments become unavailable after two seconds.

## Buttons

Add **Button**, choose a free GPIO, then choose **Keyboard binding** or **Advertised game API action**. Keyboard mode offers a key and Ctrl/Alt/Shift modifiers. Match these to your actual game bindings; the app does not assume your controls are the defaults. The board sends a discrete press on the active-low edge, with 35 ms debounce. It does not hold keys, repeat them, implement analog axes or synthesize arbitrary scripts.

The Windows helper checks the foreground process is `StarCitizen`, sends a 60 ms scan-code chord, then releases its keys. **Enable controls** gates live inputs and resets at app start. Simulator controls never call this helper. An acknowledged chord is not proof the game accepted the binding: confirm the effect in telemetry or visually. The app neither injects into game memory nor bypasses input restrictions.

API mode is available for schemas with an action service. Only the currently advertised allowlist may execute. A historical action reference remains in Mappings for discovery, clearly labeled; it is not an executable allowlist. Maintained switches using API mode currently use the same selected action for ON and OFF; distinct ON/OFF keyboard keys are available in the designer, and advanced profiles may supply distinct API actions.

## Maintained switches

Use **Add maintained switch** for physical ON/OFF switches. Closed to GND means ON. Configure:

1. A keyboard chord for the ON direction and an OFF key (same modifiers). Use the same key in both directions if the game's binding toggles.
2. A boolean or enumeration **Feedback field**.
3. The exact game values corresponding to ON and OFF.

Example power switch: feedback `vehicle.state.power.powerplants`, ON `true`, OFF `false`; match both keys to your ship's power-toggle binding. If the physical switch is OFF and the observed ship power is ON, the bridge requests OFF. Game state must be observable; an unpopulated field cannot synchronize safely.

Example gear switch: feedback `vehicle.state.flight.state.gear`, ON `VEHICLE_COMPONENT_DEPLOYMENT_STATE_DEPLOYED`, OFF `VEHICLE_COMPONENT_DEPLOYMENT_STATE_RETRACTED`, with the game's gear binding for both directions. The bridge waits through `DEPLOYING` and `RETRACTING` before deciding whether another change is needed.

The control algorithm:

- Records switch positions reported by the board; ESP32 repeats them about every three seconds, Arduino cycles maintained inputs about every 300 ms.
- Requires a report within ten seconds, fresh game telemetry, and an enabled control path.
- Requires the chosen subsystem/vehicle message and configured ON/OFF value to be present. Non-optional protobuf booleans may default to false only inside a present parent message; absent subsystems stay unavailable.
- Waits 250 ms for a stable mismatch. Moving-gear and unspecified values do not trigger a toggle.
- Rejects simultaneous physical switches that disagree about the same feedback field.
- Sends at most one command per observed mismatch, with a one-second synchronization cooldown. Then waits for the desired state; it does not continuously resend a toggle.

If the game rejects a key, focus is wrong, or the outcome is unknown, inspect **Maintained switches** and **Diagnostics**. Correct the binding/focus and move the switch through a deliberate new position to start a new attempt. Repeated commands after an uncertain result are intentionally suppressed. Switching input authority while the game is busy can cause an immediate request once feedback becomes valid, so review physical positions before enabling controls.

## LED rules

**Add WS2812 rule** creates a landing-gear example. Select its GPIO and **LED count** (1–64 pixels in one chain). All pixels currently share the selected rule and animation phase; independent per-pixel instruments are a custom-firmware task. Changing the count in the app does not increase your power supply's capability.

Choose a telemetry field, then add up to four cases. Each case has:

| Setting | Options |
| --- | --- |
| Condition | Equals, does not equal, contains text, greater than, less than |
| Value | Literal boolean, enum/string, or numeric threshold |
| Effect | Solid, pulse, slow strobe |
| Color | RGB color picker |
| Brightness | 1–255, default 64 |
| Cycle | 200–10000 ms, default 2400 |

The **first matching case wins**. Earlier cases take priority. With no match, missing data, or stale telemetry the whole chain goes off. Pulse rises and falls across one cycle; strobe is on for half the cycle. Comparisons `greater`/`less` require actual numeric telemetry; equality compares literal values. `contains` is case-sensitive text matching.

The gear example has deployed → red pulse, text containing `ING` → yellow strobe (both motion states), retracted → solid green. Unknown states match nothing. Other examples: hydrogen fuel `< 0.15` → blinking amber, `shields.level > threshold` → blue, or a boolean warning `true` → red. Choose fields and thresholds from observed game values rather than assuming undocumented units.

## Multiple panels and capacity

Each design has unique aliases. The host supports 32 field aliases and 32 button aliases including defaults. Six readout lines and one LED source can be selected per ESP32, and eight physical inputs per board. Multiple sources can reuse a telemetry path under different panel aliases. Saved-design count is limited to 16. IP clients subscribe to at most 32 host aliases; eight clients can connect simultaneously.

Removing a component and reprogramming the same design replaces its aliases. **Advanced mapping JSON** is available for custom clients. Back up app data before editing it; host mappings are shared by active panels. Wi-Fi credentials are separate from design files. Advanced programmers should use the [protocol guide](PROGRAMMING.md).


## Live Data view

The **Live Data** tab lists the scalar fields currently present in decoded telemetry, including indexed collection entries. Filter by path to inspect a subsystem. It refreshes at 1 Hz while visible, with a 1000-row bound and cell updates instead of rebuilding unchanged rows. Missing/stale frames clear the current table. It is a live-inspection view, not the schema catalog of possible fields.

Minimizing/hiding the app or leaving the tab pauses table rendering. Hidden renderer polling is also paused. The host telemetry connection, 5 Hz panel forwarding, network clients and maintained-switch logic run independently in the main process and continue in the tray.
