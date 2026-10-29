# Review — S2 id-parse-migration

Reviewer posture (from the packet): preserve each site's 400 status, error
code, i18n key and message; user's private wrapper delegates or is deleted;
local implementations recorded with reasons; helper does not swallow the parse
error.

## Posture findings

| Posture item | Verdict | Basis |
|--------------|---------|-------|
| 400 bodies preserved | PASS | Pre-change captures (role/tenant/dict/dept) byte-identical to the helper's envelope; every migrated site wrote the same `common.Fail(CodeParamInvalid, "param.invalid")` call the helper makes |
| user's private wrapper | PASS (deleted) | Helper covers it and adds the 400 write; its 2 file-private tests removed with it, recorded in knownGaps; shared tests in pkg/common cover the same inputs and more |
| Local implementations recorded | PASS | Exactly 2 (i18n ×2): `id.invalid` + zero-check cannot be reproduced by the helper's existing parameters — the packet's own scoped exception; post-migration census = exactly those 2 |
| Parse error not swallowed | PASS | Helper returns (0,false) after writing 400; call sites `if !ok { return }` — identical control flow to the inline blocks |
| One commit per file | PASS | 10 commits 065cef6a…ea7b54e7; each package built/vetted/tested before its commit |

## Honest deviations (recorded, none forced)

1. **i18n stays local** — not a deviation from the packet but its explicit
   exception clause; counted and recorded (25 migrated + 2 local = 27).
2. **Packet path drift** — `tenant_handler.go` (deleted in W8), `iam/dept` /
   `iam/post` (actual `org/*`); recorded in knownGaps.
3. **Private-test removal** — the two user tests bound to the deleted wrapper;
   no surviving behaviour lost coverage (shared tests are a superset).
4. **`qualityProfile` flip** — none → auth-security, same CI-required
   correction pattern as all prior waves.

## What this wave refuses to do

- No route/param/method change; no envelope, status, code or key change.
- No generic wrappers or middleware for parameter parsing (scope.out).
- No service-layer ID handling touched.
- Module-local `errParamInvalid`/`msgParamInvalid` consts left in place —
  RC-017's territory.

## Verdict

25 of 27 sites migrated with byte-identical failure bodies, the two
unreproducible sites kept local per the packet's own rule, one dead private
helper deleted. Ready to merge.

## Machine Readable

```json
{
  "taskId": "2026-10-27-s2-id-parse-migration",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s2-id-parse-migration/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s2-id-parse-migration/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s2-id-parse-migration/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/reviews/REDUNDANT_CODE_CANDIDATES.md",
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md"
    ]
  }
}
```
