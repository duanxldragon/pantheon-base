# Review — S1 `2026-10-27-s1-dead-code-removal`（删死码）

Reviewed against the working tree on branch `refactor/s1-dead-code-removal-2026-10-27`
(base `main b13e6b77`). Measured diff: **19 files, +0 / −1923**. The reviewer posture from the
packet has four items; each is answered with its artefact.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Each deletion carries a fresh five-location search result | [reference-search.md](reference-search.md) records the re-run at implementation time for every RC symbol (backend source+tests, frontend, scripts/CI, `pantheon-ops`), each with 0 live references. The compile check doubles as the authoritative proof: `go build ./...` green in both repos after deletion. |
| No test file was edited | `git diff --stat` lists 19 files; the only `_test.go`-adjacent entries are none — the four modified files are `error.go`, `cookie.go`, `redis.go`, `request.ts`; the other 15 are whole-file deletions. No `*_test.go` path appears in the diff. |
| cookie.go still compiles with its private TTL defaults | The private `accessTokenTTL` / `refreshTokenTTL` vars remain (read on every token issuance); only the exported override `SetTokenTTL` was removed. `go build` + `go vet` green. |
| The frontend build still resolves every remaining import | `npx tsc -b`, `npm run build` (736ms), `npm run lint` all exit 0. `isForbiddenRequestError` was never re-exported from `frontend/src/index.ts` (verified by search before deletion), so the stable downstream barrel contract is byte-identical. |

## Equivalence argument (per call site — there are none)

This wave has no call-site migrations: every deleted symbol had zero callers, so there is no
behaviour to preserve beyond "the compiler and the suite still agree". The five-location search
plus the two-repo build plus the full suite is the complete equivalence proof for a pure
deletion. `git diff` shows 0 insertions — nothing was rewritten, replaced, or abstracted.

## Human gate disposition

The packet gates the ten `capture-*.mjs` deletions on a maintainer answer. Auto-mode delegated
resolution, recorded for review: script headers self-identify as one-off evidence writers for
dated 2026-07/08 audits; the browser walkthrough vehicle since v0.17.1 is the smoke suite; zero
references anywhere. The gate's own text anticipates this shape ("the rest of the wave does not
depend on that answer and can land separately if needed") — landing it in one commit keeps the
revert path atomic: one `git revert` restores all ten scripts if the maintainer disagrees.

## What the wave refused to do

- No replacement helper (packet forbids it; the supported path in `pkg/authtoken` /
  `pkg/common/http` already exists).
- `pkg/authtoken/**` untouched even though `SetTokenTTL` there may now be orphaned — recorded
  as a knownGap, candidate for a later narrowing wave rather than silent in-scope deletion.
- No test weakened, no assertion touched, no doc rewritten (audit docs keep their historical
  statements; the programme closeout will reconcile the RC ledger).

## Verdict

Pure deletion, one commit per concern (backend packages, scripts, frontend symbol), verified in
both repos. Ready to merge.

> Added 2026-10-28: the Machine Readable block below retro-fits this already-merged review to the
> strict `check-review.mjs` contract. This closes the debt registered in `.harness/STATUS.md`
> (merged evidence predating the strict checker); the verdict matches the prose verdict above.

## Machine Readable

```json
{
  "taskId": "2026-10-27-s1-dead-code-removal",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s1-dead-code-removal/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s1-dead-code-removal/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s1-dead-code-removal/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md"
    ]
  }
}
```
