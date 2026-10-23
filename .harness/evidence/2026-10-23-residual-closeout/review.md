# Review — 2026-10-23 v0.17.2 residual closeout

## Verdict

Approve. Five items were recorded as residual by v0.17.1. Two of them were claims that had never been
exercised, and exercising them produced real defects rather than confirmations — that is the substance of
this change, not the bookkeeping. One behaviour change is consumer-visible and is called out below
(a deleted tenant now answers 404 everywhere). No schema change, no route removal, no permission-semantics
change.

## Diff scope

| Area | File | Review |
|---|---|---|
| Provisioning copy | `backend/modules/system/iam/tenant/tenant_provision.go` | `INSERT ... SELECT` over the same table became a `SELECT` + insert. The deadlock it removes is not theoretical: the concurrency test reproduced `Error 1213` on the old code. Idempotency is preserved rule by rule — existing tenant keys win, soft-deleted platform rows are skipped, the tenant-side existence check still ignores `deleted_at` (a soft-deleted row keeps its unique key). `setting_value` and `remark` stay nullable pointers so a NULL does not silently become an empty string. |
| Provisioning copy types | same file | `platformSettingRow` / `platformDictTypeRow` / `platformDictItemRow` serve both halves of each copy, so a column cannot be read but not written without the compiler noticing. The column sets match the previous SQL exactly, including the deliberately-omitted `tag_type` / `css_class`. |
| Tenant lookup | `backend/modules/system/iam/tenant/tenant_service.go` | `GetTenantByID` reports a tombstone as not found. This is the single choke point for `UpdateTenant`, `AddMember`, `ProvisionTenant` and both handlers, so one rule covers every write path instead of four guards that could drift. The list endpoint is untouched, so the operator's `status=deleted` view still works. |
| Tenant state machine | same file | `tenantStatusTransitionAllowed` gains an explicit `deleted` branch returning false. Without it the `default: return true` branch answered "allowed" for the tombstone, which is what let a deleted tenant be revived. |
| Tenant code conflict | same file | `findTenantCodeBlocker` / `codeConflictError` extract the lookup and the mapping, and `CreateTenant` calls them from both the pre-check and the post-insert race path. The two cannot drift into reporting different errors, and the loser of a race no longer gets a 500 carrying the driver's index name. |
| Duplicate-key predicate | `backend/pkg/database/duplicate_key.go` (new) | Recognises both shapes: GORM's `ErrDuplicatedKey` and the MySQL 1062 driver error, because the repository configures neither consistently. Nothing else in the tree had this predicate, which is why every create path leaked raw 1062 errors under a race. |
| Test Redis isolation | `backend/pkg/testredis/redis.go` | `OpenDB` plus a registry of reserved logical databases (2–5). `Open` is unchanged, so packages that do not assert key survival keep the shared default. `OpenDB` ignores `PANTHEON_TEST_REDIS_DB` on purpose: the variable is per process and cannot distinguish two packages inside one run. |
| Test Redis tests | `backend/pkg/testredis/redis_test.go` | Pins the registry (distinct indexes, default unclaimed), pins that an explicit index does not consult the override, and pins that a bad override is a failure rather than a silent fallback. |
| Concurrency tests | `backend/modules/system/iam/tenant/tenant_concurrency_test.go` (new) | Asserts ownership and disjointness — every role, membership, root department, administrator and copied setting belongs to its own tenant and to no other — rather than asserting error codes. The same-code test asserts exactly one winner, one row, and a contract-shaped conflict for the losers. Both use a start barrier so the goroutines actually overlap. |
| Tombstone tests | `tenant_lifecycle_guard_test.go` | Three tests: revival refused, new members refused, re-provision refused. All three failed before the fix, which is recorded in the evidence. |
| Lifecycle test helpers | `tenant_service_test.go`, `tenant_code_lifecycle_test.go` | `mustLoadTenantRow` reads the row directly. The five call sites that used `GetTenantByID` to inspect a deleted row now go around the service, which is the behaviour change made explicit in the tests instead of hidden. |
| Release preflight | `scripts/foundation-release/check-release-secrets.mjs` (new) | Runs between "bundle built" and "tag created". Three rules only. The first, broader attempt reported 42 false positives on the real v0.17.1 bundle (test fixtures, Go struct literals, i18n copy), so it was narrowed until the real bundle is clean and both shapes of the actual v0.17.0 residue are caught. The report masks the secret; a finding that reprints the credential would move the leak into CI logs. |
| Publish flow | `scripts/foundation-release/publish-foundation-release.mjs` | One added call, before the tag exists. Nothing else in the flow changed. |
| Preflight tests | `tests/scripts/foundation-release/check-release-secrets.test.mjs` (new) | Ten tests, including the two exact shapes v0.17.0 shipped, the mask, the line number, the placeholders a release legitimately contains, the directory walk with `node_modules` skipped, and the CLI exit codes. |
| Contract | `docs/contracts/TENANT_CONTRACT_V1.md`, `.en.md` | V1.3 clarification only: `deleted` is a tombstone, never an input, never addressable; the delete marker is `status` and not the reserved `deleted_at`; deleting an archived tenant disables its memberships in the same transaction. §9 records the trigger and scope, and does not declare G4 passed. §2.2's wording is untouched — V1.3 only states what "every non-archived tenant" already meant. |
| Residual register | `docs/reviews/PANTHEON_BASE_DELIVERY_REMEDIATION_2026-10-22.md` | §5 rewritten from a list of open items into a closure table with the disposition of each. The 2026-10-22 body above it is unchanged, so the record of what that round concluded stays intact. |
| Version material | `VERSION`, `CHANGELOG.md`, `README.md`, `README.en.md`, `RELEASE_NOTES_v0.17.2.md`, `.harness/STATUS.md` | All state 0.17.2 / 2026-10-23 and point at the same evidence directory. |

