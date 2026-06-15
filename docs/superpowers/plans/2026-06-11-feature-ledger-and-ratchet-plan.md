# Pantheon Base Feature Ledger and Ratchet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the borrowed "platform-first / capability-driven / AI-native" ideas from `desgin-20260611.md` into a repo-native feature ledger and ratchet that track generated capabilities, expose drift, and make module evolution machine-checkable.

**Architecture:** Use the existing `system_module_registration` table, `schema/generated/**.json`, and dynamic-module sync path as the source of truth. Add a small feature-ledger projection in `backend/modules/system/dynamicmodule` that derives ownership, bounded context, source, and a derived maturity label from registration records and generated schema metadata, then emit a deterministic ledger snapshot alongside the generated registries. Gate that snapshot with a new harness checker and keep the first version additive and read-only so we do not introduce a second registry or a schema migration unless the existing metadata proves insufficient.

**Tech Stack:** Go, Node.js, JSON artifacts, existing harness scripts, Go unit tests.

---

## Requirements Summary

- Convert the borrowed ideas from the blueprinted document into repo-native mechanics.
- Keep `platform / system/auth / system/iam / system/org / system/config / business/*` as the canonical language; do not reintroduce `Core / Platform / Business / Generated` naming in code.
- Use the existing dynamic-module sync and generated registry code paths instead of building a parallel ledger service.
- Add deterministic evidence and a ratchet for capability drift.

## Borrowed Ideas Carried Into the Plan

- Platform first: capability work belongs in the base, not in business modules.
- Capability-driven: ledger entries should describe owner, bounded context, source, and maturity.
- AI native: the ledger must be machine-readable and generated from existing source-of-truth records.
- Feature Ledger: every generated capability gets a canonical entry.
- Evolution loop: drift becomes a checker failure, then a repair or ratchet action.

## Acceptance Criteria

- A feature-ledger projection exists for generated modules and module registrations, with deterministic ordering and repeatable output.
- Missing required metadata such as owner, bounded context, or source mode fails validation or surfaces as explicit drift.
- `dynamic_module_sync` and the existing registry regeneration path emit or refresh the ledger snapshot when generated modules change.
- A new ledger checker runs in strict mode and fails when the snapshot and source-of-truth records diverge.
- Existing dynamic-module and scaffold tests pass, and the new ledger tests cover both happy path and drift path.
- No new registry table or migration is introduced in v1.

## Implementation Steps

### Task 1: Define the ledger shape and validation rules

**Files:**
- Create: `backend/modules/system/dynamicmodule/feature_ledger.go`
- Create: `backend/modules/system/dynamicmodule/feature_ledger_test.go`
- Modify: `backend/modules/system/dynamicmodule/dynamic_module_service.go`
- Modify: `backend/modules/system/dynamicmodule/dynamic_module_summary.go`
- Modify: `backend/modules/system/dynamicmodule/dynamic_module_sync.go`

- [ ] **Step 1: Write failing tests that describe the ledger projection**

Run:

```powershell
go test ./backend/modules/system/dynamicmodule -run FeatureLedger -count=1
```

Expected: the tests fail until the new ledger projection can build a deterministic entry list from one active module registration plus one generated schema file.

- [ ] **Step 2: Implement the projection helpers**

Add a small Go projection that:

