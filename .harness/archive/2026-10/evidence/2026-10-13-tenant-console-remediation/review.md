# Review — 2026-10-13-tenant-console-remediation

## Verdict

**Accepted, with one scope correction made during review and two verification steps declared
not-run.**

The three P0 defects are real, independently rooted, and each is fixed at its own root rather than at
the symptom. The tenant/non-tenant coexistence decision (option b+c) is sound and, importantly, is
expressed as a *contract* amendment rather than as a special case in code. The secondary defects are
closed with matching tests or live probes.

The correction matters: the first draft of the task packet declared a scope that did not match the
working tree. It has been rewritten (see "What review changed" below). The two not-run items are the
cgo/SQLite link failure and the EBUSY encoding sweep.

## What was actually executed (versus argued)

Executed and recorded in `commands.json`:

- `go build ./...` (exit 0), `gofmt -l modules/ internal/ pkg/` (clean), `go vet` on the two
  resolution packages (clean).
- `go test ./pkg/tenant/...` → **ok 0.483s**; `go test ./internal/middleware/... ./modules/auth/...`
  → all ok.
- The platform-scope suite **against real MySQL**: resolution matrix **8/8**, membership guard
  **4/4**, failure envelopes PASS.
- The live probe against the running multi-mode backend: **30/30**.
- All **13** frontend contract gates PASS; `tsc -b` exit 0; `dateTime` unit tests **21/21**.
- `check-task-packet`, `check-evidence --strict`, `check-adoption --strict`,
  `check-doc-frontmatter --strict`, `check-doc-links --strict`, `check-doc-inventory --strict` — all
  clean.
- Direct database inspection: `schema_migrations` version 23 / dirty 0; `tenants` holds exactly one
  row at id 0; `tenants.metadata` is `text / nullable / no default`.

Argued from evidence rather than reproduced locally:

- The **tenant module's unit tests** (see not-run below). Compensating evidence is the live probe.
- The **encoding sweep** (see not-run below).

## Reviewer checklist

- [x] **The fallback cannot be reached by a subject that holds a membership or lacks a platform
      grant.** Three conditions are required, and each is pinned by a named test case:
      `undeclared route denies the same operator`, `capability is still required on a declared
      route`, `member without a claim cannot fall back implicitly`, `unknown subject fails closed`.
      The membership probe fails closed when the answer is unavailable.
- [x] **A tenant subject cannot widen itself to the platform namespace.** `subject claim outranks the
      platform fallback` pins that source 2 wins; and because the capability probe reads only
      *global* (domain-less) Casbin policies, a tenant-domain grant (`role:<key>@tenant:<id>`) can
      never satisfy it — contract §4's "never merged, never implicitly escalated" holds by
      construction, not by convention.
- [x] **The reserved placeholder is gone from every read path.** `reserved placeholder not listed`,
      `GET /system/tenant/0 rejected as invalid` (envelope 400) and `DELETE /system/tenant/0 rejected`
      (envelope 400) all pass; the database was re-inspected afterwards and holds only the id-0 row.
- [x] **The contract amendment did not touch §2 / §4 / §5 / §7, and §3.1 items 1–2 keep their
      meaning.** `git diff` on the contract shows hunks only at the frontmatter line, inside §3.1
      (appending item 3), a new §3.4, two scope notes, and a new §9 change log. §2/§4/§5/§7 have no
      hunks. Item 3 is *appended*; items 1 and 2 are textually unchanged.
- [x] **No Casbin policy was granted to any role.** The change adds menu/permission *declaration*
      seeds and permission→route mappings; `seed.go` inserts menu rows via `ensureMenuSeeds`, and
      `permission_workbench.go` extends `requiredAPIRoutesByPermission`, which is a contract table
      consumed by a gate. Neither writes a `casbin_rule` row. The console's permissions still have to
      be assigned through the normal IAM flow.
- [x] **The changed canary assertion (header `0`) is justified by contract text, not by making a test
      pass.** §2.3/§4 reserve tenant 0 for the platform-global scope, and the new §3.4 makes the
      header the one explicit path to it for a platform-capable subject. `pkg/tenant` asserts *both*
      branches — header 0 **without** the grant is still forbidden, **with** it resolves to tenant 0
      — so the change widens nothing for an unauthorised subject.
- [x] **`platform.tenant_mode`'s value was not modified.** The seed default is still `compat` and the
      live row is still `multi`. The `is_public` flag was flipped 0 → 1, which is in scope and now
      declared (see below).

## What review changed

The first draft of the packet/manifest declared a scope that did not survive contact with `git diff`.
Two claims were wrong and were corrected rather than left standing:

