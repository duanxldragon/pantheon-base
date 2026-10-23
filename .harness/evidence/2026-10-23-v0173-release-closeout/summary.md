# Summary — 2026-10-23 v0.17.3 release closeout

## Why this release exists

The post-publication review of v0.17.2 found that its release credential gate scanned only the
staged `bundle/` tree. The v0.17.0 residue lived in a tracked evidence file, which ships only inside
`repo.tar`; the gate had reported "clean, 768 files" without opening the asset that carried the
residue. The fix merged in PR #414 (`933ffddd`), but a fix that is only on `main` does not change any
consumable asset. v0.17.3 publishes it.

This release also carries the corrected v0.17.2 evidence (erratum, not a silent rewrite), the
stabilised tenant-picker smoke, the removed duplicate comment, and FR-015. It deliberately carries
no runtime change.

## What ships

- **Credential preflight coverage**: `check-release-secrets.mjs` scans `bundle/` and `repo.tar`;
  a missing or unextractable `repo.tar` fails closed. `publish-foundation-release.mjs` calls it
  after the bundle is built and before the tag exists.
- **Regression coverage**: 12 scanner cases, including the exact `.harness/archive/.../commands.json`
  residue path inside `repo.tar`, a clean snapshot, and a missing snapshot.
- **Tenant-picker smoke**: waits for the Arco popup to align with its trigger within 1px before
  measuring document overflow. The overflow assertion and its 1px bound are unchanged.
- **Evidence corrections**: the v0.17.2 packet records the three statements that did not match the
  code; FR-015 records the gate-coverage gap.
- **Version material**: `VERSION` 0.17.3, `CHANGELOG.md`, `RELEASE_NOTES_v0.17.3.md`,
  `README.md`, `README.en.md`, `.harness/STATUS.md`.

## Verification (measured locally)

- Credential scanner: 12/12.
- Foundation-release suite: 57/57, 0 failed, 0 skipped.
- Scanner on its own fixtures: clean, 6 files.
- Governance: frontmatter 345 docs; task packets 50 files / 0 errors; structure 0 findings across
  2526 tracked files; generated artifacts 0 findings; failure registry 0 errors.
- Backend: `go build ./...`, `go vet ./...`, `gofmt -l .` clean.
- Frontend: `tsc --noEmit` and ESLint clean; tenant-picker spec 3/3, including the narrow-viewport
  case.
- Boundary audit: `git diff --stat pantheon-base-v0.17.2..HEAD` shows 15 files; the only backend
  file is a comment-only change to `tenant_service.go`.

Decided by CI, not locally: the PR required checks, `Release Gate Summary` on the merge commit, and
`Foundation Release Verify` on the tag.

## Gaps and limits

- The full real-database backend suite was not repeated in this task. No runtime code changed
  between v0.17.2 and v0.17.3 (one comment line), and the v0.17.2 packet ran the full suite against
  the same backend tree. CI's required checks are the authority for this release commit.
- The smoke wrapper could not start its own Vite server because a local dev server already held
  port 5173. The spec was run against the existing server with `PANTHEON_EXTERNAL_WEB_SERVER=1`;
  it mocks all API routes, so no fixtures or database were involved.
- The published v0.17.0 asset still contains the rotated development password. Assets are
  immutable; the gate prevents recurrence, it cannot recall the artifact.

## Publication state

At the time this evidence was written the release was not yet cut. Cut, scan, tag, release, asset
checks and `Foundation Release Verify` are appended to `commands.json` after they run; the manifest
status moves from `in-progress` to `completed` only when the published facts are verified.
