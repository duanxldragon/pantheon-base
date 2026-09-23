# Summary — 2026-09-23 governance residual closeout

P1 / platform governance ratchet. No runtime, API, permission, menu, i18n,
database or seed change.

## What was wrong and what changed

**1. Committed dev credentials.** `docs/README.md` documented
`PANTHEON_REDIS_PASSWORD=DHCCdhcc2025`, two evidence transcripts carried that
password plus `root:DHCCroot@2025`, and
`frontend/scripts/database-import-qa-setup.mjs` shipped a hardcoded fallback list
containing the MySQL password. Docs now use placeholders, the transcripts are
redacted, and the QA script takes probe passwords from
`PANTHEON_SMOKE_MYSQL_PASSWORD_CANDIDATES` instead. A tracked-file sweep for both
strings now returns nothing. The values themselves stay in the gitignored
`.env.test`, which is where they belong.

**2. A required CI gate that went green while skipping.** `quality.yml`'s
`backend-tests` job ran `go test -race ./...` with `PANTHEON_REDIS_ADDR`, but
`pkg/testredis` read only `PANTHEON_TEST_REDIS_ADDR`, so every Redis-backed test
in that gate silently skipped — a green gate measuring less than it claimed.
`Open` now accepts `PANTHEON_TEST_REDIS_ADDR` → `PANTHEON_REDIS_ADDR` →
`REDIS_ADDR` (and the three password names), and `PANTHEON_TEST_REDIS_REQUIRED`
turns a missing address into a failure. Both Go test jobs set the flag and the
job that runs no server uses the test variable. This was also the trap that made
the previous round's Redis evidence look greener than it was.

**3. A baseline that could hide a regression.** The `pkg/contracts/authuser` port
had already removed the three `auth → system/iam/user` production imports, leaving
their baseline entries stale — and a stale entry still whitelists its file+import
pair, so the dependency could return unnoticed. The entries are gone and
`check-boundaries --strict` now fails on any stale entry.

**4. A dead checker.** `scripts/check-arch-boundaries.mjs` was unwired, needed an
external `rg`, overlapped the harness gate, and its `checkSystemCrossDependency`
looked for `service|repository|handler` directories that do not exist — a rule
that could never fire. It is deleted. Its one live intent is now expressed as a
real invariant in `check-boundaries.mjs`: a `system/*` subdomain may not import a
sibling subdomain; only `backend/modules/system/system_modules.go` wires them.

**5. A checker that reported history as failure.** `check-task-packet.mjs` scanned
28 docs and returned 166 errors, all from docs written before the section
template existed, which made a plain run meaningless. The 17 pre-template docs are
now listed by name in `config/task-packet-legacy-docs.json`; a listed doc that no
longer exists is an error, `--include-legacy` still reproduces the old report, and
the checker is wired into the docs-governance job so current-format docs are
actually enforced.

**6. Generated files the gate could not recognise.** The low-code generator wrote
module files with no marker, so `check:generated` could only cover the 11 stable
artifacts by name. `ModuleExporter.generateAll()` now prefixes the contract marker
(Go's `^// Code generated .* DO NOT EDIT\.$` convention) to every file it emits,
and a repo test pins the sentence across the generator, the reset tooling and the
gate.

**7. A contradiction.** `2026-07-20-security-audit-governance-round` carried
`verdict: blocked` while its manifest said `completed`. Both blocking conditions
had since been satisfied — the governance smoke spec (`cleanup-range-ui.spec.ts`)
is part of `test:smoke:all`, which is green on `f9134a4f`, and the rendered
screenshots are in its evidence directory. The verdict now reads `approved` with
the closure and the remaining self-review caveat recorded.

## Verification

| Gate | Result |
| --- | --- |
| `go build` / `go vet` / `gofmt` | clean |
| affected Go tests | testredis, database, auth/login, auth/session all ok |
| `golangci-lint --new-from-rev=origin/main` | 0 issues |
| `check-boundaries --strict --baseline` | 0 findings, 0 stale, 0 warnings |
| `check-task-packet` | 11 files, 0 errors (17 legacy skipped) |
| `check:generated --strict` | 0 findings across 11 artifacts |
| `check:structure`, doc-links, inventory, encoding, failure-registry, frontmatter, task-packet-template | all pass |
| frontend `tsc -b`, import-path-case | exit 0 / 247 files |
| generator contract, marker consistency, QA-setup, workflow tests | 8/8, 2/2, 7/7, 6/6 |

Four negative probes prove the new guards fire rather than merely pass:
`PANTHEON_TEST_REDIS_REQUIRED=1` with no address fails, a closed-port runtime
address is consumed instead of skipped, a stale baseline entry exits 1, and a
stale legacy-allowlist entry exits 1.

## Explicit gap

**pantheon-ops is not synchronized.** Its lock consumes `pantheon-base-v0.12.1`
(`baseCommit 884465c0`, 31 commits behind base `main`) and its own
`pendingWork.baseline-swap` already records the blocker: uncommitted changes from
another session in the ops tree, which currently reports 269 changed entries.
Swapping a baseline over that tree risks mixing lineage and discarding work this
round does not own, so the three shared artifacts this round touches
(`pkg/testredis`, the generator marker, the QA setup script) reach ops with the
**next** foundation release. No files were copied into ops by hand.

## Residual risks

- Redis was unavailable locally, so the Redis-backed cases ran as skips; the
  helper contract was proven by the two targeted probes instead of a full run.
- Pre-existing release payloads under `pantheon-base/dist/` and
  `pantheon-ops/.foundation/releases/` still contain the old password inside
  gitignored bundles; they are build artifacts, not tracked content.
- The 17 legacy task docs stay listed until someone migrates or deletes them.
- The generator still does not mark the 11 stable artifacts it rewrites, and the
  flaky full-smoke generator suite plus the `.golangci.yml` v2 key drift both
  remain open from the previous round.
