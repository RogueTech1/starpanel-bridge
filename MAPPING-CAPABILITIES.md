# Input and output mappings

**Inputs → Star Citizen** and **Outputs ← Star Citizen** are separate views in the app. Inputs show configured keyboard bindings, live advertised API actions and a clearly labeled historical reference. Outputs show the active descriptor's catalog, types, live values and mapped aliases.

See [Panel designer and logic](docs/DESIGNER.md) for keyboard bindings, maintained switches and LED rules. See [Advanced programming](docs/PROGRAMMING.md) for custom profiles, protocol events and the private DCS-BIOS address map. LIVE 4.10.3 outputs were read from the game; controls use selected keyboard bindings unless a supported game schema advertises an action API.

The LIVE descriptor has 124 catalog entries; the retained earlier test descriptor has 174. Definitions do not guarantee that every field is populated for every ship or context. Missing data remains unavailable. Booleans default to false only inside present non-optional protobuf parent messages. Raw FLT_MAX instrument sentinels are unavailable.
