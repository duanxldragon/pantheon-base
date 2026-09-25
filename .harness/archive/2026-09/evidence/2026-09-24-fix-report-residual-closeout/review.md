# Self-review — 2026-09-24 fix-report residual closeout

Reviewer posture: self-review against the harness contract and this round's own
gates. Implementation and review share an author, so the findings lean on
executable proof — four DB-backed regression tests, a real-database migration
replay, two live checker probes and a full gate run — rather than on reading.

## Scope check

Every item traces to a recorded residual, not to new scope:

| Item | Where it was recorded |
| --- | --- |
| boundary gate (§四.1) | `fix-report.md` §四, closed by `2026-09-22-layer-boundary-gate`, re-verified here |
| MFA deployment baseline (§四.2) | `fix-report.md` §四.2 |
| coverage gate (§四.3) | `fix-report.md` §四.3, closed by `ci.yml:431`, executed here |
| four-theme screenshot baseline (§四.4) | `fix-report.md` §四.4 |
| `system_i18n.updated_by` (§四.5) | `fix-report.md` §四.5 |
| stale business smoke spec | `.harness/CORE_SMOKE_TRIAGE.md` residual gap line |
| `check-generated` blind spot | `2026-09-22-generated-artifact-governance` debt note carried into this round |
| docs index entry | residual inventory of the 2026-09-22 remediation plan |
| four missing P2 packets | `.harness/tasks/TASK_MASTER_PLAN.md` P2-1/2/4/5 |

The manifest's `scope.out` held: the MFA seed default, CI thresholds, the frozen
tenant contract, business runtime behaviour, the legacy task-doc allowlist and
all four human gates were not touched.

## Risk points examined

- **Marker-driven replay of 8..19 on real databases.** Putting `updated_by` into
  `currentRuntimeSchemaMarkers` is what forces existing deployments to replay
  000019; the alternative — leaving it out — would let every upgraded database
  skip the migration and fail at runtime on `UPDATE ... SET updated_by`. The
  replay was executed against the real dev database, which is how 000012,
  000008 and 000013 surfaced; each fix is guarded, idempotent and pinned by a
  regression test, and `schema_migrations` ended at 19/0.
- **000013 adoption semantics.** When the id=0 slot is free but `__global__` is
  taken (dev auto-increment row), the row is adopted onto id=0 instead of
  duplicating; the insert remains conditional on *either* identity being absent,
  the AUTO_INCREMENT reset is kept, and compat deployments that already hold
  id=0 execute only no-op guards.
- **Fixture fidelity vs. scope creep.** The marker fixture is a minimal schema
  (no `system_dept` etc.), so the new test asserts the targeted
  `system_i18n.updated_by` write instead of widening the fixture to every
  runtime table — keeping the diff reviewable.
- **check-generated extension false-positive surface.** Discovery only applies
  to the two generated-module roots and `schema/generated/<scope>/`; hand-written
  trees are untouched (`cleanup-generated-modules --check` still reports none),
  the clean tree stays 0/11, and both rules were proven to fire by live probes.
- **Smoke rewrite skip semantics.** The skip condition is now an API fact (menu
  tree has no `business.` node), evaluated after a real login — CI, which seeds
  no business modules, keeps the historical 3-skipped baseline instead of
  pretending coverage it does not have.
- **Documentation-only MFA item.** No code or seed changed; the enforcement
  point is the deployment checklist, which is where the fix-report suggested it.
- **`updated_by` trust boundary.** The field is `json:"-"` on requests, filled
  by handlers from the token-middleware username — clients cannot set it, and
  the value matches what the operation log already records.

## Findings

None blocking. Follow-ups worth naming rather than fixing here:

1. The business smoke UI path cannot execute anywhere until an environment
   ships a generated business module (local and CI both lack one); if that
   becomes a requirement it belongs to a generator/CI fixture packet, not this
   closeout.
