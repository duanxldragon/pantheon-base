---
title: Pantheon Harness Upstream Linkage Task
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-27
---

# Task Packet: 2026-06-27-pantheon-harness-upstream-linkage

## Goal

Make `pantheon-base` consume the latest `pantheon-harness` method source in workspace mode, with local and CI gates that verify the linkage.

## Primary Layer

platform

## Dependency Layers

- none

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `repo-governance`
- Portable Failure Class: `method-health-gap`
- Owner Layer: `consumer-repository`
- Coverage Dimensions:
  - `method-health`
  - `maintainability`
  - `architecture-fitness`

## Scope

### In

- Resolve the upstream method source from `../pantheon-harness`, `PANTHEON_HARNESS_ROOT`, or `config/method.config.json`.
- Update method health, template health, adoption, docs inventory, docs links, and sync drift checks for the new `pantheon-harness/patterns` layout.
- Update `pantheon-base` entry docs so future agents read `pantheon-harness` before local repository overlays.
- Add CI docs-governance steps that checkout `pantheon-harness` and run the linkage gates.
- Repair docs-governance frontmatter blockers surfaced while validating the updated workflow.

### Out

- Rewriting historical audit notes that intentionally describe older `agentic-*` bootstrap history.
- Refactoring business, backend, or frontend runtime code.
- Forcing all base-adapted harness scripts to become byte-identical upstream mirrors.

## Contract Anchors

- `AGENTS.md`
- `docs/README.md`
- `docs/harness/HARNESS_METHOD_PLAYBOOK.md`
- `scripts/harness/README.md`
- `../pantheon-harness/patterns/README.md`
- `../pantheon-harness/patterns/METHOD_VERSION.json`

## Structural Scope

- Affected Subgraph: `pantheon-base docs and harness checks -> upstream pantheon-harness patterns -> CI docs-governance`
- Boundary Crossings: `pantheon-base -> pantheon-harness`
- Risk Nodes: `relative upstream path resolution`, `CI checkout path`, `base-adapted checker drift`
- Graph Focus: `hub`, `call-depth`

## Expected Files

### Create

- `config/method.config.json`
- `scripts/harness/upstream-root.mjs`
- `scripts/harness/README.zh.md`
- `docs/harness/ERROR_RECOVERY_STRATEGY.en.md`
- `docs/harness/HANDOFF_PROTOCOL.en.md`
- `docs/harness/tasks/2026-06-27-pantheon-harness-upstream-linkage.task.md`
- `.harness/tasks/2026-06-27-pantheon-harness-upstream-linkage/manifest.json`
- `.harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/commands.json`
- `.harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/summary.md`
- `.harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/review.md`

### Modify

- `AGENTS.md`
- `AGENTS.en.md`
- `SHELL_VERSION.json`
- `.agents/README.md`
- `.agents/README.zh.md`
- `.github/workflows/quality.yml`
- `package.json`
- `docs/README.md`
- `docs/acceptances/TASK_PACKET_BASE_TEMPLATE.md`
- `docs/acceptances/TASK_PACKET_BASE_TEMPLATE.en.md`
- `docs/designs/GLOBAL_EXCEPTION_HANDLING.md`
- `docs/designs/GLOBAL_EXCEPTION_HANDLING.en.md`
- `docs/designs/MODULE_GENERATOR_EXTENSION.md`
- `docs/designs/MODULE_GENERATOR_EXTENSION.en.md`
- `docs/designs/NOTIFICATION_SERVICE_DESIGN.md`
- `docs/designs/NOTIFICATION_SERVICE_DESIGN.en.md`
- `docs/designs/WORKFLOW_ENGINE_SELECTION.md`
- `docs/designs/WORKFLOW_ENGINE_SELECTION.en.md`
- `docs/harness/ERROR_RECOVERY_STRATEGY.md`
- `docs/harness/HANDOFF_PROTOCOL.md`
- `docs/harness/HARNESS_METHOD_PLAYBOOK.md`
- `docs/harness/HARNESS_METHOD_PLAYBOOK.en.md`
- `docs/harness/PANTHEON_BASE_DELIVERY_WORKFLOW.md`
- `scripts/harness/check-adoption.mjs`
- `scripts/harness/check-doc-frontmatter.mjs`
- `scripts/harness/check-doc-inventory.mjs`
- `scripts/harness/check-doc-links.mjs`
- `scripts/harness/check-method-health.mjs`
- `scripts/harness/check-review.mjs`
- `scripts/harness/check-sync-drift.mjs`
- `scripts/harness/check-template-health.mjs`
- `scripts/harness/README.md`

