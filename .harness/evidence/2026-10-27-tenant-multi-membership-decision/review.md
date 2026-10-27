# Review — W3 `2026-10-27-tenant-multi-membership-decision`（跨租户成员关系语义决策）

Reviewed against branch `decision/tenant-multi-membership-w3-2026-10-27` (base `d2b95775`).
The packet is a decision packet: the review question is whether every option is honestly
costed, the recommendation is implementable as written, and nothing outside the packet's
`expectedFiles` changed. Each `reviewerPosture` item is answered with the artefact that
settles it.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Every option states what changes, what it fixes and what it breaks | Decision doc §2 gives each of A/B/C: the change list, the contract impact (澄清 vs 重写 vs 修订不变量), the fixed failure case (TC-01 for all three), and at least two newly-introduced failure cases each. A's compatibility-surface behaviour change, B's ownership ambiguity plus the un-scoped `replaceUserRoles` delete (`user_helper.go:88`, re-verified on main d2b95775), and C's capability regression + frozen-invariant amendment are all named. |
| The recommendation names the V1 and V2 packets | §0 names W4 `2026-10-27-tenant-multi-membership-authorization` (implements A) and W5 `2026-10-27-tenant-contract-docs-alignment` (contract/API alignment), both verified to exist as `.harness/tasks/*/manifest.json`. B is registered as a V2 workstream with its hard prerequisite recorded; the packet is deliberately not created in this wave (the W3 out-of-scope list forbids pre-creating empty packets for B/C). |
| No option relies on implicit role mapping | §5 forbids the membership-role → IAM-role mapping explicitly, citing contract §2.2's namespace-separation clause. Option A's design constraints additionally preserve `/auth/current`'s honest reporting by not filtering `ListActiveMemberships` (`pkg/tenant/membership.go:70`), and the platform viewpoint is preserved via `TenantViewpointSwitcher` (TenantSwitcher already hides for platform-capable subjects — verified in the source). |
| Existing-row disposition is stated | §4: keep every legacy cross-tenant row, hide them from login discovery/candidates/switchable via the W4 role-presence predicate, never filter `/auth/current`, no automatic cleanup, and a data-cleanup runbook (if ever wanted) is a separate packet. This is the "leave them and hide them from login — but written down" shape the packet's implementation notes require. |
| No file outside the decision doc + evidence changed | `git diff --stat` against base: the new decision document, this evidence directory, and the manifest status flip — nothing else. `backend/**` and `frontend/src/**` untouched, matching `doNotTouch`. |

## Fact-checks run before signing (all against main `d2b95775`)

- `replaceUserRoles` stamps `system_user_role.tenant_id` from the user's **owning** tenant
  (`lockUserOwningTenantIDTx`, `user_helper.go:83`) and its delete has no tenant predicate
  (`:88`) — the TC-01 mechanism and B's prerequisite both hold.
- `DiscoverDefaultTenant` (`authz.go:159-180`) denies with `ErrTenantForbidden` on more than
  one active membership — the picker really is the only path a multi-membership subject can
  take today, so filtering the three read points (one predicate in `pkg/tenant`) closes the
  whole surface.
- W2's `memberUserExists` deliberately does **not** scope by tenant; its own comment defers
  ownership policy to the cross-tenant waves — option A's AddMember narrowing is genuinely
  still open work, not double-implemented.
- The e2e escape path is real: `tenant-hostile-browser-matrix.spec.ts` constructs the
  cross-membership subject (`:82-92`) and asserts only shell render after picking tenant B
  (`:138-140`).

## Governance notes

- **Human gate (choose A/B/C)**: resolved as a maintainer-delegated decision recorded in
  [decision.md](decision.md), open for maintainer review; the W4 packet's own rule (close
  abandoned and rewrite if the decision is not A) is the safety net if the maintainer
  overrides.
- **Doc-link gate caught a real defect**: the first strict run failed on two links to
  per-wave task docs that do not exist (only the parent program task doc does). Fixed by
  referencing the per-wave manifest paths instead; re-run: 0 findings. Recorded in
  commands.json.
- **No code, contract, or API text changed** — the contract clarification text in §2 option A
  is a proposal for W5, not an amendment made here.

## Machine Readable

```json
{
  "taskId": "2026-10-27-tenant-multi-membership-decision",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-tenant-multi-membership-decision/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-tenant-multi-membership-decision/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-tenant-multi-membership-decision/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