1. **"Granting any new Casbin permission, menu, or seed row" was listed as out of scope — but the
   tenant console menu tree was in fact created by this task.** Before it, the console had a URL and
   five backend action-seed permission keys, but no menu rows, no component registration and no
   translations. That is why `seed.go`, `i18n/seed_data.go`, `builtin_locale_resources.json` and
   `menu/component_registry.go` are in the change. The declaration now says what it actually is: menu
   and permission *declarations* added, no role-policy grant.
2. **"Touching platform.tenant_mode's is_public flag, or the public-settings pipeline" was listed as
   out of scope — but the flag was deliberately flipped 0 → 1** (appended as migration 000022 and
   mirrored in `setting_seed.go`), because the frontend cannot choose between the tenant table and
   the compat guidance state without reading the mode. The declaration now distinguishes the
   *value* (untouched) from the *visibility* (changed, in scope).

The review also surfaced a larger issue worth recording plainly: **the working tree carries a second,
unrelated changeset** — log-governance retention-option refresh plus CSV export for admin sessions
and security events. It was found by reading the diffs of files the task had not declared
(`ExportAdminSessions`, `ExportSecurityEvents`, `GovernanceCleanupBar.onBeforeOpen`, the
`system:session:export` / `system:security-event:export` permission rows). None of it is covered by
this task's evidence, and two files (`backend/modules/auth/module.go`,
`backend/modules/system/iam/permission/permission_workbench.go`) are genuinely touched by both
changesets. This is now declared in the packet's *Do Not Touch*, in an *Implementation Notes* entry,
in the manifest's `scope.out`, and in the evidence's `knownGaps`.

Reviewing the packet against the tree, rather than against the packet's own prose, is what caught all
three items.

## Follow-up review — defects found by manual UI inspection

Two defects that neither the gates nor the probes caught were reported from the running UI. Both are
fixed; both are also **lessons about the verification set**, so they are recorded as findings rather
than quietly patched.

**P1-6 — the five tenant permission rows rendered at the menu root.** `resolveMenuParentID` maps a
seed's `ParentKey` to a `parent_id` via a hardcoded `parentPaths` table that had no `"tenant"` entry.
The lookup missed and the function **returned `0` silently**, so ids 166–170 all got `parent_id=0`
while the parent menu (id 165) was correctly nested. Reviewed and confirmed at the data layer:
`SELECT id, parent_id FROM system_menu` showed exactly that split.

Why the existing verification missed it, which is the part worth keeping:

- The **nav tree** the sidebar renders excludes F-type rows, so the sidebar looked perfectly correct.
  Every probe I had went through the nav tree.
- `check:menu-contract` validates that permission keys exist as seeds and in the locale packs. It
  says nothing about `parent_id`, so a menu at the wrong depth is green.
- `resolveMenuParentID` returning `(0, nil)` — no error — meant nothing downstream could notice.
  This is the root cause of the *invisibility*, not just of the bug.

So the fix is two-part and the second part matters more than the first: add
`"tenant": "/system/tenant"`, **and** log a warning when a seed names a parent key the map does not
know, while still creating the menu (at the root) rather than aborting the seed. A sweep of every
`ParentKey` in every seed against the map showed `tenant` was the **only** miss, and the warning
logged **zero times** on a clean boot — which is the evidence that no other menu is misplaced.

No data migration was needed: `ensureSingleMenuSeed` resolves an existing row by `perms` and then
calls `updateSeedMenu`, which re-writes `parent_id`, so the startup re-seed repaired the rows.

**P1-7 — 租户管理 must leave 访问控制 under 单租户.** This is a maintainer refinement of the earlier
UI option 3 decision (which had kept the console visible in both modes). It is now implemented as a
`tenantEnabled` capability on the pre-existing menu capability filter, exactly mirroring the
`orgEnabled` / `system.org` gate.

Reviewed points:

- **It is a visibility change, not a behaviour change.** The route, the page and its compat guidance
  state are untouched; only the sidebar entry is filtered. A stale bookmark still lands on guidance,
  not on an empty table.
- **It cannot over-filter.** The predicate is `module === 'system.tenant'`, and the filter is applied
  recursively with the same shape as the existing org rule. The verification asserts the sibling
  children survive (5 → 4, leaving user/role/permission/menu) and that `system.org` and
  `system.config` are unaffected.
- **The frontend is the right layer.** The mode is a runtime setting that can change without a
  re-seed, and the frontend already receives it via the public settings payload; flipping the menu's
  `visible` column would have been a stored, stale copy of a runtime fact.
