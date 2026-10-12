# Summary — 2026-10-12-foundation-release-asset-gate

A foundation release is only consumable through its published artifacts. Three consecutive releases
were published without any, and nothing in CI noticed.

## What was actually wrong

`gh release view --json assets` over the recent release line:

| Release | Assets |
| --- | ---: |
| `pantheon-base-v0.16.0` | 0 |
| `pantheon-base-v0.15.0` | 0 |
| `pantheon-base-v0.14.0` | 0 |
| `pantheon-base-v0.13.0` | 4 |
| `pantheon-base-v0.12.1` | 4 |

The artifact channel broke at v0.14.0 and stayed broken. The four assets a working release carries are
`foundation-release-<version>.tgz` (18.2 MB), its `.sha256`, `repo.tar` (30.6 MB) and `repo.tar.sha256`.

This is not cosmetic. `pantheon-ops` materializes a release from exactly those files and verifies both
by SHA-256. Its lock is pinned to `pantheon-base-v0.13.0` and `.foundation/releases/` stops there —
**the last version that still had artifacts**. A lock cannot be advanced to a version that has nothing
to materialize, so the missing assets are the direct cause of the ops baseline sitting three minor
versions behind, not a coincidence.

## Why nothing caught it

The publish scripts are correct and complete. `package.json` exposes
`release:foundation:bundle|cut|manifest|publish`, and `publish-foundation-release.mjs` does
`gh release create` followed by `gh release upload`. The step was simply **never wired into any
workflow and never run**; releases after v0.13.0 were created by hand.

What CI did run was `npm run test:foundation-release` (`.github/workflows/ci.yml:186`) — unit tests of
the release *scripts*. A green run of that job says nothing about whether a release carries its
artifacts. Three broken releases produced zero signal.

`release-gate.yml` makes the gap explicit: its own header calls it "the single hard checkpoint that
must pass before `pantheon-base-vX.Y.Z` is tagged and the release bundle is published", yet no job in
the file observes the published bundle. The documented contract and the implemented gate disagreed,
and nothing tested the disagreement.

## What was added

**`scripts/foundation-release/check-release-assets.mjs`** — verifies a release carries its complete,
checksum-consistent artifact set.

- Reuses `validateReleaseAssetChecksum` and `isMissingGitHubReleaseError`, both already exported by
  `publish-foundation-release.mjs`, so the checksum semantics are the *publish path's* semantics
  rather than a second implementation that can drift.
- `--dist` verifies a locally built bundle before upload; `--local-only` does so without touching the
  network; `--wait` polls, because `gh release create` runs before `gh release upload` and the
  `published` event can fire mid-upload.
- The CLI is exposed as `runCheckCli` so the wiring is testable without spawning a process — which
  matters here, see the runtime gap below.

**`.github/workflows/foundation-release-verify.yml`** — runs the gate on `release: published` and on
dispatch. This is the sensor that was missing: the state now goes red immediately instead of being
discovered weeks later by a consumer.

**`.github/workflows/foundation-release-backfill.yml`** — dispatch-only, `dry_run: true` by default,
rebuilds the bundle from the release commit and uploads the four assets. It checks out the release
commit for the build (because `build-release-bundle.mjs` validates that the worktree's shared paths
match the manifest's `baseCommit`) and the default branch for the gate (because the gate did not exist
in earlier releases).

## Verification

- **21/21 unit tests pass**, hermetically: no network, no subprocess. They cover the complete set, each
  missing asset, tampered checksums, a missing checksum sidecar, an absent bundle, local-only (asserted
  by a fetch spy that must *not* be called), the contradictory local-only + skip-local combination, the
  release-not-found path, the publish-in-flight retry, and unexpected errors being rethrown rather than
  reported as a gate failure.
- **Positive control**: `pantheon-base-v0.13.0` passes, exit 0, listing all four assets and validating
  both local archive checksums.
- **Negative control**: `pantheon-base-v0.16.0` fails, exit 1, listing all four as missing — the state
  that previously produced no signal.
- **Argument validation**: a bare `0.16.0` is rejected, so the gate cannot be pointed at a non-release
  and silently pass.
- `check:duplication` still **PASS**: the new script reuses the existing exported validators rather than
  copying them. This was a design constraint — copying `runCommand`/`parseRepoParts`/`resolveRepoFullName`
  would have been a ~41-line contiguous duplicate, above the 21-line detection floor.
- Both new workflows parse as YAML, pin every action by commit SHA, and declare least-privilege
  permissions.

## Backfill feasibility (verified statically, not executed)

Checking out the v0.16.0 release commit `3fe572f3244070ab14e304bc075017f20e86e9cd` and running that era's
`build-release-manifest.mjs` produces a valid manifest whose **52 sharedPaths (backend 4, frontend 46,
docs 2) all exist at that commit**. Since `copyEntry` throws on a missing shared path, that was the
precondition that could have failed the rebuild; it does not. The rebuild would therefore succeed.

## Runtime gap — recorded, not papered over

**Node cannot spawn subprocesses on this host.** `spawnSync` returns `status: null` with
`error.code: EBUSY` for `git`, for `node`, and even for `echo`. Consequences:

- `build-release-bundle.mjs` shells out to `git rev-parse` and `git archive`, so **the rebuild could not
  be executed here**; the backfill is delivered as a CI workflow and verified statically instead.
- The same limitation already fails **17 of the 40 pre-existing** foundation-release tests on this
  machine, on files this change does not touch — environmental, not a regression.
- The new gate's tests were therefore written **without spawning**, and the CLI is covered through
  `runCheckCli` rather than a child process, so they genuinely run here.
- `check:structure` also fails locally with `spawnSync git EBUSY`. Hosted CI on `ubuntu-latest` is the
  authoritative environment for the spawn-dependent gates and for the two new workflows.

## Files changed

| File | Change |
| --- | --- |
| `scripts/foundation-release/check-release-assets.mjs` | New gate |
| `tests/scripts/foundation-release/check-release-assets.test.mjs` | New hermetic tests (21 cases) |
| `package.json` | New `check:release-assets` script |
| `.github/workflows/foundation-release-verify.yml` | New: gate on `release: published` |
| `.github/workflows/foundation-release-backfill.yml` | New: dispatch-only repair, dry-run by default |
| `docs/harness/failure-registry.md` | FR-014 registered |

## Residual risk

- Neither workflow has run on GitHub Actions yet; `release: published` only fires on the default branch,
  so the verify workflow's first run is post-merge.
- The new check is not a required check. A release published without assets will go red but will not
  block until a maintainer adds it to branch protection.
- Repairing v0.14.0/v0.15.0/v0.16.0 is deliberately **not** part of this change.
- The gate asserts presence and checksum of the four assets; it does not re-verify that the bundle's
  contents match the manifest's sharedPaths, which the build already validates.
