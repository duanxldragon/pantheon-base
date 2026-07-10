# Lint Debt — pantheon-base backend

> Snapshot: 2026-07-10, branch `lint/baseline-clean`, after `.golangci.yml` set
> `errcheck.check-blank: false` and the reviewed lint diff (pre-ignoreError-revert).
> Tool: golangci-lint 2.6.2, config `.golangci.yml`.
> Command: `golangci-lint run --max-issues-per-linter=0 --max-same-issues=0 ./backend/...`

## Headline

**807 issues remain.** The branch name `lint/baseline-clean` is aspirational — the
baseline is NOT clean. The reviewed working-tree diff fixes ~30 files worth; this is
the honest remainder. `go build` and `go vet` are both clean; none of these block
runtime — they are maintainability/style/hardening findings.

## Breakdown by linter

| Linter      | Count | Nature                                                                              | Risk                   |
| ----------- | ----: | ----------------------------------------------------------------------------------- | ---------------------- |
| revive      |   690 | 689 × `exported: … should have comment or be unexported`; 1 × early-return          | Low (mechanical)       |
| goconst     |    51 | repeated string literals → extract const                                            | Low                    |
| gosec       |    50 | mostly G2xx/G3xx (file perms, path handling) + a few needing `#nosec` justification | **Medium — read each** |
| errcheck    |    13 | genuinely unchecked errors (not blank-ignored)                                      | Low–Medium             |
| staticcheck |     3 | QF1001 De Morgan simplifications                                                    | Low                    |

(Note: errcheck dropped 83→13 purely from `check-blank:false`; the 13 are real
unchecked returns worth handling or explicitly `_ =`-ignoring.)

## Breakdown by package (issue count)

| Package                     | Issues |
| --------------------------- | -----: |
| backend/modules/system      |    407 |
| backend/modules/auth        |    107 |
| backend/pkg/common          |     78 |
| backend/modules/lowcode     |     69 |
| backend/internal/scaffold   |     54 |
| backend/pkg/impexp          |     23 |
| backend/pkg/database        |     16 |
| backend/internal/middleware |     16 |
| backend/pkg/contracts       |     15 |
| backend/modules/platform    |      9 |
| backend/pkg/metrics         |      7 |
| backend/modules/business    |      3 |
| backend/pkg/ratelimit       |      2 |
| backend/cmd/server          |      1 |

## Remediation plan (batches for Codex — do NOT do in this wrap-up)

Each batch = one PR, gated on `go build ./... && go vet ./... && golangci-lint run`
showing a strict decrease with zero new issues. Ordered lowest-risk first.

1. **Batch A — revive/exported comments (689).** Mechanical godoc on exported
   symbols. Split by package (system → auth → common → lowcode → scaffold → rest)
   to keep PRs reviewable (~100 each). **No logic changes.** Highest volume, lowest risk.
   - Alternative to weigh with the owner: if the team does not want godoc on every
     exported symbol, scope `revive.exported` down (e.g. `checkPrivateReceivers`,
     or disable for `*_model.go`/DTO files) instead of writing 689 comments.
     **This is a policy decision — surface before writing comments.**
2. **Batch B — goconst (51) + staticcheck (3).** Extract repeated literals to consts;
   apply the 3 De Morgan simplifications. Pure refactor.
3. **Batch C — errcheck (13).** Case-by-case: handle the error (log/return) where it
   matters; `_ = X` only where genuinely ignorable. Do NOT blanket-ignore.
4. **Batch D — gosec (50).** **Read every finding.** Real hardening (perms, path
   traversal, weak crypto) must be fixed; false positives get a justified `#nosec`
   with a reason comment. Route through the `deep` Codex tier (security-sensitive).

## Anti-patterns to avoid (learned this cycle)

- **No `ignoreError()`-style no-op helpers** to dodge errcheck. Use idiomatic `_ = X`
  (now legal) or handle the error. A duplicated no-op across packages is linter-gaming.
- **No smuggling behavior changes into "lint" commits.** This diff quietly removed a
  stdlib-context trace write and changed a test assertion — both turned out safe, but
  each must be called out in the commit body, not buried.
- **No `//nolint` without a reason.** Every suppression needs `// reason` after it.

## Definition of done for "baseline-clean"

`golangci-lint run ./backend/...` exits 0 **and** CI enforces it on new PRs
(add the gate to `.github/workflows/` once Batches A–D land, so the baseline
cannot regress).
