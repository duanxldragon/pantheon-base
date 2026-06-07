---
title: Main Sonar Batch 1 I18n Resource Dedup Task Packet
doc_type: Acceptance
layer: system/config
depends_on_layers:
  - platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-06-03
---

# Task Packet: 2026-06-03-main-sonar-batch-1-i18n-resource-dedup

## Goal

Collapse the duplicated locale resource mass in `frontend/src/i18n/resources/**` without shrinking Sonar scope, so merged-main duplication drops through real source-of-truth consolidation instead of exclusions.

## Primary Layer

system/config

## Dependency Layers

- `platform`

## Harness Profile

- Template: `admin-platform`
- Overlay: `main-branch-quality-remediation`
- Coverage Dimensions:
  - `maintainability`
  - `architecture-fitness`
  - `method-health`

## Contract Anchors

- `docs/contracts/PLATFORM_CONTRACT.md`
- `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- `docs/designs/I18N_MODULE_DESIGN.md`
- `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- `docs/acceptances/CODE_REVIEW_STANDARD.md`
- `docs/acceptances/AGENT_EXECUTION_CHECKLIST.md`

## Scope

### In

- reduce duplication in `frontend/src/i18n/resources/*.ts`
- reduce duplication in `frontend/src/i18n/resources/overrides/*.ts`
- tighten the generated-resource boundary so fallback, generated, and override layers have one clear ownership model
- update repo-local i18n audit scripts if the source-of-truth layout changes

### Out

- excluding locale resources from Sonar
- deleting locale coverage signals just because each file only reports `1` coverable line
- changing backend i18n storage or service behavior in this packet

## Expected Files

### Modify

- `frontend/src/i18n/resources/en-US.ts`
- `frontend/src/i18n/resources/fr-FR.ts`
- `frontend/src/i18n/resources/ja-JP.ts`
- `frontend/src/i18n/resources/ko-KR.ts`
- `frontend/src/i18n/resources/zh-CN.ts`
- `frontend/src/i18n/resources/overrides/fr-FR.ts`
- `frontend/src/i18n/resources/overrides/ja-JP.ts`
- `frontend/src/i18n/resources/overrides/ko-KR.ts`
- `frontend/scripts/audit-i18n-locales.mjs`
- `frontend/scripts/check-i18n-generated-scope.mjs`
- `frontend/scripts/report-system-i18n-audit.mjs`
- `docs/designs/I18N_MODULE_DESIGN.md`

### Do Not Touch

- `backend/modules/system/i18n/**`
- `sonar-project.properties`
- `.github/workflows/sonar.yml`

### Create

- `docs/harness/tasks/2026-06-03-main-sonar-batch-1-i18n-resource-dedup.task.md`
- `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/summary.md`
- `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/commands.json`
- `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/review.md`

## Implementation Notes

- Fresh Sonar duplication leaders are the five locale resource files: `2356`, `2294`, `2263`, `2160`, `1839` duplicated lines.
- Treat this as an ownership-model fix: generated base phrases, runtime fixes, and locale overrides must stop mirroring each other as full dictionaries.
- Any refactor must leave locale resolution readable for the frontend runtime and compatible with existing i18n audit scripts.

## Stop Points

- stop before excluding locale files from duplication analysis
- stop before moving locale ownership into backend APIs
- stop before changing smoke coverage or route behavior unrelated to i18n

## Structural Scope

- Affected Subgraph: `locale resources -> locale-utils loader -> i18n audit scripts`
- Boundary Crossings: `system/config -> platform`
- Risk Nodes: `locale ownership split | generated-scope checker | runtime resource loader`
- Graph Focus: `hub-check | cycle-check | call-depth`

## Verification Plan

### Frontend / Scripts

- `cd frontend && npm run build`
- `node frontend/scripts/audit-i18n-locales.mjs`
- `node frontend/scripts/check-i18n-generated-scope.mjs`
- `node frontend/scripts/report-system-i18n-audit.mjs`

### Repository Gates

- `npm run check:duplication -- --json`
- `npm run run:sonar-remediation -- --task 2026-06-03-main-sonar-remediation --group baseline --execute`

## Linkage

- Task ID: `2026-06-03-main-sonar-batch-1-i18n-resource-dedup`
- OpenSpec Change: `none`
- Superpowers Plan: `docs/superpowers/plans/2026-06-03-main-sonar-priority-batches.md`
- Evidence Directory: `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/`
- Review File: `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/review.md`
- Parent Task: `docs/harness/tasks/2026-06-03-main-sonar-remediation.task.md`

## Evidence Required

- before/after duplication summary for `frontend/src/i18n/resources/**`
- script outputs proving generated-scope and locale audit still pass
- review notes explaining the new locale ownership split

## Human Gates

- approve before excluding locale resources from Sonar or duplication analysis
- approve before changing locale ownership across frontend/backend boundaries
- approve before deleting existing locale resource files without a replacement ownership model

## Completion Checklist

- [ ] Layer and boundary declared
- [ ] Contract anchors read
- [ ] Tests or checks updated
- [ ] Verification run or exception recorded
- [ ] Evidence saved or summarized
- [ ] Docs updated if contracts changed
- [ ] Review completed
