---
title: Close foundation smoke contract ownership
doc_type: Remediation
layer: inheritance-sync
status: Active
updated_at: 2026-08-12
linked_contracts:
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
---

# Task Packet: 2026-08-12-foundation-smoke-contract-closure

## Goal

Ensure foundation consumers receive the smoke entrypoints and coverage matrix together with Base-owned smoke specifications.

## Scope

### In

- Own `frontend/package.json` and `frontend/tests/smoke/README.md` in the release manifest.
- Fail producer tests if either smoke contract is omitted.
- Preserve consumer business-specific smoke overlays through structured merging.

### Out

- Ops business behavior or schemas.
- Mutating an existing release.

## Stop Conditions

- Stop publication if exact-commit Full Smoke or Release Gate fails.
- Stop Ops merge if its CMDB/Deploy smoke entrypoints are lost.

## Linkage

- Task ID: `2026-08-12-foundation-smoke-contract-closure`
- Task Manifest: `.harness/tasks/2026-08-12-foundation-smoke-contract-closure/manifest.json`
- Evidence Directory: `.harness/evidence/2026-08-12-foundation-smoke-contract-closure/`
- Review File: `.harness/evidence/2026-08-12-foundation-smoke-contract-closure/review.md`
