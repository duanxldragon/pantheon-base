# v0.17.8 Dependency Vulnerability Closure — 2026-10-27

## What this round fixes

`pantheon-ops` main's `Security Gates` workflow is red. Run `40457897311`, job
`Dependency Vulnerabilities` (`122035403107`), echoes the four inputs its aggregate step reads:

```
govulncheck: success
npm audit (root): success
npm audit (frontend): failure
osv call analysis: failure
```

Both failures have their input inside `pantheon-base`:

| # | Advisory | Where it is pinned | Why it blocks |
| --- | --- | --- | --- |
| V1 | `GO-2026-6809` — `crypto/x509` must distrust compromised intermediate certificates, fixed in Go 1.26.10 | `backend/go.mod` line 3, `go 1.26.9` | OSV reports `stdlib 1.26.9` with `{"GO-2026-6809":{"called":true}}`, and `Enforce OSV call analysis` refuses any called group |
| V2 | `GHSA-mrhx-c7xc-m3w5` — high, `zod < 4.6.6` can exhaust memory validating oversized constrained collections | `frontend/package-lock.json`, `node_modules/zod` 4.3.6 | `npm audit --audit-level=high` exits non-zero for the frontend project |

The consumer cannot fix either one. `pantheon-ops/business-overlay.json` declares
`replaceRoots: [".github", ".harness"]` and a 60-entry `repositoryOverlayPaths`; neither
`backend/go.mod` nor `frontend/package-lock.json` appears in them, so both files are base-owned and are
restored from the base snapshot by every `rebuild:from-base`. A dependabot bump of either file in ops
is silently reverted. Base-first is not a preference here, it is the only landing side.

## What changed

- `backend/go.mod`: `go 1.26.9` → `go 1.26.10`. One line.
- `frontend/package-lock.json`: the `node_modules/zod` entry's `version`, `resolved` and `integrity`
  move to 4.6.7. Three lines.
- `Dockerfile`: `golang:1.26.5-alpine` → `golang:1.26.10-alpine`, plus the reason. Workflows take the
  Go version from `go.mod` through `go-version-file`; the image tag is a second, independent read and
  would otherwise leave container builds on a 1.26.5 toolchain against a module that requires 1.26.10.
- `README.md`, `README.en.md`, `docs/DEPLOYMENT_GUIDE.md`: toolchain baseline and current-release text.
- `VERSION` 0.17.8, `CHANGELOG.md`, `RELEASE_NOTES_v0.17.8.md`, and this round's packet / manifest /
  evidence trio.

No file under `backend/` other than `go.mod`, and no file under `frontend/src/`, is touched. The
product source is byte-identical.

## Differential proof

Every claim was measured against the pre-fix state rather than asserted:

- `npm audit --package-lock-only --audit-level=high` against the real npm registry:
  **pre-fix lock → `1 high severity vulnerability` (`zod <4.6.6`, `node_modules/zod`)**,
  **post-fix lock → `found 0 vulnerabilities`**.
- `osv-scanner` v2.3.3 on identical lockfile pairs:
  **pre-fix → 3 vulnerable groups** (`golang.org/x/crypto 0.57.0 GO-2026-5932`,
  `stdlib 1.26.9 GO-2026-6809`, `zod 4.3.6 GHSA-mrhx-c7xc-m3w5`), scanner exit 1;
  **post-fix → 1 group** (`x/crypto GO-2026-5932`), scanner exit 0. The two gate-blocking entries
  disappear, the survivor is the same advisory the ops baseline already recorded as `called: false`,
  and the scanner's own exit code flips from non-zero to zero — which is what the consumer's
  `Enforce dependency vulnerability gate` step aggregates. In lockfile-only mode OSV has no call
  graph, so it reports `GO-2026-6809` as `called: false`; the `called: true` reading above comes from
  the ops source scan in run `40457897311`, and `govulncheck` is the call-graph instrument here.
- `govulncheck` v1.3.0 on the real backend source under the new toolchain:
  **`No vulnerabilities found`**, `Your code is affected by 0 vulnerabilities` (0 called;
  1 imported + 3 required packages, none reachable).
- The consumer's own instrument on the whole tree:
  `osv-scanner --recursive --call-analysis=go --no-ignore backend frontend` over the post-fix base
  tree visits 2846 directories, scans `backend/go.mod` (92 packages) and
  `frontend/package-lock.json` (462 packages), and returns **1 group — `x/crypto 0.57.0`
  `GO-2026-5932`, `called: false` — 0 reported vulnerabilities, exit 0**. `--no-ignore` is needed only
  because this worktree sits under the gitignored `.tmp/`; the gaps section records that, and that the
  first diagnosis of the failure here was wrong.