### Do Not Touch

- `backend/**`
- `frontend/**`
- `../pantheon-ops/**`

## Implementation Notes

- `pantheon-base` resolves `pantheon-harness` from `--method-root`, `PANTHEON_HARNESS_ROOT`, `config/method.config.json`, or workspace sibling fallback.
- CI checks out `duanxldragon/pantheon-harness` into `pantheon-harness/` before running docs-governance linkage gates.
- Only byte-identical upstream mirrors remain under sync drift; base-adapted checker scripts keep local ownership.
- Frontmatter fixes are limited to metadata required by the existing docs-governance workflow.

## Method Readiness

- Consumer-Specific Controls: `workspace upstream resolver`, `CI harness checkout`, `docs inventory references`
- Required Sensors: `docs-frontmatter`, `method-health`, `adoption`, `template-health`, `doc-links`, `doc-inventory`, `sync-drift`, `task-packet`, `evidence`, `review`
- Required Evidence: `command results`, `review summary`
- Ratchet Decision: `gate-updated`
- Deferred Code Issues: `historical agentic-* bootstrap references remain where they describe past events`

## Delivery Governance

- Design Gate: `scope note`
- Development Gate: `checker update`
- QA Acceptance Gate: `harness linkage gates`
- GitHub Governance Gate: `docs-governance`

## Execution Roles

- Implementer Posture: `implementer`
- Reviewer Posture: `mechanical | governance`

## Verification Plan

- `node scripts/harness/check-method-health.mjs --root . --strict`
- `node scripts/harness/check-adoption.mjs --root . --strict`
- `node scripts/harness/check-template-health.mjs --root . --strict`
- `node scripts/harness/check-doc-links.mjs --root . --strict`
- `node scripts/harness/check-doc-inventory.mjs --root . --strict`
- `node scripts/harness/check-sync-drift.mjs --root . --strict`
- `npm run check:docs-frontmatter`
- `node scripts/harness/check-task-packet.mjs --root .`
- `node scripts/harness/check-evidence.mjs --root . --strict`
- `node scripts/harness/check-review.mjs --root . --strict`

## Evidence

- Evidence directory: `.harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/`
- Task manifest: `.harness/tasks/2026-06-27-pantheon-harness-upstream-linkage/manifest.json`
- Review: `.harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/review.md`

## Linkage

- Task ID: `2026-06-27-pantheon-harness-upstream-linkage`
- Task Manifest: `.harness/tasks/2026-06-27-pantheon-harness-upstream-linkage/manifest.json`
- OpenSpec Change: `none`
- Superpowers Plan: `none`
- Evidence Directory: `.harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/`
- Review File: `.harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/review.md`

## Evidence Required

- method health output
- adoption output
- template health output
- doc links output
- doc inventory output
- sync drift output
- docs frontmatter output
- task packet output
- evidence and review output

## Human Gates

- None. This is a repository-governance linkage change and does not modify runtime behavior.

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Upstream method root resolves to `pantheon-harness` 1.3.0
- [ ] Entry docs point to `pantheon-harness/patterns`
- [ ] CI docs-governance can checkout `pantheon-harness`
- [ ] Verification run or exception recorded
- [ ] Harness linkage gates pass
- [ ] Docs frontmatter gate passes
- [ ] Evidence saved or summarized
- [ ] Review completed
