# I/O Reference: StarPanel's integrated lookup tool

Open **I/O Reference** in StarPanel Bridge. It combines the former Field catalog and Mappings lookup views into one browser, inspired by [BORT](https://github.com/charliefoxtwo/Bort) and DCS-BIOS's reference workflow. This is an original StarPanel implementation; it does not bundle BORT or use DCS aircraft addresses for Star Citizen.

## Find an input or output

- Search a field/action name, category, mapped alias, enum name or address such as `0x5010`.
- **Direction** separates inputs sent toward the game from outputs read for displays and indicators.
- **Definitions** narrows to the current schema, LIVE 4.10.3 output definitions, PTU-only output definitions, or the four RS485 readouts.
- **Category** groups character, flight, power, quantum, weapons and other systems.
- **Show** narrows to received/advertised entries or entries mapped in the current host configuration.

Select a result for its type, presence semantics, enum names/numbers, mapped aliases, current reading and hardware support. Inputs show current advertisement separately from historical reference metadata. Configured keyboard bindings also appear, separately labeled.

The browser includes 174 output definitions and 112 historical API action references, plus configured keyboard bindings. Fifty outputs are PTU additions beyond the LIVE catalog. A PTU definition is not evidence of a working listener, a received value or an executable input. See [activation steps](TELEMETRY-SETUP.md) and [research evidence](SC-TELEMETRY-DECK.md).

## Use a result in a panel

1. Open or create your intended design in **Panel designer**, choosing the board first.
2. Find a supported output or currently advertised action in **I/O Reference**.
3. Click **Add to designer**. It adds one unsaved readout/button to the current design and opens the designer.
4. Review the label, GPIO, board and selected field/action. Save, then program using the normal board workflow.

This operation never sends a game action or flashes a board. PTU-only outputs outside the active schema, repeated message arrays and reference-only actions cannot be inserted. Arduino designs reject outputs without an assigned bus address. Existing component limits and available GPIOs still apply. For maintained switches, configure feedback and ON/OFF behavior in the designer after looking up the appropriate controls.

## Copy definitions and examples

**Copy field path/action** copies just the identifier. Expand an example to copy a host mapping fragment or a component fragment. These are partial JSON objects, not a complete saved panel: identity/GPIO still need configuring. Prefer **Add to designer** for a complete editable component.

The four Arduino readouts also offer an exact `DcsBios::StringBuffer` listener at their private StarPanel address. Custom sketches must still include the library, setup/loop, display rendering and fresh heartbeat/status handling. The [master/slave guide](DCSBIOSKIT.md) defines that contract. An unassigned field deliberately has no invented Arduino address or listener.

Clipboard examples contain definitions only; current player values are not included. **Advanced mapping JSON** remains available at the bottom of this tab for experienced users. Saving it replaces the host mapping configuration, so review it before saving.

## Freshness and performance

Lookups refresh at most once per second while this tab is visible, using the app's existing snapshots. They stop updating when another tab is open or the app is minimized. No additional game subscription or board traffic is created. Hardware updates continue through the existing bridge loop.

Zero and false are valid readings. Absent fields, stale frames and float-max sentinel readings are labeled unavailable. Simulator data/actions are labeled separately. A displayed action name is not proof the game accepts it in the current context; lookup and copy actions never execute it. The separate **Enable controls** guard remains in force for actual controls.
