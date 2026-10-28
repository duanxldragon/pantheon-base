# Review — S4 alias removal `2026-10-27-s4-re-export-alias-removal`

Reviewed against branch `refactor/s4-re-export-alias-removal-2026-10-27`
(base = merged #446). Each packet posture item is answered with the artefact
that settles it.

## Posture, item by item

| Item | Reading |
|---|---|
| Exactly the ten zero-consumer aliases removed; the eight consumed aliases untouched | The diff touches only `re_export.go`; per-symbol counts in [reference-search.md](reference-search.md) show the kept eight at ≥1 qualified reference in both repos and the removed ten at 0/0 — fresh re-measurement, not copied from the S4 doc (kept counts drifted ±1 file with the merged tenant waves; all zeros unchanged). |
| Re-run of the per-symbol search is recorded in evidence | [reference-search.md](reference-search.md), same口径 as the S4 decision (`common\.<Sym>\b`, base excluding re_export.go, ops overlay included). |
| Equivalence proven | Base backend `go build ./...` + `go vet ./pkg/common/...` clean; pantheon-ops/backend `go build ./...` clean; full base suite with DSN recorded in commands.json. The aliases were declaration-form re-exports (no wrapper logic), so compilation + suite is the complete equivalence proof the packet asks for. |
| Underlying functions untouched | `pkg/common/http/**` and `pkg/common/security/**` are not in the diff (`doNotTouch` honored); `frontend/src/index.ts` untouched. |
| No false-negative consumer surfaced | Build of both modules would fail on any missed qualified reference; none did. Dot-imports/reflection would not reference `common.<Sym>` anyway, and none exist for these symbols (the S4 measurement's bare-name column shows the underlying functions are used via `commonhttp.`/`security.` direct imports). |

## Notes

- `net/http` import removed with the cookie functions — the only users of
  `http.ResponseWriter` in this file.
- Quality profile: the packet declared `none`; corrected to `auth-security`
  in this PR (CI rejects `none` for non-trivial changes; the deleted surface
  is the security/cookie helper re-export group). Same correction pattern as
  W5 (`ui-runtime`) and W8 (`auth-security`).
- No human gate (`humanGates: []`); the S4 decision wave already carried the
  maintainer-delegated authorization for this follow-up packet.

## Machine Readable

```json
{
  "taskId": "2026-10-27-s4-re-export-alias-removal",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s4-re-export-alias-removal/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s4-re-export-alias-removal/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s4-re-export-alias-removal/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/reviews/GOVERNANCE_SURFACE_DECISIONS_2026-10-27.md",
      "docs/reviews/REDUNDANT_CODE_CANDIDATES.md"
    ]
  }
}
```
