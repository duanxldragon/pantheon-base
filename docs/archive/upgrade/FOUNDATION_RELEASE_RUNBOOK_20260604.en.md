---
title: Foundation Release Runbook (2026-06-04)
doc_type: Design
layer: platform
status: Archived
index_group: archive/upgrade
retention_reason: Retained as the first operational SOP for foundation release metadata, bundle generation, and downstream consumer upgrade
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-04
---

# Foundation Release Runbook (2026-06-04)

Chinese version: [FOUNDATION_RELEASE_RUNBOOK_20260604.md](./FOUNDATION_RELEASE_RUNBOOK_20260604.md)

This runbook defines how `pantheon-base` cuts a consumer-facing foundation release and how `pantheon-ops` should consume it.

## 1. Release Outputs

Each foundation release produces:

1. `releases/<version>/`
2. `dist/foundation-releases/<version>/`

The first path is the long-term review and audit surface. The second path is the machine-consumable bundle surface. `dist/foundation-releases/` is a regenerable local bundle output and should not be treated as a long-term checked-in asset by default.

Important: `dist/foundation-releases/<version>/bundle` must contain only shared foundation code and documentation. Do not let runtime artifacts such as `uploads/`, local caches, or temporary generated files leak into the bundle; the build should honor the exclusion rules declared in the release manifest.

## 2. Cut a Release in `pantheon-base`

Minimal command:

```powershell
node scripts/foundation-release/cut-foundation-release.mjs `
  --release-version base-v0.8.0 `
  --release-line release/0.8 `
  --base-commit <40-char-commit> `
  --release-notes "shared foundation release" `
  --upgrade-notes "rerun inheritance checks in ops" `
  --consumer-impact "ops should review backend drift"
```

Or via package script:

```powershell
npm run release:foundation:cut -- `
  --release-version base-v0.8.0 `
  --release-line release/0.8 `
  --base-commit <40-char-commit> `
  --release-notes "shared foundation release" `
  --upgrade-notes "rerun inheritance checks in ops" `
  --consumer-impact "ops should review backend drift"
```

## 3. Consume the Release in `pantheon-ops`

Plan mode:

```powershell
node scripts/foundation-release/consume-foundation-release.mjs `
  --manifest <bundle-root>\manifest.json `
  --bundle <bundle-root> `
  --check
```

Apply mode:

```powershell
node scripts/foundation-release/consume-foundation-release.mjs `
  --manifest <bundle-root>\manifest.json `
  --bundle <bundle-root> `
  --apply-shared-backend `
  --update-inheritance-docs `
  --check
```

## 4. Post-Upgrade Checks

At minimum the consumer should verify:

1. the release line and base version in `docs/PROJECT_INHERITANCE.md`
2. `npm run check:inheritance`
3. `npm run check:base-sync:backend`
4. that only real business-overlay breakpoints were repaired
