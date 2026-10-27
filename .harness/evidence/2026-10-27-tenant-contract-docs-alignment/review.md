# Review — W5 `2026-10-27-tenant-contract-docs-alignment`（契约/API 文档/前端类型/设计文档对齐已交付面）

Reviewed against branch `docs/tenant-contract-alignment-w5-2026-10-27`
(stacked on the W4 branch at `74a04c50`). Docs wave: zero runtime changes,
`backend/**` untouched (manifest doNotTouch held). Each `reviewerPosture`
item from the manifest is answered with the artefact that settles it;
per-claim rationale is in [doc-diff.md](doc-diff.md).

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Spot-check every edited example against a real handler response | Create → `common.Success(c, row)` (data = the created row); Update/Delete/AddMember → `common.Success(c, gin.H{})` (data = `{}`); envelope shape `{"code":200,"data":...,"message":"success"}` from `pkg/common/http/response.go:31-37`. The four rewritten examples in TENANT_API.md §1/§4/§5/§6 match these payloads field for field. Live capture is recorded not-run (no backend this session) under the manifest's not-run clause. |
| Confirm no documented route is absent from system_modules.go | After the edit, `rg "members/page"` hits only the explicit "no /members/page variant exists" sentence in TENANT_API.md and the unregistered legacy `tenant_routes.go:25`; production registration (`system_modules.go:290-306`) has zero hits. No other route paragraph was touched, so nothing newly documented can be unmounted. |
| Confirm the type union matches every value the UI sends | The status Select offers exactly `active`/`disabled` (TenantMemberList.tsx Select.Option values); the backend binding is `oneof=active disabled` (`tenant_ops_view.go:330`). The union `'active' | 'disabled'` now agrees with both ends; `'removed'` matched nothing anywhere. Runtime send values unchanged (type-only edit; tsc clean without any event-boundary cast). |
| Confirm the design banner names the binding contract | MULTI_TENANT_DESIGN.md Status line now reads "Vision document — not a V1 commitment", names TENANT_CONTRACT_V1.md §1 as the binding scope, lists the four out-of-V1 items (subdomains, custom domains, branding, public self-registration), and keeps all exploratory content (nothing deleted). |
| Confirm the contract change is a clarification, not a scope change | §2.2: the owner-transfer sentence now describes the shipped two-step path (add owner → remove owner, `ensureNotLastOwner` guard) and states no single endpoint exists — no endpoint added, no invariant rewritten. §5: two rows registered for behaviour already shipped and tested in W2 (PR #434): `user.not_found` (404), `tenant.member_exists` (400), plus the tombstone-first note. Changelog V1.8 declares itself additive ("不改变任何不变量 / In-Out 边界"). V1.6 (W1) and V1.7 (W4) were already registered in prior waves. |

## Fact-checks run during review

- The manifest's premise held: tenant_routes.go (with `/members/page`) has no
  production caller — production wiring constructs `PlatformHandler` and mounts
  routes inline in system_modules.go. The doc now says exactly that instead of
  promising a live alias.
- Cast removal is safe end to end: `MemberQueryState.status` is now the same
  union as `MemberUsageQuery.status`, so the loadData assignment type-checks
  bare. The role field keeps its loose string + cast (manifest names only
  status).
- No dangling anchors after the alias deletion: check-doc-links --strict and
  check-doc-inventory --strict both 0 findings.
- Packet checker: 66 files, 0 errors.

## Governance notes

- **Human gate (contract revision note)**: resolved as maintainer-delegated —
  V1.8 is additive (owner-transfer wording + two W2 error-code registrations)
  and explicitly changes no invariant or In/Out boundary. Open for maintainer
  review in the PR.
- **No `solo-override`** is used; the PR carries the governance body and rides
  the normal Quality Gates.
- Wave sequence: W3 (#440) → W4 (#442) → W5 (this PR) → W6/W7/W8 unlocked.

## Machine Readable

```json
{
  "taskId": "2026-10-27-tenant-contract-docs-alignment",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-tenant-contract-docs-alignment/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-tenant-contract-docs-alignment/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-tenant-contract-docs-alignment/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md"
    ]
  }
}
```