The registry-side proof used `registry.npmjs.org` deliberately: `registry.npmmirror.com`, which the
lockfile resolves tarballs from, returns `[NOT_IMPLEMENTED] /-/npm/v1/security/* not implemented yet`
for the audit endpoint, so a mirror-based audit would prove nothing.

## Build and test readings

- `go version` → `go1.26.10 windows/amd64` (`GOTOOLCHAIN=auto` fetched the toolchain from the new
  directive, which also shows the directive is executable and not decoration).
- `go build ./...` exit 0, `go vet ./...` exit 0, `gofmt -l .` silent.
- `go test -count=1 ./...` → exit 0, 46 packages `ok`, 0 `FAIL`, 0 `SKIP`.
- `npm ci` → 453 packages, exit 0. This is the proof that the hand-minimized lockfile is still a
  consistent installable state (see the lockfile note below).
- `node node_modules/typescript/bin/tsc -b` exit 0, `npm run build` succeeded (`✓ built in 832ms`),
  `npm run lint` clean.
  `npm run lint` matters more than usual here: ESLint's `eslint-plugin-react-hooks` is the only thing
  that executes `zod` in this tree.
- Governance chain, all `--strict` with 0 findings: structure contract 2761 tracked files, encoding
  2423 scanned files, docs frontmatter 365 docs (268 with frontmatter), doc links, doc inventory,
  harness sync-drift, template health, generated artifacts 11/11, UI quality, duplication gate, task
  packet 1 file 0 errors, evidence + review checks for this round and the full `.harness` chain.
  `check-method-health` exits 0 with one standing advisory warning — the OpenSpec skeleton directory
  is absent in this repository, unrelated to this round and unchanged by it.

## How to read `commands.json`

Three things about that file are deliberate, because a first pass over it looked wrong:

- Every command runs under `set -o pipefail`. The earlier draft of the collector ended each line with
  `| tail -n`, and `tail` exits 0 whatever the scanner before it decided — so a first version of this
  file claimed 38 green when nine commands had actually failed, including `npm run build` and five
  governance checkers. With real exit codes those nine split into two environment artifacts (the npm
  PATH order, the missing `pantheon-harness` sibling — both explained below and both resolved), and the
  two genuine readings below. Nothing in the change itself was hiding behind a masked exit code.
- Two entries are non-green by design, and both are readings rather than regressions: `npm audit` on
  the pre-fix lockfile (`1 high severity vulnerability`, exit 1 — that is the bug being fixed) and
  `osv-scanner --recursive --call-analysis=go .` run without `--no-ignore` in this worktree (exit 128,
  `No package sources found` — explained in the gaps section, and paired there with the same scan run
  with `--no-ignore`, which is green).
- Six governance checkers (`check:docs-frontmatter`, `check:harness-sync`, `check:adoption`,
  `check:template-health`, `check:method-health`, `check:doc-links`) need a sibling `pantheon-harness`
  directory. CI's Docs Governance job supplies it with a second checkout (`quality.yml:111-116`,
  `path: pantheon-harness`); a linked worktree under `pantheon-base/.tmp/` has no such sibling, so the
  run created a temporary junction `<worktree>/pantheon-harness` to the local harness copy and removed
  it afterwards. Without it those six report missing-upstream findings that are path artifacts, not
  change artifacts — verified both ways: red without the junction, green with it.
- `npm` must be on `PATH` with `D:\nodejs` first. The frontend `prebuild` chain shells out to `npm`
  again, and calling `D:/nodejs/npm.cmd` by absolute path from a PATH that appends that directory
  leaves the child `cmd.exe` unable to resolve `npm`.

## Lockfile note

`npm update zod --package-lock-only` produced the correct `zod` values and also deleted six `libc`
arrays from optional native packages, because this host's npm writes a slightly different lock shape
than CI's. That churn has nothing to do with the advisory, so the lock was reverted and only the three
`node_modules/zod` fields re-applied. The resulting diff is 3 insertions / 3 deletions, and `npm ci`
plus the build are the verification that the reduced diff is still coherent.

## Known gaps

- `golang.org/x/crypto` `GO-2026-5932` remains in the required graph. It has no fixed version (the
  advisory says openpgp is unsafe by design and unmaintained) and both scanners report it as not
  called, so it blocks nothing today. Whether to force a move to `github.com/ProtonMail/go-crypto` is
  a maintainer dependency-risk decision, registered in the packet, not acted on.
