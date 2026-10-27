# Review — W4 `2026-10-27-tenant-multi-membership-authorization`（无角色 membership 不再授予登录/切换）

Reviewed against branch `fix/tenant-membership-authorization-w4-2026-10-27` (base `321a6384`,
commit `11b2a8fc`). The packet implements W3 decision A. Each `reviewerPosture` item is
answered with the artefact that settles it; red/green differentials are in
[red-run.log](red-run.log) / [green-run.log](green-run.log) and the wire snapshots in
[before-after.md](before-after.md).

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Discovery, candidates and switchable all use the same role-presence predicate | One function: `pkg/tenant.HasRoleBindingInTenant` (`authz.go:162-176`). `DiscoverDefaultTenant` filters through it (`authz.go:200-205`), `ListActiveMembershipsForUser` filters through it in Go (`authz.go`, post-Scan loop) — the first draft's inline SQL `EXISTS` was deliberately refactored out so no second copy of the predicate exists — and `ListSwitchableTenants` filters per item (`login_tenant_switch.go:59-61`). `ListActiveMemberships` (membership.go) stays unfiltered so `/auth/current` keeps reporting honestly. |
| A switch to an empty-role tenant is refused before the session is re-stamped | `SwitchSessionTenant` checks `len(roles) == 0` right after `loadRolesForTenant` and returns `tenant.ErrTenantForbidden` **before** `sess.TenantID = tenantID` / `db.Save` (`session_service.go:227-233`). Red/green: `TestSwitchSessionTenant_RefusesTargetWithoutRoles` fails on the reverted hunk (switch proceeds), passes on the branch; `TestSwitchSessionTenant_AllowsTargetWithRoles` passes in both. |
| The removed controls left no dead imports or unreachable routes | `TenantSwitcher` had exactly one importer (`AppLayout.tsx:44`) and no `frontend/src/index.ts` export; the component file is deleted, the import and render site removed. `viewpoint.ts` / `TenantViewpointSwitcher.tsx` mention it only in comments (viewpoint.ts is doNotTouch and untouched). Login.tsx: picker state, select block, disable logic, orphan CSS and the four orphan i18n keys (×5 locales) removed; `tsc -b`, `eslint .`, `vite build` all clean. The endpoints stay registered (no route removed). |
| Existing cross-tenant rows are neither deleted nor silently usable | No migration, no cleanup code — `git diff` touches no table. Rows become unreachable at login (all three read points filter), `/auth/current` still reports them (decision §4), and the contract V1.7 text states exactly that. `AddMember` now refuses to create new ones (`ErrMemberUserNotInTenant`); last-owner/existence checks precede it unchanged. |
| The e2e changes keep every isolation assertion | `tenant-hostile-browser-matrix.spec.ts`: the cross-membership grant becomes a live refusal assertion (`tenant.member.user_not_in_tenant`, code 400), direct login asserts single-round-trip sign-in plus `/auth/current` carrying the owning tenant; the dashboard/refresh-replay, upload-namespace and dictionary-isolation describes are byte-identical to before. `auth-tenant-picker.spec.ts` keeps the password-failure isolation (no candidates on error, no cookies) and adds the fail-closed picker-envelope refusal. Both specs pass tsc/eslint/build; live execution is the recorded gap (needs the smoke backend). |
| Contract and API docs state the new limitation | Contract §2.2 V1.7 invariant (no authorization, not offered at login, B is a separate workstream with the `user_helper.go:88` prerequisite), §5 error row `tenant.member.user_not_in_tenant` (400), changelog V1.7, `updated_at` 2026-10-27. `TENANT_API.md`: Add-member error list + summary table, §9 marks `/auth/tenants/switchable` and `/auth/login-tenants` as filtered compatibility surfaces returning at most one item, not an error. Frontend i18n registers the same key in all five locales. |

## Fact-checks run during review

- Premise adaptation, not assertion deletion: 7 existing login tests were re-seeded with
  `f.seedUserRole(...)` so their premises hold under both old and new behaviour — they pass
  in the red run too. The three new W4 login tests fail in red and pass in green.
- Gate order: the role check sits **after** `EnsureTenantLoginable` in
  `GateSessionIssuance`, so suspended/archived still map to their specific sentinels
  (`TestAuthTenantGate_TenantStatusGates` passes unchanged once bindings seed the premise).
- Ambiguity semantics preserved: the filter runs before the ambiguity count, so one bound +
  one unbound membership resolves the bound one (no false `ErrTenantForbidden`) and two bound
  memberships still deny (`TestDiscoverDefaultTenantFiltersMembershipWithoutRoles` covers all
  three branches).
- pkg/tenant does not import the IAM user module: the predicate reads `system_user_role` by
  table name with `Migrator().HasTable` guard; the test fixture creates the table by raw DDL.
- Full verification matrix executed: backend build + 4 targeted suites + `go test ./...`
  (exit 0), frontend tsc/lint/build, packet checker 0 errors. Playwright live run is the
  recorded gap (no smoke backend this session); recorded in commands.json knownGaps.

## Governance notes

- **Human gate (remove picker + TenantSwitcher, keep endpoints)**: resolved as
  maintainer-delegated — W3 decision A's signed text already names the removal as a
  consequence ("unreachable by construction, so their UI is removed"). Open for maintainer
  review in the PR; the UI is a single file + two import lines in git history if overridden.
- **No `solo-override`** is used; the PR carries the governance body and rides the normal
  Quality Gates.
- Wave sequence: W3 (#440) → W4 (this PR) → W5 next; W6/W7/W8 manifests depend on W5.

## Machine Readable

```json
{
  "taskId": "2026-10-27-tenant-multi-membership-authorization",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-tenant-multi-membership-authorization/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-tenant-multi-membership-authorization/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-tenant-multi-membership-authorization/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_MULTI_MEMBERSHIP_DECISION_2026-10-27.md",
      "docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md"
    ]
  }
}
```