```text
1. reads module registrations from the existing `system_module_registration` records
2. reads generated schema metadata from `schema/generated/**.json`
3. builds a deterministic `FeatureLedgerEntry` list with a derived maturity value
4. reports missing required fields instead of silently skipping them
```

Use the existing summary path to surface ledger counts or drift results rather than adding a separate service endpoint in v1.

- [ ] **Step 3: Re-run the focused Go tests**

Run:

```powershell
go test ./backend/modules/system/dynamicmodule ./backend/internal/scaffold ./backend/pkg/... -count=1
```

Expected: the new ledger tests pass and the existing scaffold and dynamic-module tests do not regress.

### Task 2: Emit a deterministic ledger snapshot from the existing sync path

**Files:**
- Modify: `backend/internal/scaffold/workspace.go`
- Modify: `backend/internal/scaffold/types.go`
- Modify: `backend/modules/system/dynamicmodule/dynamic_module_lifecycle.go`
- Modify: `backend/modules/system/dynamicmodule/dynamic_module_sync.go`
- Modify: `backend/modules/system/dynamicmodule/dynamic_module_service.go`

- [ ] **Step 1: Add a failing test that expects the snapshot to refresh with generated registries**

Extend the existing dynamic-module service tests so they assert the ledger snapshot is written or refreshed when generated modules change.

- [ ] **Step 2: Extend `WriteGeneratedRegistries` to also write the ledger snapshot**

Reuse the same ordered `GeneratedModuleRef` list and schema metadata to produce a single canonical ledger artifact.

Keep the output path stable and predictable, for example:

```text
schema/generated/feature-ledger.json
```

- [ ] **Step 3: Wire the sync and lifecycle calls**

Ensure registration, repair, and purge paths refresh the ledger snapshot after the generated registries are rewritten.

- [ ] **Step 4: Re-run the focused module lifecycle tests**

Run:

```powershell
go test ./backend/modules/system/dynamicmodule -count=1
```

Expected: registry rebuild and ledger refresh stay in lockstep.

### Task 3: Add a harness checker for ledger drift

**Files:**
- Create: `scripts/harness/check-feature-ledger.mjs`
- Modify: `scripts/harness/check-method-health.mjs`
- Modify: `scripts/harness/README.md`
- Create: `tests/scripts/check-feature-ledger.test.mjs`
- Optional: `package.json` if you want a convenience script for the new checker

- [ ] **Step 1: Write the checker test first**

Prove the checker fails when the ledger snapshot is missing required entries or is out of sync with `schema/generated`.

- [ ] **Step 2: Implement the checker**

The checker should:

```text
1. scan the ledger snapshot and module schema files, excluding the snapshot itself from the module list
2. verify required fields, sort order, and one-to-one correspondence with generated modules
3. emit strict-mode failure codes that CI can consume
```

- [ ] **Step 3: Register the checker in method health**

Add it to the health bundle so adoption and method-health reports include ledger drift.

- [ ] **Step 4: Re-run the JS test path**

Run:

```powershell
node --test tests/scripts/check-feature-ledger.test.mjs
node scripts/harness/check-feature-ledger.mjs --strict
```

Expected: the checker is deterministic and fails on drift.

### Task 4: Align governance docs to the new code path

**Files:**
- Modify: `docs/harness/AI_QUALITY_GOVERNANCE.md`
- Modify: `docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md`
- Modify: `DESIGN.md`
- Optional: `AGENTS.md` if the new ratchet changes local execution guidance

- [ ] **Step 1: Update the borrowed-concept mapping**

Document that `Feature Ledger` now means the generated-module / registration projection, not a second ad hoc registry.

Map the document's `Product / Architect / Builder / Auditor / Evolution` language to the repo's `Planner / Explorer / Executor / Reviewer / ratchet` vocabulary.

- [ ] **Step 2: Add the ratchet rule**

Specify what happens when ledger drift recurs: checker failure, repair, and, if repeated, governance update.

- [ ] **Step 3: Keep the docs aligned with the code**

The docs must name the ledger artifact, its source-of-truth records, and the strict-mode checker that protects it.

## Risks and Mitigations

- Risk: the ledger projection becomes a second source of truth.
  - Mitigation: derive it only from `system_module_registration` and generated schema files; do not hand-edit it.
- Risk: sync code gets more expensive or flaky.
  - Mitigation: keep output deterministic, avoid extra database writes in v1, and cover the new path with focused tests.
- Risk: the checker adds noise instead of useful drift detection.
  - Mitigation: gate only missing or inconsistent ledger data first; defer softer quality preferences to later ratchet rounds.

## Verification Steps

- `go test ./backend/modules/system/dynamicmodule ./backend/internal/scaffold ./backend/pkg/... -count=1`
- `go test ./backend/modules/system/dynamicmodule -count=1`
- `node --test tests/scripts/check-feature-ledger.test.mjs`
- `node scripts/harness/check-feature-ledger.mjs --strict`
- `node scripts/harness/check-method-health.mjs`
- Optional if docs changed: `node scripts/harness/check-doc-links.mjs` and `node scripts/harness/check-doc-frontmatter.mjs`
