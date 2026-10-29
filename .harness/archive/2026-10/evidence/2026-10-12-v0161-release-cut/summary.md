# Summary — 2026-10-12-v0161-release-cut

## What this release is

`pantheon-base-v0.16.1`, a **patch** release covering the two commits merged after the v0.16.0 tag.

| PR | Title | In shared paths? |
| --- | --- | --- |
| #377 | `fix(tests)`: remove two recurring main-branch flakes at their root | yes — `backend/pkg`, `backend/internal`, `frontend/tests/smoke/helpers` |
| #380 | `feat(release)`: gate foundation releases on their published artifact set | no — release tooling and workflows only |

## Why patch and not minor

`docs/VERSION_MANAGEMENT_GUIDE.md` §2.4 puts bug fixes that do not change functional behaviour on a
patch bump; §2.3 reserves minor for new modules, new shared components and architectural
optimisation. Neither commit adds a module or changes a consumer-facing interface:

- #377 removes two races **at the race**, not by relaxing an assertion. The data-scope defect was
  reachable only through test fixtures (`testmysql.Open` drops each per-test database in
  `t.Cleanup`, which makes the pool unreachable and lets Go recycle the address), and production
  always passes the process-wide singleton pool. So it is a correctness fix with no consumer-visible
  behaviour change.
- #380 adds a release gate and two dispatch-only workflows. That is closing an existing gap, not
  adding capability at module level.

## The decision this release reverses

The v0.16.0 closeout packet recorded: *"The GitHub Release for v0.15.0 carries no assets, so v0.16.0
mirrors that: tag plus a release-notes body."*

That is the actual root cause of the consumer being stuck. `pantheon-ops` does not consume Base from
a sibling working tree — it materializes a release from `repo.tar` plus the bundle archive and
verifies both by SHA-256. A release with no assets is **unconsumable by construction**, so the ops
lock could not advance past `pantheon-base-v0.13.0` and the baseline silently fell three minor
versions behind. Mirroring an asset-less release propagated the fault rather than containing it.

v0.16.1 therefore publishes the full four-asset set:

| Asset | Why the consumer needs it |
| --- | --- |
| `foundation-release-pantheon-base-v0.16.1.tgz` | The bundle; verified against `releaseArtifact.checksum` in the lock |
| `foundation-release-pantheon-base-v0.16.1.tgz.sha256` | Its sidecar |
| `repo.tar` | The source snapshot the consumer extracts to `repo/` and uses as `baseRoot` |
| `repo.tar.sha256` | Verified against `repoSnapshot.sha256` in the lock |

## Why the release is cut by CI

The canonical release scripts are `release:foundation:cut` and `release:foundation:publish`. Both
shell out — `build-release-bundle.mjs` to `git rev-parse` / `git diff` / `git ls-files` /
`git archive` / `tar`, and `publish-foundation-release.mjs` to `git`, `tar` and `gh`. On the host
that prepared this change **Node cannot spawn any subprocess at all**: `spawnSync` returns
`status: null` with `error.code: EBUSY` for `git`, `gh`, `tar`, `node` and `echo` alike, and the
result is unchanged with the sandbox disabled.

That is why v0.14.0/v0.15.0/v0.16.0 were cut by hand without assets in the first place, and it is why
`foundation-release-cut.yml` exists: the release has to run where the toolchain does.

## What the gate gives us

`publish-foundation-release.mjs` enforces, before it writes anything:

1. a clean worktree (satisfied — `releases/*/` and `dist/` are gitignored);
2. a successful **`Release Gate Summary`** check run on the target commit (satisfied — confirmed
   `completed/success` on `1dc2976b`, because `release-gate.yml` triggers on push to `main`);
3. `manifest.baseCommit === target commit` (the workflow passes the same SHA to `--base-commit` and
   `--target-commit`);
4. four checksum-valid assets and non-placeholder release notes;
5. a tag that either does not exist or already points at the same commit;
6. **an existing GitHub release is a hard error** — a release can never be silently overwritten.

## Consumer readiness (pre-flight)

`sharedPaths` is unchanged: 52 entries (backend 4, frontend 46, docs 2), identical to the ops lock
and to the committed v0.13.0 manifest. Only the lock's version, commit and checksums need advancing.

All six business-overlay assembly anchors were checked against the v0.16.1 base tree and each still
resolves exactly once — including the two files touched by v0.16.0's package rename and
`frontend/src/modules/system/*` move, which is the change most likely to have broken them.

## Residual risk

- **The release had not been cut when this summary was written.** `workflow_dispatch` cannot target a
  workflow that is not on the default branch, so the dispatch necessarily follows the merge. The
  published asset list is appended to `commands.json` afterwards.
- **The consumer rebuild was never run.** `rebuild:from-base` needs the same subprocesses that are
  unavailable here. The anchor check substitutes for the most likely failure mode, not for a full
  assembly; the first real rebuild against v0.16.1 is the authoritative verification.
- **The new workflow has never executed.** Its first run is the post-merge dry-run.
- **Neither release check is a required check.** Until a maintainer adds them to branch protection,
  a broken release goes red without blocking.

## Closeout (2026-10-20): v0.16.1 is published

`pantheon-base-v0.16.1` was published on 2026-10-20 and carries all four consumable assets:

| Asset | Bytes |
|-------|-------|
| `foundation-release-pantheon-base-v0.16.1.tgz` | 18500303 |
| `foundation-release-pantheon-base-v0.16.1.tgz.sha256` | 111 |
| `repo.tar` | 31477760 |
| `repo.tar.sha256` | 75 |

`Foundation Release Verify` fired on `release: published` and passed (run 39352195137), so the asset
set is confirmed by CI rather than by the publisher's own claim. This is the first pantheon-base
release since v0.13.0 that a consumer can actually materialize.

### How it was cut, and why not by CI

Four defects had to be cleared before the release could exist, each found by a hosted run rather than
by review:

1. **`base_commit` was ignored by the checkout.** Run 39349403190 failed with "shared release paths
   contain changes outside manifest baseCommit" because the worktree sat at main HEAD while the target
   was the candidate. Fixed in #387 (`7d0224ab`): detach the worktree onto the target commit.
2. **`git push` of the tag is refused for the job token.** Run 39350509094: the candidate commit adds
   `.github/workflows/foundation-release-cut.yml`, and a GitHub App needs `workflows` permission to
   create a ref that introduces a workflow file — a permission no workflow can grant `GITHUB_TOKEN`.
3. **The Git database API is also refused.** Run 39351236715, after #388 moved tag creation to the
   REST API: 403 "Resource not accessible by integration", because this repository's
   `default_workflow_permissions` is `read`.
4. **Release creation is refused for the same reason.** Run 39351991489, after #389 reduced the
   workflow to a read-only `git ls-remote` precheck plus fetch: the tag check passed, then
   `gh release create` returned the same 403.

The conclusion is a property of the repository, not of the workflow: with `default_workflow_permissions:
read`, no step can write through the API. The tag was therefore created with a maintainer credential,
and the canonical scripts (`cut` → `check-release-assets` → `publish --dry-run` → `publish`) were run
locally against a detached worktree at `c83f8e4c`, which is the same code path the workflow invokes.
The workflow keeps the repeatable, verified path for the bundle build, the asset check and the tag
check; only its create-release/upload steps remain unproven in CI.

### What remains

- A PAT with `contents:write`, stored as a repository secret, is the only way to make publishing fully
  unattended. That is a maintainer authorisation decision.
- The pantheon-ops lock still pins v0.13.0; advancing it is a consumer-repository change.
- `rebuild:from-base` has still not been run against v0.16.1.
