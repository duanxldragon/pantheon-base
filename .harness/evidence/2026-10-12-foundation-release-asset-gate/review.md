# Review — 2026-10-12-foundation-release-asset-gate

## Verdict

Accepted. The failure was a missing sensor, not a broken mechanism: the publish scripts were correct
and were never run, and no check observed the published outcome. The change adds that check, wires it
to the event that matters, and provides a reviewed path to repair the releases already broken.

## What was actually executed on this host (versus argued)

Executed here:

- The gate against real GitHub releases: `v0.13.0` passes (exit 0, four assets listed, both local
  archive checksums validated); `v0.16.0` fails (exit 1, four assets reported missing); a bare `0.16.0`
  is rejected.
- The new unit tests, 21/21, hermetic — no network and no subprocess.
- `check:duplication` (PASS) and `check:failure-registry`.
- YAML parsing plus a SHA-pinning assertion over both new workflow files.
- Static backfill feasibility: manifest generated at commit `3fe572f3`, all 52 sharedPaths present.

Argued from evidence rather than reproduced locally:

- **The bundle rebuild was not executed.** `build-release-bundle.mjs` shells out to git and this host
  cannot spawn subprocesses (`EBUSY` for git, node and echo alike). Feasibility rests on the manifest
  building successfully and on 52/52 sharedPaths existing at the release commit.
- **Neither workflow has run in GitHub Actions.** `release: published` only fires on the default
  branch, so the verify workflow's first run is post-merge.
- The asset inventory across releases comes from the GitHub API, which is the authoritative record for
  what a release actually carries.

## Reviewer checklist

- [x] The gate fails closed: a missing asset, a missing checksum sidecar, a checksum mismatch, an
      absent local bundle and a non-existent release all return non-zero.
- [x] The gate reuses `validateReleaseAssetChecksum` from the publish path rather than reimplementing
      checksum semantics, so the two cannot drift.
- [x] The expected asset set is not invented here: it matches `releaseArtifact`/`repoSnapshot` already
      declared in the ops lock and the four assets `v0.13.0` actually published.
- [x] `--local-only` never contacts GitHub, asserted by a fetch spy that must not be called.
- [x] `--local-only` combined with `--skip-local` is rejected rather than silently resolving to one.
- [x] Unexpected errors (HTTP 500) are rethrown, not converted into a gate failure — a broken `gh` or a
      missing token must not read as "release is fine" or as "release is broken".
- [x] The `--wait` retry exists because `gh release create` precedes `gh release upload`; without it the
      verify workflow would race its own publisher.
- [x] Both workflows pin actions by commit SHA and use least privilege (`contents: read` for verify,
      `contents: write` scoped to the backfill job only).
- [x] The backfill defaults to `dry_run: true` and is `workflow_dispatch`-only, so nothing writes to a
      published release without a deliberate second dispatch.
- [x] No existing release script, workflow job, backend or frontend file was modified.
- [x] The failure registry entry uses only valid enums and records the true occurrence count (3).

## Points a reviewer should challenge

1. **Is a new workflow the right home, or should this have gone into `release-gate.yml`?** The Release
   Gate runs *before* tagging, when no release exists, so an asset check there would be meaningless.
   The asset state only exists after publication, which is why the sensor belongs on
   `release: published`. The two are complementary: the Release Gate gates the decision to publish, the
   new workflow gates the outcome of publishing.
2. **Should the new check be a required check?** It should, and that is deliberately left to a
   maintainer: branch protection is not editable from a pull request. Until then the failure is loud
   but not blocking, which is recorded as a residual risk rather than silently assumed away.
3. **Why is the backfill a workflow and not a documented local procedure?** Because this host cannot run
   it, and more fundamentally because a 50 MB artifact build belongs in CI where the toolchain and the
   git history are guaranteed, not on a laptop. Making it dispatchable also makes the repair auditable.
4. **Does the gate duplicate what `publish-foundation-release.mjs` already validates?** It validates at
   *build* time, before upload, from the local filesystem. The gate validates the *published* state from
   the release API. The three broken releases prove those are different questions.
5. **Is `runtime-evidence-gap` the right failure class?** Yes: the release's runtime artifact state had
   no evidence at all. The category is `runtime-quality`, the harness change is a `gate`, and the
   promotion decision is `gate-updated`.
6. **Could the gate pass on a release whose bundle is wrong but present?** Yes — it checks presence and
   checksum, not content-vs-manifest. That boundary is recorded; content validation already happens at
   build time in `validateBundleSource`.

## Post-open review finding (SonarCloud)

Opening the PR surfaced one real defect that no local gate had caught. It is recorded here rather than
folded away:

- Hosted SonarCloud failed the PR quality gate (`new_security_rating` 5 against a threshold of 1) with
  five BLOCKER `githubactions:S7630` findings, all in `foundation-release-backfill.yml` (lines 94, 95,
  96, 101 and 124). Each was a workflow input interpolated directly into a `run:` block.
- The quotes were not protection: GitHub expands `${{ ... }}` before the shell parses the line, so an
  input containing a double quote or `$( )` escapes the quoting. A reviewer should treat "it is quoted"
  as insufficient for workflow inputs.
- Fixed by reading every input through a job-level `env:` block and referencing shell variables, which is
  the pattern the workflow's own *Validate inputs* step already used. The dynamic `working-directory` on
  the upload step was replaced with a `dist=` variable so no path is built from an expression either, and
  a `release_line` format check was added.
- The repository's own **Workflow Security** job passed on the same revision and `actionlint` was not
  installable on this host, so SonarCloud was the only signal that caught this. That is itself a finding
  about the local gate set and is recorded in `knownGaps`.
- The local re-validation after the fix is a Python assertion over the YAML, not the Sonar rule engine, so
  the authoritative confirmation is the SonarCloud re-run against the pushed commit.

## Residual risk accepted

- The two workflows have never executed; their first hosted runs are post-merge, and
  `workflow_dispatch`-only paths are only exercised when someone dispatches them.
- The check is not yet required, so a broken release goes red without blocking.
- `v0.14.0`, `v0.15.0` and `v0.16.0` remain asset-less until the backfill is deliberately dispatched.
- Spawn-dependent repository gates (`check:structure`, 17 pre-existing release tests) cannot run on this
  host; they remain CI-only signals for this change.
- The PR's SonarCloud security rating depends on the hosted re-analysis of the pushed fix; the local
  re-validation cannot reproduce the `githubactions:S7630` rule.


## Machine Readable

```json
{
  "taskId": "2026-10-12-foundation-release-asset-gate",
  "verdict": "approved with documented P2 follow-up",
  "verdictRationale": "Accepted: the failure was a missing sensor; the gate is added and wired, with residual risk recorded rather than assumed away.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-12-foundation-release-asset-gate/manifest.json",
    "evidence": ".harness/evidence/2026-10-12-foundation-release-asset-gate/commands.json",
    "reviewFile": ".harness/evidence/2026-10-12-foundation-release-asset-gate/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-12-foundation-release-asset-gate.task.md"
    ]
  }
}
```

> This block was backfilled on 2026-10-26 during the governance-schema repair round. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
