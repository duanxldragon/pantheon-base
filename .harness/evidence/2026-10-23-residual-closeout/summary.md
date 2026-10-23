# Summary — 2026-10-23 residual closeout (v0.17.2)

## Why this task exists

v0.17.1 shipped with five explicitly registered residuals (remediation report §5). The instruction for this
task was: process the leftovers — close what can be closed, and be honest about what closing means. Two of
the five turned out to be real defects once they were actually exercised; the other three are closed by
removing the condition that made them residuals.

## The five residuals, item by item

### P2-4 Redis test isolation — closed by removing the shared condition

`pkg/testredis` now derives each test process's logical database from a dedicated env var
(`PANTHEON_TEST_REDIS_DB`, default unchanged at 1) and the six consumer packages
(`pkg/authtoken`, `internal/middleware`, `modules/auth/login`, `modules/auth/session` ×3 files, plus the
`pkg/testredis` own suite) pin distinct DB indexes. Verified by running all four previously-flaky packages in
parallel (`go test -p 4`, the default) for 3 consecutive rounds — all green, no `--- FAIL` lines.

### P2-9 concurrent provisioning — was a real deadlock, now fixed and pinned

Writing the missing test (`TestConcurrentProvisioningKeepsTenantResourcesIsolated`) immediately reproduced
`Error 1213 (40001): Deadlock found` inside `copyPlatformSettingsToTenant`: two tenants inserting copies of
the platform settings with `NOT EXISTS` subqueries in the same instant lock `system_setting` in opposite
orders under the default isolation level. Fixes:

- `copyPlatformSettingsToTenant` / `copyPlatformDictsToTenant` no longer use `INSERT ... SELECT` over the
  source table. They read the platform rows with a plain non-locking `SELECT`, filter out keys the tenant
  already owns, and `Create` the remainder — removing the shared next-key locks that collided;
- `CreateTenant` translates a duplicate-key error from the UNIQUE `code` column into `ErrTenantCodeExists`
  (new helper `pkg/database/duplicate_key.go`) so two concurrent creates with the same code yield a clean
  409-shaped error instead of a raw 500.

`TestConcurrentProvisioning*` passes under `-count=8` and under `-race`.

### Race detector gap — closed by locating a working toolchain

The v0.17.1 failure was environmental: PATH resolved `gcc.exe` to a Cygwin binary that cannot link
race-enabled test binaries. With `CC=/d/msys64/mingw64/bin/gcc.exe` the detector runs. `go test -race` on the
concurrency and tombstone suites passes; race coverage is no longer CI-only.

### P3-1 v0.17.0 credential residue — closed by a gate that refuses a repeat

New `scripts/foundation-release/check-release-secrets.mjs` scans a release for the credential shapes the
v0.17.0 incident actually had (MySQL DSN password, `-p<secret>` command lines, URL credentials — three
rules, no PEM or JWT rule), with placeholder filtering tuned on the real tree so it runs clean on
`pantheon-base-v0.17.1` and still catches the leaked literal when planted in a fixture
(`tests/scripts/foundation-release/check-release-secrets.test.mjs`, 10 cases at publication; 12 after the
repo.tar coverage added below). The publish script runs it after the bundle is built and aborts before the
tag is created. At publication the gate scanned only the staged `bundle/` tree — not `repo.tar`, which is
where the v0.17.0 evidence file actually lived; the published v0.17.2 `repo.tar` was verified clean
separately after the fact, and the gate now scans both shapes (post-publication correction, see erratum).
The historical bundle itself remains immutable — the credential is dead and the archive stays as-is; this
gate is what makes it unrepeatable.

### P3-2 contract fourth state — closed as a V1.3 clarification, and it found a bug

`TENANT_CONTRACT_V1.md` §2.1 now documents `deleted` as a non-lifecycle tombstone (synthetic
`__deleted_tenant_<id>` code, terminal, invisible to reads), registered in the revision table. Both language
versions updated.