2. A cross-platform visual run will need `--update-snapshots` for its own
   platform set — same standing caveat as the original login baselines.
3. The directory-layout packet split (`.harness/tasks/*/task.md` vs the
   checker's `docs/harness/tasks/*.task.md` scan) predates this round; a future
   governance round should either extend the checker or migrate the layout.

## Deferred

**Four human gates, by definition.** G2 recovery drill (DBA), production G3
sizing, the v0.12.0 release cut and the state-file close-out checkboxes remain
maintainer-owned. The four-theme baseline's final visual acceptance — the
other touchpoint-③ item — was **signed off on 2026-09-24** (verdict: 通过,
checklist and sign-off in `visual-acceptance.md`). **pantheon-ops sync** stays out of this round: no
foundation-release action was taken and the previously recorded ops blocker
still stands. **No remote CI** was triggered (no push from this session).

## Verdict

All in-scope items are closed with executable proof: migration replay and its
three hardening tests green on the real database, i18n attribution covered on
all four write paths, the MFA baseline in the deployment guide, four-theme
baselines stable across two runs, the smoke rewrite proven determinstic on the
live stack with the full core suite green, and the checker extension proven by
negative probes. Gates green: Go build/vet/gofmt, affected Go tests,
golangci-lint on new code, boundaries, generated (+ probes and tests),
task-packet, structure, doc-links, inventory, encoding, failure-registry,
frontmatter, tsc, eslint, vite build, node script tests (129), coverage gate on
both profiles, visual baselines and the full smoke:core suite. The human gates
and the residual risks above stay explicitly open.

## Machine Readable

```json
{
  "taskId": "2026-09-24-fix-report-residual-closeout",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "residualRisks": [
    "The three business smoke cases remain conditional on a database that contains a generated business module (absent locally and in CI); the rewrite made the skip decision deterministic, not the data present.",
    "Four-theme snapshots are win32-platform; another OS must regenerate its platform set with --update-snapshots.",
    "updated_by is intentionally absent on system-origin fill paths (FillMissingLocales/HydrateBuiltinLocales) and in the CSV export, recorded as the packet's technicalDebtNote.",
    ".harness/tasks/<id>/task.md directory packets (119 files) stay outside check-task-packet's scan surface — a pre-existing layout split inherited by this round.",
    "Coverage figures are a 2026-09-24 local snapshot; continuous enforcement is ci.yml:431, and generator at 26.3% statements is the named residual tracked by the phase-3 packet.",
    "Four human gates (G2 drill, G3 sizing, v0.12.0 release, state-file close-out) are deferred to the maintainer; the four-theme visual acceptance was signed off on 2026-09-24 (visual-acceptance.md); no remote CI ran this round because no push was made."
  ],
  "structuralReview": {
    "affectedSubgraph": [
      "database migration layer: currentRuntimeSchemaMarkers, migrations 000008/000012/000013/000019, system_init.sql parity, migrate tests",
      "system/i18n domain: model, I18nResp, service Create/Update/Import/SyncMissingKeys, handler username injection",
      "harness checker layer: check-generated discovery extension and its pinned tests",
      "frontend test surfaces: smoke-core business spec, visual theme-baseline spec + snapshots",
      "documentation surfaces: DEPLOYMENT_GUIDE, fix-report, CORE_SMOKE_TRIAGE, TASK_MASTER_PLAN, REPOSITORY_LAYOUT (zh/en)"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "No new cycle or hub: the marker array gains one entry on an existing loop, updated_by writes ride the existing GORM paths and the username already present in the request context, the checker extension widens a match set without new dependencies, and both new specs are leaf test files. Sensitive flow: updated_by is server-injected only (json:\"-\" on requests) and the DDL reaches databases solely through the existing RunMigrations channel, proven by replay on the real database; boundaries stay at 0 findings."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-24-fix-report-residual-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-09-24-fix-report-residual-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-09-24-fix-report-residual-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md",
      "fix-report.md"
    ]
  }
}
```
