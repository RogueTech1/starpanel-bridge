# Security and privacy

StarPanel Bridge runs locally. It has no project cloud account, telemetry upload, advertising or auto-update service. User-selected help links open in the system browser. The game service is contacted on loopback port 2942. The optional panel server listens on TCP 2943 and requires a random per-install pairing key before accepting a client subscription.

Use the panel server on a trusted private LAN. The current TCP protocol is authenticated by a shared key but **not TLS encrypted**. Do not port-forward it or use it over an untrusted network. Wi-Fi credentials and pairing keys are stored on the board in ordinary NVS and in local app settings where applicable; firmware does not provide secure-element storage or flash encryption. Exported designs omit these secrets.

First-start Wi-Fi setup uses a device-named AP with password `StarPanel123`, an HTTP form and a ten-minute setup window. It is a provisioning convenience, not an internet administration interface. The form accepts credentials via POST and does not display saved secrets. Reopen setup from the USB-connected app when necessary. Prefer USB provisioning where you want to avoid the setup AP.

Live input is disabled at startup. Keyboard commands require the foreground process name `StarCitizen`, use a bounded chord, and release keys. Commands are not automatically retried after uncertain outcomes. Maintained-switch reconciliation also needs fresh feedback and a recent physical report. The legacy DCS-BIOS serial format lacks the JSON protocol's session/duplicate protections; connect only trusted hardware.

Do not post app-data folders, raw configure packets, pairing keys, router passwords or unredacted gameplay logs in issues. Report a sensitive issue privately to the maintainer through the GitHub profile contact options rather than publishing an exploit or secret in a public issue. This repository does not currently advertise a dedicated security inbox or a guaranteed response SLA.
