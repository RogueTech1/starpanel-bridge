# Telemetry integration notes

The local LIVE service was observed on loopback TCP 2942 after starting the game with `GRPC_CLIENT_SERVER_ENABLED=true`. It registered `sc.game.telemetry.v1.GameTelemetryService`, and its `TelemetryStream` delivered real character and seated ship frames at roughly 16 Hz. The verified LIVE game file version was `4.10.201.48085` (LIVE 4.10.3).

The shipped default descriptor matches that LIVE interface. It has 124 catalog entries and no game-action RPC. StarPanel Bridge therefore uses foreground-guarded keyboard bindings for LIVE controls, with telemetry feedback for maintained-switch reconciliation. A separate retained action-capable descriptor supports mock transport/simulator tests; it does not grant action support in the running game.

Interoperability definitions were extracted by reading embedded descriptors from the installed executable on disk. No running process memory was inspected, no game executable was patched, and no game binary is distributed. See [development](docs/DEVELOPMENT.md) for schema investigation and provenance.

See [validation](docs/VALIDATION.md), [programming](docs/PROGRAMMING.md) and the app's raw diagnostics for the current contract. A matching listener and actual decoded fresh frames are stronger evidence than the mere existence of a descriptor. Future game builds require their own matched-schema and runtime checks.
