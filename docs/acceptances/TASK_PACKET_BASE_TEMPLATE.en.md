---
title: Pantheon Base Task Packet Template
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-03
---

# Pantheon Base Task Packet Template

Chinese version: [TASK_PACKET_BASE_TEMPLATE.md](./TASK_PACKET_BASE_TEMPLATE.md)

This is the smallest reusable task-packet example for `pantheon-base`.

Use it for:

- `platform`
- `system/auth`
- `system/iam`
- `system/org`
- `system/config`
- `system/lowcode`

Copy and fill:

```text
Default location: docs/harness/tasks/YYYY-MM-DD-<task-name>.task.md
Default evidence: .harness/evidence/<task-id>/
Target repo: pantheon-base
Layer: platform / system/auth / system/iam / system/org / system/config / system/lowcode
Task mode: review / implement / ui / smoke / docs
Quality Profile: auth-security / permission-policy / i18n / ui-runtime / generator / ci-workflow / none
Portable Failure Class: instruction-gap / task-boundary-gap / architecture-drift / test-gap / static-sensor-gap / runtime-evidence-gap / security-boundary-gap / ci-signal-noise / method-health-gap / none
Consumer-Specific Controls:
- `pantheon-base` contract / checker / smoke path / none
Required Sensors:
- command or `none`
Required Evidence:
- command summary / screenshot / smoke result / runtime gap / review summary
Ratchet Decision: no-repeat-observed / guide-updated / sensor-added / gate-updated / template-updated / adapter-updated / registry-only
Read first:
- pantheon-base/AGENTS.md
- pantheon-base/DESIGN.md
- pantheon-base/docs/README.md
- matching contract / design / acceptance docs

Implementation scope:
- the explicit closure for this turn
- the explicit non-goals for this turn

Sync expectation:
- base-only
- if the shared behavior will affect pantheon-ops, record whether sync is deferred or included this turn

Verification:
- Backend: `go test ...` / `go test ./...`
- Frontend: `npm run build`
- Smoke: `node scripts/run-smoke-suite.mjs ...` or `none`
- UI work must attach rendered evidence or record why rendering was not produced
- Runtime evidence: `none` / focused logs / smoke path / metrics sample / trace / explicit runtime gap

Stop points:
- none
- or pause before schema / contract / file deletion / other high-risk work

Implementation and review:
- implementer posture:
- reviewer posture: architecture / security / UX-QA / mechanical
```

Additional rule:

- if the work touches shared pagination, upload, tables, i18n, or the shared admin shell, treat it as base-owned by default
- if the work touches login, permissions, i18n, UI runtime, generator, or CI workflow, choose the matching Quality Profile; pure docs or read-only diagnosis may use `none`
- if the same failure pattern has already appeared before, Ratchet Decision must not be `no-repeat-observed`
- if the turn changes downstream inheritance behavior, explicitly state whether a `base -> ops` sync is required
- if the task touches login, permissions, menu routing, import/export, generator, dynamic modules, async chains, or external integrations, add a runtime-sensitive evidence plan by default
- if the same failure pattern has already appeared before, state whether this turn only patches code or also promotes the issue into a rule, checker, or smoke path
