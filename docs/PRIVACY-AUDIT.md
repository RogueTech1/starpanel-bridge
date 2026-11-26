# Public-content privacy audit

The maintained tree is limited to application/firmware source, required prebuilt images, build/deployment tools, tests, synthetic fixtures, useful guides and legally necessary notices. Local validation, private recordings, app data, credentials, dependency caches and compiled development tools are ignored.

## Scope and findings

- Git history was scanned with Gitleaks 8.30.1 using redacted reports. No project credentials were identified in the scanned history.
- The v0.5.0 source and dependency packages and unpacked installer/application archive were inspected. The source scan found no first-party credentials. The dependency source archive contained unused upstream Arduino WiFiClient examples with public ThingSpeak demo API keys. The installer included an upstream dependency README's public rating-badge token. These are not user credentials; they are unnecessary to runtime/build use and are excluded from cleaned packages.
- The public tree is checked for personal home paths, private-key/provider-token patterns, unexpected email addresses and private/generated paths. Intel HEX payloads are decoded for the path scan. Portable `/build/home` compiler paths are intentional placeholders.
- Upstream legal author/contact attribution is preserved. Public repository URLs, public GitHub noreply commit attribution, documented setup defaults, loopback/bind addresses and generic examples are not treated as private credentials.

No private user/account/game identity, home Wi-Fi password or per-install pairing token is needed in source. Runtime credentials are supplied locally and remain outside the repository; do not export or post app-data/configuration captures. The documented setup password is a shared provisioning default, not a router password.

## Cleanup applied

- Removed local COM-port/board-specific diagnostic scripts, unused prototype sketches/export code, duplicate historical writeups and session handoff notes.
- Replaced selected gameplay snapshots with synthetic fixtures; tests/replay/sanitization remain for recreating protocol behavior.
- Reduced generated license copies to shipped production dependencies and actual firmware libraries/cores, retaining uploader and legal notices.
- Excluded dependency README/changelog/test/example material from application packages and unused upstream examples/tests/docs from firmware source packages.
- Added reusable public-tree and history secret checks. Kept chip/flash/role/hash checks intact.

Historical commits/tags are retained where no first-party secret/PII was identified; removing a file from the maintained tree is not a claim that every historical copy disappears. Any retired download is identified in its release notes. A genuine exposed credential would additionally require revocation/rotation and, when necessary, coordinated history/cache removal.

## Run the checks

```powershell
npm ci
node scripts/audit-public.mjs
powershell -NoProfile -File scripts/scan-secrets.ps1
```

The first command scans Git-selected public files, including untracked/non-ignored additions, and reports categories/paths without printing sensitive values. It preserves license attribution and public npm deprecation metadata. The second downloads a pinned scanner from its official release, verifies its published checksum and scans Git history with redacted output. CI fetches full history for that check.

Neither check is a universal anonymity guarantee. Before publishing a release, unpack its installer/source archives, scan the contents, review screenshots and inspect first-party configuration boundaries. Keep detailed/raw audit reports under ignored `validation/`; publish a findings summary, not secret values. Use [Security](../SECURITY.md), [Reproduction](REPRODUCING.md) and [Validation](VALIDATION.md) for the rest of the release process.
