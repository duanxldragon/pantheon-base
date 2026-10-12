# Review — 2026-10-12-v0161-release-cut

## Verdict

Accepted as a release-cut task packet. The change is bookkeeping plus one dispatch-only workflow; it
touches no product source and relaxes no gate. Its distinguishing decision — publishing the four
assets instead of mirroring v0.16.0's asset-less shape — is the one that makes the release usable by
the consumer at all.

## What was actually executed here (versus argued)

Executed here:

- `git log 3fe572f3..origin/main` — exactly two commits since v0.16.0, nothing unaccounted for.
- The **Release Gate precondition**: `Release Gate Summary: completed/success` on `1dc2976b`,
  read from the check-runs API.
- **sharedPaths equivalence**: a v0.16.1 manifest generated through the real
  `build-release-manifest.mjs` (which does not spawn, so it runs here) diffs to zero against both the
  ops lock and the committed v0.13.0 manifest — 52 entries either way.
- **All six overlay anchors** resolve exactly once against the v0.16.1 base tree.
- The EBUSY constraint, probed directly and re-probed with the sandbox disabled.
- `check:duplication` (PASS), `check:task-packet`, `check:evidence --strict`,
  `check:failure-registry`, `check-pr-governance` (all PASS).
- YAML parse + SHA-pinning + run-block-injection assertions over the three release workflows.

Argued from evidence rather than reproduced locally:

- **The release itself.** Node cannot spawn `git`/`tar`/`gh` here, so neither `cut` nor `publish` can
  run. The workflow is delivered and verified statically; the hosted run is the authoritative
  verification.
- **The consumer rebuild.** `rebuild:from-base` needs the same subprocesses. The anchor check is a
  text-level substitute for the most likely failure mode.
- The Release Gate result is read from the GitHub API, which is the authoritative record, rather than
  reproduced.

## Reviewer checklist

- [x] The version decision is grounded in the guide (§2.4 patch for behaviour-preserving bug fixes),
      not in convenience.
- [x] The claim "no consumer-facing interface changed" is checkable: the two commits are a
      test-visible race fix and a CI gate; no route, permission code, menu seed, i18n key or contract
      shape moved.
- [x] The release publishes the **complete** four-asset set, which is what makes it consumable.
- [x] `sharedPaths` is asserted identical to the consumer's declaration rather than assumed.
- [x] The six overlay anchors — the most plausible way this release breaks the consumer — are checked
      individually.
- [x] `foundation-release-cut.yml` keeps every dispatch input out of `run:` interpolation; the
      previous PR was failed by SonarCloud for exactly that (`githubactions:S7630`).
- [x] The workflow is SHA-pinned and least-privilege (`contents: read` at workflow level,
      `contents: write` scoped to the single job that must push a tag).
- [x] `dry_run` defaults to `true`, so an accidental dispatch is inert.
- [x] No existing gate file is modified: `release-gate.yml`, `foundation-release-verify.yml`,
      `foundation-release-backfill.yml` and `.sonarcloud.properties` are untouched.
- [x] The gitignored `releases/<version>/` and `dist/` outputs are not committed.
- [x] Evidence distinguishes what ran (`passed`) from what did not (`not-run`) instead of presenting
      the whole change as verified.

## Points a reviewer should challenge

1. **Why is this a patch and not a minor, given it changes release infrastructure?** Because §2.3
   minor is about capability at module level — new modules, new shared components, architectural
   optimisation. Adding a gate that closes an existing gap, and cutting a release, is neither. §2.4
   patch covers behaviour-preserving bug fixes, which is what #377 is.
2. **Does publishing assets contradict the v0.16.0 closeout?** Yes, deliberately. That packet chose to
   mirror v0.15.0's asset-less release; that choice is precisely why the consumer lock is stuck three
   minor versions back. A release without assets is not a weaker release, it is an unusable one. This
   is recorded as a reversal rather than presented as consistency.
3. **Why add a third release workflow instead of extending the backfill one?** They answer different
   questions. Backfill repairs a release that was already published without assets; cut creates a new
   release. Merging them would mean one workflow whose behaviour depends on whether the release
   happens to exist.
4. **Is `gh auth setup-git` a credential-persistence smell?** It was chosen *instead of*
   `persist-credentials: true`, which every other workflow in this repository avoids. It points git at
   the gh credential helper for the job only, so the checkout still does not persist credentials.
5. **Could the workflow publish from the wrong commit?** `--base-commit` and `--target-commit` are
   passed the same resolved SHA, and `validatePublishCandidate` rejects a manifest whose `baseCommit`
   differs from the target. The Release Gate check is then read against that same SHA.
6. **What if `releases/<version>/` were tracked?** Then `cut` would dirty the worktree and `publish`
   would refuse. Verified that `.gitignore`'s `releases/*/` covers it; only v0.13.0 is deliberately
   un-ignored.

## Residual risk accepted

- The release is not yet cut; the dispatch must follow the merge because `workflow_dispatch` requires
  the workflow on the default branch. Recorded as `not-run`, not as passed.
- The bundle build and the consumer rebuild cannot run on this host for the EBUSY reason. Static
  verification covers the manifest, the shared paths and the overlay anchors — not the archive bytes
  or the full assembly.
- The new workflow has never been exercised; its first run is the post-merge dry-run.
- Neither release check is a required check, so until a maintainer adds them, a broken release fails
  loudly but does not block.

## Addendum — the first hosted run failed, and why that was predictable

The first dispatch (run `38217014119`) failed after 7 seconds, before anything immutable was created:

```
##[error]Missing or empty .harness/evidence/2026-10-12-v0161-release-cut/notes/release-notes.md
```

The file is committed and present. The defect was step order: `Validate inputs` was the job's first
step, so it ran **before** `Checkout default branch` and inspected an empty runner workspace. The
check itself is correct — it exists so a wrong `notes_dir` fails fast — but it cannot run before the
tree exists. The fix moves it directly after the checkout and before `Setup Node`, which keeps the
fail-fast property while giving it a tree to read.

This is worth recording as a verification lesson rather than a footnote. The pre-dispatch validation
covered YAML validity, trigger shape, SHA pins, least-privilege permissions and the
`githubactions:S7630` injection surface — everything except the ordering of steps relative to the
checkout. That is a blind spot specific to dispatch-only workflows: unlike a PR-triggered workflow,
nothing exercises them until someone dispatches them, so a purely structural review can be complete
and still miss a run-order bug. `.tmp/validate-workflow.py` now asserts the ordering explicitly
(`Checkout` at index 0 precedes `Validate inputs` at index 1), and the general rule is that a
dispatch-only workflow's first hosted run is part of its verification, not a formality to be assumed.

No tag, release or asset was created by the failed run, so the release identity (`pantheon-base-v0.16.1`
on `c83f8e4c`) is unaffected and the retry reuses it unchanged.

