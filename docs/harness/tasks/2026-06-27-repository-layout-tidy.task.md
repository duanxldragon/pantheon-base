---
title: Repository Layout Tidy Task
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-06-27
---

# Task Packet: 2026-06-27-repository-layout-tidy

## Goal

Make the `pantheon-base` root directory easier to understand by documenting stable root ownership, local noise directories, and file placement rules without moving product runtime code.

## Primary Layer

platform

## Dependency Layers

- docs governance
- repository hygiene

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `repo-governance`
- Portable Failure Class: `layout-governance-gap`
- Owner Layer: `consumer-repository`
- Coverage Dimensions:
  - `maintainability`
  - `architecture-fitness`
  - `method-health`

## Scope

### In

- Add a root layout design document with Chinese and English entries.
- Update README and docs indexes so future contributors can place files consistently.
- Mark root `dist/` as generated output in `.gitignore`.
- Preserve current harness, config, database, release, schema, backend, and frontend paths.

### Out

- Moving backend, frontend, harness, database, release, schema, or CI paths.
- Deleting local `.tmp/`, `node_modules/`, `uploads/`, or other ignored runtime artifacts.
- Refactoring runtime application code.

## Contract Anchors

- `README.md`
- `docs/README.md`
- `docs/designs/README.md`
- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md`
- `.gitignore`

## Structural Scope

- Affected Subgraph: `repo root docs -> docs/designs index -> harness adoption evidence`
- Boundary Crossings: `docs governance -> repository hygiene`
- Risk Nodes: `hard-coded root paths`, `harness task linkage`, `local generated artifacts`
- Graph Focus: `hub`, `call-depth`

## Expected Files

### Create

- `docs/designs/REPOSITORY_LAYOUT.md`
- `docs/designs/REPOSITORY_LAYOUT.en.md`
- `docs/harness/tasks/2026-06-27-repository-layout-tidy.task.md`
- `.harness/tasks/2026-06-27-repository-layout-tidy/manifest.json`
- `.harness/evidence/2026-06-27-repository-layout-tidy/commands.json`
- `.harness/evidence/2026-06-27-repository-layout-tidy/summary.md`
- `.harness/evidence/2026-06-27-repository-layout-tidy/review.md`

### Modify

- `.gitignore`
- `README.md`
- `README.en.md`
- `docs/README.md`
- `docs/README.en.md`
- `docs/designs/README.md`
- `docs/designs/README.en.md`

### Do Not Touch

- `backend/**`
- `frontend/**`
- `database/system_init.sql`
- `config/method.config.json`
- `.harness/evidence/*` outside this task evidence directory
- local ignored artifact directories such as `.tmp/`, `node_modules/`, and `uploads/`

## Implementation Notes

- This is a documentation and repository hygiene change, not a runtime restructure.
- Existing stable root paths stay in place because they are referenced by scripts, CI, Docker, or historical docs.
- Local noise directories are documented as ignored/generated rather than deleted.

## Verification Plan

- `npm run check:docs-frontmatter`
- `npm run check:harness-docs`
- `npm run check:harness-inventory`
- `npm run check:harness-method`
- `npm run check:harness-sync`
- `npm run check:harness-adoption`
- `node scripts/harness/check-task-packet.mjs --root . docs/harness/tasks/2026-06-27-repository-layout-tidy.task.md`
- `node scripts/harness/check-evidence.mjs --root . --strict .harness/evidence/2026-06-27-repository-layout-tidy/commands.json`
- `node scripts/harness/check-review.mjs --root . --strict .harness/evidence/2026-06-27-repository-layout-tidy/review.md`
- `git diff --check`

## Linkage

- Task ID: `2026-06-27-repository-layout-tidy`
- Task Manifest: `.harness/tasks/2026-06-27-repository-layout-tidy/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-27-repository-layout-tidy/`
- Review File: `.harness/evidence/2026-06-27-repository-layout-tidy/review.md`

## Evidence Required

- Frontmatter, docs links, docs inventory, method health, sync drift, adoption, task packet, evidence, review, and whitespace check outputs.

## Human Gates

- No additional human gate required because this pass does not delete files or move runtime paths.

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