## Risk analysis

- **Deleted tenants answer 404 (consumer-visible)**: an operator or script that read a deleted tenant by id
  used to get 200. Nothing legitimate depended on it — writes against a tombstone were the bug — and the
  explicit `status=deleted` list is unchanged. Called out in the release notes under Changed.
- **Read-then-insert instead of `INSERT ... SELECT`**: two statements instead of one, so a concurrent write to
  the *platform* rows between the read and the insert could be missed by one tenant's copy. Platform settings
  and dictionaries are deployment-level seed data changed by an operator during a migration, not while
  tenants are being created; the previous statement had the same window under REPEATABLE READ, where its
  snapshot is also taken at first read. No behaviour regression, and the deadlock is gone.
- **Tombstone rule at `GetTenantByID`**: it makes a deleted tenant unaddressable everywhere at once. That is
  the intent, but it is the kind of change that can surprise a repair script. The two repair routines
  (`ReleaseDeletedTenantCodes`, `Bootstrap`) use direct SQL and are unaffected — verified by their tests
  still passing.
- **Duplicate-key mapping**: re-reading the blocker costs one query only on the failure path. If the blocker
  disappeared between the failed insert and the read (a concurrent delete released the code), the answer is
  still the conflict, which is honest — the caller's insert did fail and a retry will succeed.
- **Reserved Redis databases**: if a future package picks an index without registering it, the registry test
  will not notice (it only checks the constants it knows). The mitigation is the constant table itself plus
  the comment; the alternative — a dynamic allocator — would make the assignment depend on test order, which
  is worse.
- **Credential preflight**: it can only block a release, never corrupt one, and it runs before the tag exists.
  The residual risk is the opposite direction: a real credential in a shape the three rules do not cover
  passes. That is stated in the release notes rather than implied to be complete coverage.

## Not verified here

- `Release Gate` and `Foundation Release Verify` on the merge commit and the tag: CI-decided, not claimed
  locally.
- Cross-tenant smoke (`Tenant Smoke` multi-mode): CI-decided. The local environment is compat mode, and the
  behaviour change is covered by the real-MySQL tombstone tests instead.
- SonarCloud: the new code adds one package, one test file and one script; the local `go vet` / `gofmt` /
  `eslint` runs are clean, but the quality gate verdict is CI's.