- `SonarCloud Scan` is red on `pantheon-ops` only, with `HTTP 403` on the JRE metadata query — a
  `SONAR_TOKEN` credential matter since 2026-09-17. Nothing in this round changes Sonar rules,
  project configuration or the workflow. Base does not own a scanner workflow at all:
  `.github/workflows/sonarcloud.yml` has never existed in base history (`git log --all --diff-filter=D`
  and `git log --all` on that path are both empty), and no base workflow or script references
  `SONAR_TOKEN`, `SonarSource` or `sonarcloud.io` except `release-gate.yml:174-213`, which *reads* the
  Sonar Web API. On `e256d1fb` both Sonar signals base does have — the `SonarCloud Gate` and
  `SonarCloud Code Analysis` check-runs from the SonarCloud App — concluded `success`, and the Sonar API
  reports main quality gate `OK` with `0` unresolved issues, versus ops `ERROR` with `249`. An earlier
  draft of this file said the 403 made both repositories red; that was carried forward from previous
  rounds without being re-measured and is corrected here rather than left standing (see review R4).
- The consumer's exact OSV command initially found no package sources in this worktree (exit 128). The
  first explanation recorded here — "osv-scanner skips paths containing dot-prefixed segments" — was
  wrong and has been falsified by a control experiment: the same v2.3.3 scans hidden paths on both C:
  and D:, including `.../plain/.wt/proj`. The real cause is that OSV's recursive mode honours
  `.gitignore`, and `pantheon-base/.gitignore:26` ignores `.tmp/`, which is exactly where this linked
  worktree lives. With `--no-ignore` the same call-graph scan runs over base's real source and gives
  the authoritative base-side reading: 1 vulnerable group (`x/crypto 0.57.0 GO-2026-5932`,
  `called: false`), 0 reported vulnerabilities, scanner exit 0. So the base side no longer owes the
  consumer its gate reading; ops main remains the confirmation, not the proof.
- `go test -race` cannot run on this host (cgo disabled), so the race reading belongs to the Linux CI
  `Backend Tests` job.

## Release closeout

PR #433 squashed into `main` as `e256d1fb4773cb02ed9f90cc1c36f02e7f07d912` at
`2026-10-27T07:47:04Z`; the Release Gate run on that commit (`40469207830`, check-run `122079301995`
`Release Gate Summary`) succeeded with all six jobs green. The release was then cut from that commit
and published:

| Fact | Reading |
|------|---------|
| Cut | `releases/pantheon-base-v0.17.8/manifest.json` `createdAt` = `2026-10-27T08:13:29.577Z` |
| Secret scan | `check-release-secrets` clean, 3284 files (both archives unpacked and read) |
| Tag | annotated `pantheon-base-v0.17.8`, object `8f85982a314b51a32ce2e7597b07be969633e70e`, target `e256d1fb` |
| Release | `publishedAt` `2026-10-27T08:17:19Z`, draft=false, prerelease=false |
| Assets | tgz 29072437 B `e1ec60df…`, repo.tar 45772800 B `51674048…`, plus both `.sha256` sidecars |
| Consistency | `check-release-assets`: local bundle and release carry the same four assets, digests match |
| Verify | `Foundation Release Verify` run `40472462712` on `e256d1fb`: completed/success, both jobs success |

The publish step exited 0 without printing to stdout, so every row above was read back from GitHub and
from the local `sha256sum`/`check-release-assets` rather than inferred from the exit code.

Two corrections landed with this closeout, both recorded rather than silently rewritten:

- **Sonar attribution (review R4).** The residual note in the release notes, `README.md`,
  `README.en.md`, this file and `review.md` said `SonarCloud Scan` was red on both repositories. Base
  owns no scanner workflow and never did, its two Sonar check-runs on `e256d1fb` are green, and the Sonar
  API shows base main at `0` issues / gate `OK` against ops main at `249` / gate `ERROR`. The failure is
  consumer-side and credential-side.
- **`check-runtime-evidence --strict` was red on `main`** (1 warning) since `#431` landed the
  `2026-10-27-base-docs-artifact-landing` evidence: that manifest declares its two git-diff assertions as
  `verificationPlan.runtimeEvidence`, which makes the task runtime-sensitive, while the evidence recorded
  neither a signal nor a gap statement the checker can match. Closed with one additive `runtimeGap`
  paragraph in that `commands.json`, in the same shape `2026-09-25-task-archiving-and-v0130-prep` already
  uses. Nothing was skipped or relaxed — the chain reads 61 files, 0 errors, 0 warnings.