- **`useLayoutMenu` has exactly one call site** (`AppLayout`), so making `tenantEnabled` a required
  option could not silently leave a caller un-updated — verified by grep rather than assumed.

**What I would add to the verification set next time.** A check that asserts, for every seeded menu,
that a non-empty `ParentKey` resolved to a non-zero `parent_id`. That single assertion would have
caught P1-6 the moment the tenant menu was seeded, and it is the natural home for the new warning.

## Explicitly not run

1. **`go test ./modules/system/iam/tenant/...` — FAIL [build failed].** The failure is at the cgo
   **link** step (`link.exe → D:\msys64\mingw64\bin\gcc.exe exit status 1`) for the package's SQLite
   test driver, not at compile: `go build ./...`, `go vet` and `gofmt` all pass on the same package.
   The new `tenant_service_list_test.go` cases are therefore written and reviewed but unexecuted on
   this host. The behaviour they cover (reserved-row exclusion, keyword LIKE escaping, archived
   filter binding, soft-deleted hiding, summary paging, delete-unknown-id) is covered end to end by
   the live probe instead — which is why this is a declared gap rather than a blocker.
2. **`node scripts/harness/check-encoding.mjs` — cannot run.** It shells out via `spawnSync(git …)`
   and Node cannot spawn any subprocess on this host: `spawnSync` returns `status: null` with
   `error.code: EBUSY` for `git`, `node` and `echo` alike, unchanged with the sandbox disabled. The
   encoding sweep did not enumerate files and is not part of the evidence set.

Also not verified, and declared:

- **Repo-wide `check-evidence --strict` exits 1 — for pre-existing reasons, not this task.** Nine
  historical `commands.json` files fail the current schema and are untouched here: `2026-09-25-task-
  archiving-and-v0130-prep` (a `planRefs` entry that no longer exists), `2026-10-07-release-closeout`
  (`agent.tool` outside the allowlist), `2026-10-07-release-qualification` and
  `2026-10-07-release-readiness-remediation` (statuses outside `passed/failed/not-run`),
  `2026-10-11-smoke-test-tiering` and `2026-10-11-sonar-duplication-under-3` (`linkage` not an
  object), `2026-10-11-sonar-smoke-helper-smells` (`knownGaps` not an array, `linkage` not an
  object). Run against this task's file alone the gate reports **1 file, 0 errors, 0 warnings,
  exit 0**. Repairing other tasks' historical evidence is out of scope, so the repo-wide exit code
  stays red until someone owns that cleanup.
- **No in-browser visual pass.** The UI change is asserted at the contract level (`tsc`, 13 gates,
  i18n keys, the public-settings type) and through the backend probe, not by driving a browser.
- **Runbook §8 gate G4 ("no open contract-change") no longer holds automatically**, because this
  change amends the contract. Only a maintainer can re-grant it; this task does not claim it.
- **`tenants` CRUD ownership still violates contract §7** (it says `system/org`; the console lives in
  `system/iam`). Pre-existing, deliberately not re-homed here.

## Residual risk

- **The `platform-fallback` branch widens what a *declared* route will accept.** The blast radius is
  bounded by the two gates plus the membership probe, and every gate has a dedicated negative test.
  But the branch is only as safe as the discipline of declaring the platform scope — a future route
  group that declares it carelessly inherits the fallback. The strict variant remains the default for
  undeclared groups, which is the correct fail-safe direction.
- **The reserved-row id change is a primary-key mutation.** It is safe here because nothing referenced
  the old id, and the migration is guarded to only run when the id-0 slot is free. On a database that
  *did* reference it, the guarded UPDATE would silently skip — a safe failure, but a silent one.
- **The `is_public` flip exposes the tenant mode to unauthenticated callers.** That is the point (the
  login page needs it), and the mode is not a secret, but it is a wider surface than before.
- **The tenant module's unit tests remain unexecuted on this host.** Until they run on a host with a
  working cgo toolchain, the package's own test file is an unverified artifact; the live probe is the
  substitute, not an equivalent.


## Machine Readable

```json
{
  "taskId": "2026-10-13-tenant-console-remediation",
  "verdict": "approved with documented P2 follow-up",
  "verdictRationale": "Accepted with one scope correction made during review and two verification steps explicitly declared not-run.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-13-tenant-console-remediation/manifest.json",
    "evidence": ".harness/evidence/2026-10-13-tenant-console-remediation/commands.json",
    "reviewFile": ".harness/evidence/2026-10-13-tenant-console-remediation/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-13-tenant-console-remediation.task.md"
    ]
  }
}
```

> This block was backfilled on 2026-10-26 during the governance-schema repair round. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