While writing the clarification, the state machine was found lying: `tenantStatusTransitionAllowed` fell
through to `return true` for the tombstone, so `UpdateTenant(id, {status:"active"})` **revived a deleted
tenant**. Fixed (default branch now rejects; `GetTenantByID` hides the tombstone; `AddMember` and
`ProvisionTenant` refuse it) and pinned by three new tests in `tenant_lifecycle_guard_test.go`
(`TestDeletedTenantCannotBeRevivedByUpdate`, `TestDeletedTenantRefusesNewMembers`,
`TestDeletedTenantCannotBeReprovisioned`).

## Post-merge correction (PR #411)

The first squash commit on main (43aec46e) carried the fixture's gitleaks
marker on the line above the secret, but gitleaks v8 honours the marker only
on the secret's own line, so main's full-history push scan flagged it and
blocked the Release Gate. PR #411 moves the marker onto the const line and
pins the fingerprints of both historical commits (0fcc38d0, 43aec46e) in
.gitleaksignore; verified locally with a full-history detect: 0 findings.

## Verification

- `go build ./... && go vet ./... && gofmt -l .` — clean.
- `go test -count=1 -p 1 ./...` with real MySQL and Redis — all packages `ok` (see commands.json).
- `go test -race` on `pkg/tenant`, `pkg/testredis`, `internal/middleware`, `modules/auth/session`, and the
  concurrency/tombstone suites — green with the MinGW toolchain.
- Redis consumer packages in parallel ×3 rounds — green (the original flake scenario).
- `node --test tests/scripts/foundation-release/check-release-secrets.test.mjs` — 10/10 at publication
  (12/12 after the post-publication repo.tar coverage); scanner self-scan of the test directory is clean
  (no real credentials in fixtures).
- `npm run -s test:foundation-release` — green (existing suite + new scanner suite).
- Governance scripts (`check:docs-frontmatter`, `check:task-packet`, `check:structure`, `check:generated`) — pass.

## Version and docs

`VERSION` → 0.17.2; `CHANGELOG.md` gains the 0.17.2 entry; `RELEASE_NOTES_v0.17.2.md` written; both READMEs
point at the new tag/notes and restate delivery status; remediation report §5 is rewritten from "known
residuals" to "closed in v0.17.2, with the evidence"; `.harness/STATUS.md` moves v0.17.1's block to history
and opens the v0.17.2 block. No schema change (still 29 migrations), no route or permission code removed.

## Published facts (2026-10-23)

- PR #411 (gitleaks inline-allow) merged as `45a40c05`; PR #412 (SonarCloud go:S1192,
  `condTenantIDMatches`) merged as `e6aeced9`.
- `Release Gate` green on `main e6aeced9`; `Foundation Release Verify` success on the tag.
- Tag `pantheon-base-v0.17.2` -> `e6aeced9`; GitHub release published with the four assets
  (tgz, tgz.sha256, repo.tar, repo.tar.sha256), non-draft, non-prerelease.
- The release-time credential precheck scanned its own release: clean, 768 files (bundle only).

## Erratum (2026-10-23, post-publication review)

A later review compared this summary against the code and found three statements that did not match what
shipped. They are corrected in place above; recorded here so the original claims are not silently lost:

1. **Deadlock fix mechanism.** The copy helpers did not add a retry of `INSERT ... SELECT` on error 1213.
   They were changed to a plain non-locking `SELECT` plus `Create`, which removes the locks instead of
   retrying them. The tests pass, but the described mechanism was wrong.
2. **Scanner rule set and test count.** The scanner has three rules (MySQL DSN, URL credentials,
   `-p<value>` shell flag); there is no PEM or JWT rule. The suite had 10 tests at publication, not 18.
3. **Gate coverage.** `assertBundleIsFreeOfCredentials` scanned only the staged `bundle/` directory, not
   `repo.tar` — the exact asset that carried the v0.17.0 evidence file. The published v0.17.2 `repo.tar`
   was scanned afterwards and was clean, so no credential shipped in v0.17.2, but the gate as shipped would
   not have caught a repeat. The publish gate now scans both the bundle and `repo.tar`, fails closed when
   `repo.tar` is missing, and has regression tests for a credential planted in `.harness/archive`.

The published `repo.tar` at `e6aeced9` still contains this summary as originally written; a published asset
cannot be edited. This file is the corrected record used going forward.
