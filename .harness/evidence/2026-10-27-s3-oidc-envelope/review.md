# Review — `2026-10-27-s3-oidc-envelope`

Reviewed against the working tree (base `a053805b`). Measured diff:
`backend/modules/auth/oidc/handler.go` **+13 / −0**, comments only, plus the
classification documents. Every path is inside the packet's `expectedFiles`;
`doNotTouch` (`frontend/src/modules/auth/**`,
`backend/pkg/common/http/response.go`, the tenant handler) is untouched.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Each classification is checked against the spec, not intuition | The only protocol element is the 302 (RFC 6749 §4.1.1). Callback errors on the IdP side are redirect query params (§4.1.2.1), so no IdP reads responses #2/#3. #1 is the RP's own browser entry; #4–#6 are app payloads. No row claims protocol status for a JSON body. |
| Every surviving raw response has a contract comment | `grep -n c.JSON` yields six sites (31, 52, 62, 73, 100, 107); each has an adjacent comment naming the contract or the condition for moving it. |
| OIDC login still works, or the gap is recorded | The module is not mounted and no IdP exists; a round-trip is impossible. The gap is recorded in `commands.json → runtimeGap` and carried to the SSO packet. |
| No response body/status/field changed | Diff is +13/−0 insertions of comments; bodies, statuses and field names are byte-identical. `go build ./...` and `go test ./modules/auth/...` pass. |

## Rationale for default-keep

- The packet's default is keep; a wave that documents why is a successful wave.
- The module is dormant (0 references outside its package), so there is no live
  consumer to protect or migrate.
- The future migration boundary is now explicit: #4 moves with session
  integration and its consumer; #5/#6 move with their SPA consumer; #1–#3 stay
  browser-facing and raw.

## Findings

- **P3, runtime gap**: no IdP and no route registration → no round-trip. Owned
  by the SSO integration packet; recorded rather than simulated.
- **P3, interim payload**: response #4 returns user data before a session exists.
  It is intentionally left as-is; changing it now would either invent a session
  contract or create a half-migration.

## Machine Readable

```json
{
  "taskId": "2026-10-27-s3-oidc-envelope",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/modules/auth/oidc/handler.go"
    ],
    "checks": ["sensitive-flow"],
    "findings": [
      "P3 runtime gap: no IdP is configured and the handlers are unmounted, so the login round-trip cannot run; owned by the future SSO packet.",
      "P3 interim payload: callback success (#4) returns user data before session integration; left as-is deliberately with the migration boundary recorded."
    ],
    "notes": "This is a classification-first wave: the six raw JSON responses were compared against RFC 6749 §4.1.1/§4.1.2.1 and their actual consumers. None is a protocol JSON body, and the module is dormant (0 references outside its package), so all six stay raw and each gains a comment naming its contract or the condition for moving onto the common envelope. The diff is comments only (+13/-0); build and auth tests are green. The only gap is runtime: with no IdP configured and no route mounted, a login round-trip is impossible and is recorded instead of simulated."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s3-oidc-envelope/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s3-oidc-envelope/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s3-oidc-envelope/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/contracts/SYSTEM_AUTH_CONTRACT.md"
    ]
  }
}
```
