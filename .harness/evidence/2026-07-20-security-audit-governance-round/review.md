# Self-review — 2026-07-20 security-audit-governance-round

Reviewer posture: self-review against the behavior contract
(`tests/smoke/system/governance/cleanup-range-ui.spec.ts`) and the shell
visual/style constraints, since implementation was done directly by Claude
under the maintainer's one-time exemption.

## Contract cross-check (cleanup-range-ui.spec.ts)

| Contract point | Implementation | OK |
| --- | --- | --- |
| Trigger named 清理日志 / 清理历史会话 inside `.table-batch-action-bar__meta` of a `.page-panel` | `GovernanceCleanupBar` renders the danger button in its meta div; pages pass `common.cleanupLogs` / `auth.session.cleanupAction`; host `Card` keeps `page-panel` | ✓ |
| Retention mode default, `.arco-alert-warning` visible, OK posts `{retentionDays}` only | dialog resets to `mode='retention'` on open; `Alert type="warning"`; retention branch omits startedAt | ✓ |
| Radio `按时间范围` (type=button) switches to range; payload `startedAt/endedAt` matches `YYYY-MM-DDTHH:mm` with offset | `common.cleanupModeRange`; `Radio.Group type="button"`; `toRfc3339` emits `YYYY-MM-DDTHH:mm:ssZZ` (e.g. +08:00) | ✓ |
| Retention options fetched from `/system/setting/group/audit` with page-specific key | `getSettingGroup('audit')` + `loadRetentionSetting(group, <key>, ...)`; keys match the spec mocks (`login_log` / `session_cleanup` / `operation_log`) | ✓ |
| Selected-rows CSV export stays in the same bar and never hits the export endpoint | export button preserved in `trailing`; local-CSV branch untouched | ✓ |
| Success toast matches /已清理\|清理成功/ | `auth.loginLog.cleanupSuccess` 已清理 {{count}} 条… | ✓ |

## Risk points examined

- **GORM query reuse**: aggregates use a freshly-built scoped query per count
  (`scopedLoginLogQuery`, second `applyOperationLogBaseQuery`,
  `applySecurityEventFilters`), so no condition pollution between
  count/find. The pre-existing `Count` → `Find` reuse pattern is unchanged.
- **Aggregate semantics**: counts cover the whole filtered set, mirroring the
  session list's `activeCount/revokedCount`; when a status filter is active
  the aggregates reflect the filtered scope (same as sessions).
- **Smoke mocks without new fields**: pages guard with `?? 0`, so specs whose
  list payload predates the aggregates render 0 instead of crashing; no spec
  asserts those hero numbers.
- **Batch acknowledge**: `acknowledged_at IS NULL` guard means re-acks are
  no-ops and original notes survive; empty-id and empty-note requests return
  typed i18n errors (keys added to all five runtime-fixes locales).
- **Auto-retention throttles**: login-log gains the 15-min throttle the
  Runtime had reserved fields for (dead fields removed); security-event
  retention only ever deletes acknowledged rows.
- **CSS/token compliance**: restored `--governance` select width uses
  `--shell-governance-select-width` (the pre-retirement code hardcoded
  128px); new `metric--action` affordance uses `--brand-primary` +
  `--surface-lift` tokens only. `check:ui-contract` 0/228,
  `check:shell-visual-contract` pass confirm no forbidden patterns.
- **Admission gate**: `/system/security-event` entry validated by
  `check:system-page-admission` (16 entries pass); drawer title prop aligned
  with the button text so `governance-insight-drawer.spec.ts` (which walks
  the admission config) can match `治理摘要` inside the drawer.

## Verdict

Code-complete; mechanical gates green (see summary.md). Remaining before
merge: governance smoke run (incl. cleanup-range-ui) and rendered visual
evidence for the four audit pages — blocked at review time by the local Bash
permission-classifier outage, must be executed before the PR is opened.

### 2026-09-23 closure of the two blocking conditions

Both conditions were met after the outage cleared, and the round shipped:

1. **Governance smoke.** `cleanup-range-ui.spec.ts` is part of
   `test:smoke:system:governance`, which `test:smoke:system` and then
   `test:smoke:all` include, so the Full Smoke Suite on `main` runs it. That
   workflow is **success** on `6387115e` and on `f9134a4f` (`smoke-full.yml`,
   2026-09-23), covering the cleanup range dialog, the warn alert and the
   page-specific retention keys this review pinned.
2. **Rendered visual evidence.** The expected screenshots are present in this
   evidence directory: `login-log-page.png`, `session-page.png`,
   `operation-log-page.png`, `security-event-page.png`,
   `login-log-cleanup-dialog-retention.png`,
   `login-log-cleanup-dialog-range-open.png`, `dept-governance-bar-hover.png`,
   `security-event-governance-drawer.png`.

No code changed in this closure, so the contract cross-check table above still
stands. The verdict moves from `blocked` to `approved` on that basis, which also
resolves the contradiction with the manifest's `completed` status
(`statusBackfilledAt: 2026-09-15`).

## Machine Readable

```json
{
  "taskId": "2026-07-20-security-audit-governance-round",
  "verdict": "approved",
  "findings": [],
  "residualRisks": [
    "The original review was blocked pending smoke and rendered evidence; both were satisfied later and the verdict was updated on 2026-09-23 (see the closure section above).",
    "This remains a self-review under the maintainer's one-time exemption — no independent reviewer read the original diff."
  ],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-07-20-security-audit-governance-round/manifest.json",
    "evidence": ".harness/evidence/2026-07-20-security-audit-governance-round/commands.json",
    "reviewFile": ".harness/evidence/2026-07-20-security-audit-governance-round/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
