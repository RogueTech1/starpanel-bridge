# Enable and verify game telemetry

This is StarPanel's own reproducible setup reference, checked against [SC Telemetry Deck's setup and API research](SC-TELEMETRY-DECK.md) on 26 November 2026. Commands below configure the game, not a board. Keep using the LIVE descriptor for LIVE; a newer PTU descriptor does not enable a disabled game service.

## LIVE 4.10.3 on Windows

1. Safely close Star Citizen and fully exit RSI Launcher, including its tray process.
2. Use **Enable telemetry startup setting** in StarPanel, or open PowerShell and run:

   ```powershell
   setx GRPC_CLIENT_SERVER_ENABLED true
   ```

3. Check the saved user setting:

   ```powershell
   [Environment]::GetEnvironmentVariable('GRPC_CLIENT_SERVER_ENABLED', 'User')
   ```

   Expected: `true`. `setx` saves future-process settings; it does not update an already running launcher or PowerShell. If starting the launcher from the same PowerShell session, also set `$env:GRPC_CLIENT_SERVER_ENABLED='true'` in that session before launching it. Otherwise start the launcher from a fresh Windows session/process that has inherited the new environment.
4. Start RSI Launcher and the game. Spawn your character; enter a pilot seat for vehicle data.
5. Select the game source in StarPanel and check **Live Data** and **Diagnostics**. Fresh character frames establish streaming; fresh vehicle fields establish ship data.

LIVE 4.10.3 exposes the read stream, without the PTU action RPCs. StarPanel's separate keyboard input path still requires **Enable controls**, the correct game bindings and game focus. A console command entered after launch cannot retroactively change the process startup environment.

## PTU 5.0: preserve these steps for supported builds

Close the game. Find the installation folder for the actual channel being played, for example `C:\Program Files\Roberts Space Industries\StarCitizen\PTU`. Back up an existing `user.cfg`, then edit it, preserving unrelated entries. If creating it in Notepad, use **All files** so it is not saved as `user.cfg.txt`.

```ini
server.game.telemetry.enabled=1
server.game.telemetry.trigger.actions.enabled=1
```

The first setting enables telemetry on builds that start the service. Upstream reports the second setting was introduced in build **13273298** to gate action triggering. Earlier working PTU builds accepted actions without that setting. Restart the game after saving; do not rely on silent console output to prove either setting worked.

**Known upstream regression:** builds **13273298 / 5.0.202.35026** and **13284307 / 5.0.202.46035** reportedly read the settings but do not start the local service. These instructions are not a demonstrated workaround. Upstream reports earlier builds 13238477, 13248297 and 13260598 worked. Recheck the installed build and [upstream status](https://github.com/Sokren/sc-telemetry-deck/blob/f6e8fe8a71c2bd07724f5e2fe8b803da9d2a0d66/docs/api/game-telemetry-api.md) after patches. StarPanel's current production profile remains LIVE 4.10.3.

## Prove each connection stage

In the channel's `Game.log`, look for the setting being read, registration of `sc.game.telemetry.v1.GameTelemetryService`, and the local listener at `127.0.0.1:2942`. After spawning, look for initialization of the local player's telemetry component. A player component initialization line alone does not prove the service registered.

From PowerShell:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 2942
Get-NetTCPConnection -LocalPort 2942 -State Listen -ErrorAction SilentlyContinue
```

A listener proves only TCP availability. To check decoded telemetry, use StarPanel's **Receiving** state or, with [grpcurl](https://github.com/fullstorydev/grpcurl) installed, run from this repository:

```powershell
grpcurl -plaintext -protoset schema/live/sc_extrait.desc -d '{}' 127.0.0.1:2942 sc.game.telemetry.v1.GameTelemetryService/TelemetryStream
```

Stop with Ctrl+C. The game does not provide reflection; a matching descriptor is required. On a compatible PTU build, use its freshly extracted descriptor instead. To discover PTU inputs without sending one:

```powershell
grpcurl -plaintext -protoset schema/local.desc -d '{}' 127.0.0.1:2942 sc.game.telemetry.v1.GameTelemetryService/ListTriggerableActions
```

On LIVE, an unimplemented action method is expected. A historical action list is not permission or proof that an action is accepted now. Even advertised actions may be context-inactive, filtered, rate-limited or refused. Check feedback after an input rather than repeatedly toggling it.

Connection refused means no accepting listener at that address. Recheck game build, startup inheritance and registration before changing firewall settings. Do not forward the game's loopback port to the internet. ESP32 Wi-Fi devices connect to StarPanel's separately paired port **2943**, not the game's port **2942**.

## Other PTU settings found upstream

Upstream identifies `server.game.telemetry.trigger.debounce.ms`, `server.game.telemetry.stream.interval.ms`, `server.game.telemetry.generate.without.clients`, `server.game.telemetry.test.data` and `server.game.telemetry.debug.displayinfo` in newer executables. Their behavior/defaults were not verified in that research. They are not required setup steps here; do not enable synthetic test data while validating real readouts or alter stream timing to fix a missing listener.

## Wine / Linux reference

StarPanel's installer and keyboard helper target Windows; these are game setup notes, not a Linux support claim. Upstream's Linux issue describes setting the same LIVE environment value in the game's Wine prefix:

```sh
export WINEPREFIX="/path/to/your/star-citizen/prefix"
wine reg add 'HKCU\Environment' /v GRPC_CLIENT_SERVER_ENABLED /t REG_SZ /d true /f
wine reg query 'HKCU\Environment' /v GRPC_CLIENT_SERVER_ENABLED
```

Close the game and other applications in that prefix, restart that prefix's Wine environment, then relaunch. PTU uses the channel's `user.cfg`; upstream labels Linux PTU setup untested. See [upstream issue #1](https://github.com/Sokren/sc-telemetry-deck/issues/1).

## Disable and protect local data

To remove the saved Windows user setting after closing the game/launcher:

```powershell
[Environment]::SetEnvironmentVariable('GRPC_CLIENT_SERVER_ENABLED', $null, 'User')
```

Remove the telemetry lines from your backed-up `user.cfg` if no longer wanted, then restart the relevant processes. Raw telemetry may contain a player name, balance, location, contract identifiers or shard identifiers. Keep logs/recordings private and use [sanitized data workflows](DATA-REUSE.md) before sharing. No credentials or captured player values are needed for these setup steps.
