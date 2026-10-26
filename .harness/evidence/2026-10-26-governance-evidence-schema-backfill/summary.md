# Summary — 2026-10-26 governance evidence schema backfill

## What changed

The repository's strict governance checkers were red before this round started, and every error was historical:

- `check-evidence.mjs --root . --strict` → exit 1, 7 `commands.json` files.
- `check-review.mjs --root . --strict` → exit 1, 24 `review.md` files (22 with no Machine Readable block, 1 dead `planRefs` path, 1 out-of-enum `structuralReview.checks`).

Both now exit 0 with 0 errors and 0 warnings — 54 evidence files and 54 review files, i.e. every artifact including this round's own — with no historical verification conclusion altered.

Repairs, by shape:

| Shape | Files | Repair |
|---|---:|---|
| `linkage` absent | 5 `commands.json` | Added, derived from the directory basename; every referenced path checked to exist |
| `knownGaps` absent | 4 `commands.json` | Populated from that round's own residual-risk / not-verified prose |
| `runtimeSensitive` / `runtimeGap` typed as arrays | 2 `commands.json` | Collapsed to boolean / string; original arrays preserved under `runtimeSensitiveNotes` / `runtimeGapNotes` |
| No `## Machine Readable` block | 22 `review.md` | Appended block with `taskId`, `verdict`, `verdictRationale`, `linkage` |
| Dead `planRefs` | 1 `review.md` | Retargeted to the round's own manifest, with `planRefsNote` recording that the file was deleted at v0.15.0 closeout |
| Out-of-enum `checks` | 1 `review.md` | `["sensitive-flow"]`, with the displaced `tenant-isolation` / `reserved-namespace` prose kept in `checksNote` / `findings` |

Also in this round: FR-016 added to `docs/harness/failure-registry.md`; this round's task packet, manifest, and evidence set created; and two workspace hygiene defects found while investigating were closed (5 generated files had lost their `DO NOT EDIT` marker — a CI-blocking `check:generated` step — restored from HEAD after archiving the diff, and one `gofmt` violation in `backend/internal/middleware/tenant_platform_scope_test.go`).

## Why the chain rotted

`check-evidence` and `check-review` have no npm script and appear in no workflow. `.github/workflows/quality.yml` runs 19 `npm run check:*` steps; these two are not among them. Each time a field became required, the artifacts of every earlier round silently stopped validating, and nothing observed it. FR-016 records the failure with `Recommended Harness Change: gate` and `Promotion Decision: registry-only`, status `open`.

## Verification

- `check-evidence --root . --strict` → 0 errors / 0 warnings, exit 0 (54 files, including this round's own).
- `check-review --root . --strict` → 0 errors, exit 0 (54 files).
- `check-task-packet --root .` → 58 packets, 0 errors, exit 0, including this round's packet.
- `check-structure-contract`, `check-failure-registry`, `check-ui-quality-gate`, `check-generated`, `check-doc-frontmatter`, `check-doc-links`, `check-doc-inventory`, `check-sync-drift`, `check-encoding`, `check-method-health`, `check-adoption`, `check-template-health`, `check-visual-evidence`, `check-feature-ledger`, `check-permission-contract`, `check-backend-response-contract`, `check-backend-dto-contract`, `check-audit-coverage` → all exit 0.
- The four non-`scripts/harness` CI governance steps in their CI form: `check-task-packet-template`, `cleanup-generated-modules --check`, `check-menu-contract` (19 menus / 23 routes / 102 permissions / 23 component keys), `check-duplication` → all exit 0. Together with the above that covers 18 of the 19 `npm run check:*` steps in `quality.yml`; `check:pr-governance` needs a hosted PR event payload.
- Integrity proofs: the 22 appended `review.md` files are `22 insertions / 0 deletions`; `git diff -- .harness/evidence | grep '"status"'` is empty.
- Post-restore build checks: `tsc -b` exit 0, `eslint src --max-warnings 0` exit 0, `go build ./...` exit 0, `go vet ./...` exit 0, `gofmt -l .` empty.

## Gaps and limits

1. Nothing historical was re-run. Schema validity is not evidence that a 2026-10-13 isolation assertion still holds.
2. Two strict checkers that no workflow and no npm script ever invokes are still red and are reported as findings rather than fixed here: `check-runtime-evidence --root . --strict` (0 errors / 11 warnings, G-03) and `check-inheritance-contract` (G-05). G-05 needed two runs to state honestly: 7 findings from this repo's directory, 8 from the workspace root (`D:/workspace/go/pantheon-platform`), and the workspace-root reading is the correct one — `docs/WORKSPACE_INHERITANCE.md` lacks 3 required inheritance markers, `pantheon-ops/docs/PROJECT_INHERITANCE.md` lacks 3 markers plus the pinned-Base-version rule, and `.github/pull_request_template.md` does not exist at that root. A third, `check-boundaries --root . --strict`, exits 1 on the bare invocation (G-04: `frontend/src/modules/platform/widgets.tsx:1` importing `../system/iam/menu/api`) but **is** run in CI — `.github/workflows/ci.yml:391` — with `config/boundary-baseline.json`, where that import is baselined until 2026-12-31, so its CI form exits 0; the bare `--strict` run is stricter than the gate. None of these names a file this round touched — verified against `git diff --name-only`.
3. The strict evidence/review checkers are still not in CI. Making them blocking is the maintainer's call (touchpoint 2), so the green state holds only while someone runs it.
4. The actor behind the stripped generated-file markers is undetermined; mtimes precede this session's edits and HEAD is clean. Stated as unknown rather than guessed.
5. No backend unit test, Playwright smoke or SonarCloud run belongs to this round; those remain CI's verdict.

## Human gate pending

Add `check:evidence` / `check:review` npm scripts and wire both into the Docs Governance job of `.github/workflows/quality.yml`? This round deliberately did not — with 53 artifacts now clean it would pass, but promoting a check to blocking is a gate-policy decision, not a repair step. FR-016 is the place that decision gets recorded either way.

## Next

No commit, push or PR was made; none was requested. The 37 changed governance files, this packet, its manifest, this evidence set and the FR-016 entry are the deliverable.
