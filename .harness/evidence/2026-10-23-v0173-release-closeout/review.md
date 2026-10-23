# Review — v0.17.3 release closeout

Reviewed against `main` at `933ffddd` (the merge of PR #414), with `pantheon-base-v0.17.2` as the
previous release tag.

## Scope audit

`git diff --stat pantheon-base-v0.17.2..HEAD` reports 15 files:

- release tooling: `check-release-secrets.mjs`, `publish-foundation-release.mjs`, its test file;
- one frontend smoke spec;
- one backend file, `tenant_service.go`, whose diff is a single duplicated doc-comment line removed;
- evidence, STATUS, CHANGELOG, release notes, and the failure registry.

There is no route, permission, schema, migration, menu seed or error-envelope change. The package
version moves 0.17.2 → 0.17.3 as a patch, which matches "no consumer-facing runtime change".

## Claim audit

| Release-note claim | Evidence |
|---|---|
| Gate scans both shapes and fails closed | `scanReleaseForCredentials` targets `bundle/` and `repo.tar`; `scanTarForCredentials` returns `ok: false` when the archive is missing or `tar` fails; the publish path calls `assertReleaseIsFreeOfCredentials` before the tag |
| Residue path is pinned | the test creates `repo.tar/.harness/archive/.../commands.json` and expects a finding |
| Masking is preserved | the existing assertion "never reprints the secret it found" passes; fixture output shows `-p01***…ef` |
| Smoke waits for alignment | the spec polls `|popup.x − trigger.x| ≤ 1` before measuring `scrollWidth − innerWidth`; the overflow bound stays `≤ 1` |
| Evidence is corrected, not rewritten | the v0.17.2 `summary.md` carries an erratum and keeps the original claims; `review.md` has the R-1…R-5 addendum |
| No runtime change | the only backend diff is a comment; full suite not rerun and stated as a gap |

## Findings

No blocking finding in the release content. The review records these residual risks:

- **R1 (P3, accepted)**: the scanner detects three concrete credential shapes. It is intentionally
  narrow to avoid the 42 false positives the broader rule set produced; a credential outside those
  shapes is not detected. This is the same trade-off the v0.17.2 release documented, not a new gap.
- **R2 (P3, environment)**: the full backend real-database suite was not repeated for this release.
  Justification is the comment-only backend diff plus the green suite in the v0.17.2 packet; the PR's
  required checks still run the repository's test workflows.
- **R3 (P3, environment)**: the local Playwright run used an already-running Vite dev server because
  the wrapper's own server could not bind port 5173. The spec mocks its API routes, so this does not
  weaken the assertion; CI's smoke jobs remain the independent runtime signal.
- **R4 (P3, immutable)**: the v0.17.0 asset still carries the rotated development password. The
  widened gate cannot recall it; it only prevents a recurrence.

## Verdict

Release content is consistent with its notes and evidence. The release was cut and published from
`1b74dccb` on 2026-10-23: annotated tag `pantheon-base-v0.17.3`, four assets with verified
checksums, and `Foundation Release Verify` (run `39920022781`) succeeded. Details and the command
trail are in `summary.md` and `commands.json`.
