# Use an AI assistant to build a panel

The repository includes a reusable [StarPanel Bridge skill](../skills/starpanel-bridge/SKILL.md). It guides an assistant through supported boards, wiring, visual rules, telemetry paths, maintained switches, custom firmware and meaningful validation. It does not grant permission to flash unidentified hardware or publish private configuration.

The current checkout also includes [synthetic protocol fixtures and offline replay](DATA-REUSE.md), plus [clean source-build instructions](REPRODUCING.md). Ask your assistant to retain provenance labels and validate any shared design or derived data.

## Install in Codex

Download the skill ZIP from [Releases](https://github.com/RogueTech1/starpanel-bridge/releases/latest), or copy `skills/starpanel-bridge` from a clone into your Codex skill directory (normally `~/.codex/skills/starpanel-bridge`). Keep `SKILL.md` directly inside that folder. Restart/refresh your assistant's skill discovery if necessary. Open the project checkout when working on source so the assistant can read the exact current implementation.

For assistants with another skill format, provide `SKILL.md` as project instructions along with the relevant documentation. The instructions are plain Markdown; assistant-specific installation/discovery differs by product. If no checkout is available, the skill links to the public repo's source and guides.

## Example requests

- “Use $starpanel-bridge to make a C3 Super Mini design for seven WS2812 pixels on GPIO 3: red pulse with gear deployed, yellow while moving, green retracted. Export an importable design.”
- “Use $starpanel-bridge to wire an SSD1306 and four buttons to an Arduino Mega standalone USB panel. Use my existing game bindings and reserve the I2C pins.”
- “Use $starpanel-bridge to configure a DCSBIOSKit master with two Mega slaves, addresses 1 and 2. Explain which USB port is the programmer and which is runtime.”
- “Use $starpanel-bridge to create a maintained power switch that follows its physical OFF position when I enter a powered ship. Show the feedback and retry behavior.”
- “Use $starpanel-bridge to add an independent LED-region renderer in custom firmware. Keep missing/stale telemetry handling and validate the exact board build.”

Give the exact board, flash size if known, connected pins, display/LED model, USB/Wi-Fi/bus preference and intended behavior. For a control, give the actual game binding and desired feedback state. Never paste router passwords or pairing keys into public issues or shared design files.

## Validate generated designs

```powershell
npm ci
node scripts/validate-design.mjs examples/supermini-gear.starpanel.json
```

Import a generated file into the app, review board/pins/bindings, then program the specific board you intend to replace. Software validation cannot establish that a wire is on the correct physical pin, that power is adequate, or that the game accepts a chosen binding. Ask the assistant to state its actual verification level.
