# Contributing

Read [development setup](docs/DEVELOPMENT.md), run `npm ci` and `npm test`, and include a clear reproduction or hardware profile for changes. Keep app code, profile validation, firmware and documentation consistent.

Board contributions need an exact model/chip/flash size, conservative GPIO list, reproducible PlatformIO target, uploader rejection tests, wiring diagram or table and a stated validation level. Say whether a target merely compiled or was flashed and physically checked. Do not list a chip-compatible clone as tested solely because its name looks similar.

Logic changes should preserve stale/missing-data behavior and command deduplication. Maintained switches must not repeatedly toggle an unconfirmed state. New display drivers should subscribe only to required fields and preserve null/false/zero distinctions.

Do not commit credentials, game executables, raw captures with player data, local absolute paths, generated dependency caches or user app settings. Respect third-party licenses and update notices when adding a bundled dependency. Small focused pull requests with meaningful validation are easiest to review.
