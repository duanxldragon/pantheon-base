# Review — `2026-10-29-v0180-simplification-release`

Reviewed the release branch `chore/foundation-release-v0.18.0` against `main` @ `f6bbc1cd`. The
question is not "does the version string look right" — that is a grep — but "is this the honest
version level, and does the package avoid touching anything it claims not to touch".

## Reviewer posture, item by item

| Posture item | Reading |
| --- | --- |
| Version level matches the guide | `docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 puts "架构优化（不影响消费仓）" and "治理增强" in minor. The thirteen waves are the first, the release-notes directory, monthly harness archive and FR-018–FR-020 are the second, and the batch additionally carries tenant behaviour changes (W1/W2/W4/W8). A patch number would undersell a login/switch gate change; 0.18.0 is the smallest level that is true. |
| The batch is what the notes claim | `git log e256d1fb..f6bbc1cd` returns 34 commits and every item in the notes maps to one of them. No item in the notes exists only in prose. |
| No product source in this diff | `git status` shows `VERSION`, `CHANGELOG.md`, two release-note indexes, one new release-notes file, `.harness/STATUS.md`, the task packet, the manifest and the evidence directory. `backend/**` and `frontend/**` are untouched. |
| The structural claims are re-measured, not copied | `ParseUint` 2, inline `Offset` 4, `tenantOwnerID` 0, `errParamInvalid` 0, backend production Go 52,332 lines — all re-run at `f6bbc1cd`, not quoted from the closeout packet. |
| The LOC caveat survives into every reader | The release notes, the upgrade notes and the summary all state that the window contains net-additive tenant work and is a lower bound. None of them presents it as the programme's gain. |
| The tenant behaviour changes are named, not buried | The upgrade notes list the archive guard, the member-integrity rejection and the issuance gate as "behaviour changes worth knowing", each with the error code or the endpoint a consumer would hit. |
| Publication is not claimed before it happens | The manifest stays `in-progress`; the packet's last two boxes stay unchecked; the review records publication as the post-merge step. A package that ticked them now would be asserting a tag that does not exist. |
| Nothing weakened to make this green | No checker, workflow or gate file is edited. `check:task-packet` still warns on a missing review file, and the two recommended Linkage items are filled with `none` rather than silenced. |

## Findings

- **P2, the release level is a judgement, not a measurement.** Both 0.17.9 (patch: bug fixes and a
  refactor) and 0.18.0 (minor: architecture optimisation and governance enhancement) are defensible
  against §2.3, and the guide's examples do not settle the tie. It is recorded with its reasoning in
  the packet, the manifest and the release notes so the maintainer can re-level it at acceptance
  without re-deriving the argument.
- **P2, publication depends on a human-held credential.** The tag and the GitHub release are created
  by the maintainer's `gh` session because `default_workflow_permissions` is read; the release body
  and the four assets are otherwise built entirely by scripts. If the credential is absent the
  package still merges, and the release is the outstanding step rather than a failed one.
- **P3, the network is flaky on this workstation.** `github.com:443` times out intermittently while
  `api.github.com` answers; the first `git fetch` needed five retries. Recorded because a retried
  release script could otherwise look like a script defect.
- **P3, `pantheon-ops` is not committed here.** Its lock bump and rebuild are run and recorded, but
  the consumer repository's diff is left for that repository's own review.

## Machine Readable

```json
{
  "taskId": "2026-10-29-v0180-simplification-release",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "VERSION",
      "CHANGELOG.md",
      "docs/release-notes/RELEASE_NOTES_v0.18.0.md",
      "docs/release-notes/README.md",
      "docs/release-notes/README.en.md",
      ".harness/STATUS.md",
      "docs/harness/tasks/2026-10-29-v0180-simplification-release.task.md",
      ".harness/tasks/2026-10-29-v0180-simplification-release/manifest.json",
      ".harness/evidence/2026-10-29-v0180-simplification-release/"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2 version level: 0.18.0 (minor) versus 0.17.9 (patch) is a judgement against VERSION_MANAGEMENT_GUIDE section 2.3; recorded with its reasoning so the maintainer can re-level at acceptance.",
      "P2 publication credential: the tag and GitHub release are created by the maintainer gh session because default_workflow_permissions is read; the release is the post-merge step, not part of this diff.",
      "P3 network: github.com:443 times out intermittently on this workstation while api.github.com answers; git operations were retried rather than reworked.",
      "P3 consumer commit: pantheon-ops lock advancement and rebuild are run and recorded but left for that repository's review."
    ],
    "notes": "Release package only: VERSION 0.18.0, a CHANGELOG entry, docs/release-notes/RELEASE_NOTES_v0.18.0.md with both indexes moved to the latest pointer, a STATUS section, and the task packet, manifest and evidence with the three notes files the publish script requires. No product source, migration, workflow or gate file is touched. The release covers every commit since v0.17.8: thirteen simplification waves, tenant waves W1-W8, plan-ladder decision A, go-jose v4, the release-notes directory move and the harness archive. Structural metrics were re-measured at the release commit (ParseUint 2, inline Offset 4, tenantOwnerID 0, errParamInvalid 0, 52,332 backend production Go lines) and the LOC caveat is repeated in all three notes files."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-29-v0180-simplification-release/manifest.json",
    "evidence": ".harness/evidence/2026-10-29-v0180-simplification-release/commands.json",
    "reviewFile": ".harness/evidence/2026-10-29-v0180-simplification-release/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/VERSION_MANAGEMENT_GUIDE.md",
      "docs/designs/FOUNDATION_RELEASE_MODEL.md",
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md"
    ]
  }
}
```
