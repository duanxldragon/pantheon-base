# Review — 2026-10-24 v0.17.5 release closeout

Reviewed against `main` at `d36c63e9` (the squash merge of the release-material PR #421), with
`pantheon-base-v0.17.4` as the previous release tag. The release target moves to the merge of the
reduced-motion fix, because Release Gate was red on `d36c63e9`.

## Scope audit

`git diff --stat pantheon-base-v0.17.4..HEAD` reports 21 files and 1533 insertions for the IAM
content. Backend changes are 9 files and 689 insertions confined to `system/iam/tenant`,
`system/iam/role`, `system/iam/user` and `pkg/testmysql`; the rest is the closeout packet, evidence
and STATUS from #420. `git diff --name-only ... | grep -E "migrations|.github/workflows"` returns
nothing. The version moves 0.17.4 → 0.17.5 as a patch. PR #421 adds version material, the task
packet, the manifest and evidence; the reduced-motion PR changes exactly two CSS files
(`frontend/src/assets/list-page.css`, `frontend/src/core/layout/index.css`).

## Claim audit

| Release-note / packet claim | Evidence |
|---|---|
| Same-tenant provisioning converges | tenant transaction takes the `tenants` row first; `TestConcurrentProvisioningOfTheSameTenantIsConvergent` PASS 1.29s on real MySQL |
| Platform-default copies run under the same lock | copies take the transaction handle and re-take the tenant row; `TestCopyPlatformDefaultsRunOnTheLockedTenantRow` PASS 0.78s (NOWAIT probe 3572) |
| Different tenants stay parallel and isolated | `TestConcurrentProvisioningKeepsTenantResourcesIsolated` PASS 0.80s |
| Replace-style grants are serialised | `TestConcurrentReplaceRolePermissionsSerialisesOnTheRoleRow` PASS 0.88s, `TestConcurrentReplaceUserRolesSerialisesOnTheUserRow` PASS 0.92s |
| Historical `tenant_id = 0` grants are repaired | `TestBackfillRolePermissionsRepairsPlatformNamespaceGrants` PASS 0.70s, `...StampsTenantAndDeduplicates` PASS 0.59s |
| Duplicate-key losers still get the existing 409 | `TestConcurrentCreateUserMapsLoserToConflict` PASS 0.79s |
| No schema, route, permission-code, menu-seed or workflow change | no migration or workflow file in the diff; schema stays at 29; the packet touches only version material |
| Version material is consistent | `VERSION` 0.17.5 matches `RELEASE_NOTES_v0.17.5.md`, `CHANGELOG.md`, both READMEs, STATUS and the manifest `release` block |
| The tree under release is green | full suite 46 packages ok, 0 FAIL, 0 SKIP; build/vet/gofmt clean |
| Reduced motion is respected without changing default rendering | both transitions are inside `@media (prefers-reduced-motion: no-preference)`; Prettier, UI contract, shell visual contract and `vite build` pass; headless Chromium measures `0.18s` under `no-preference` and `0s` under `reduce` |
| The two Sonar findings were pre-existing and unrelated to the IAM work | SonarCloud issue search reports them on `css:S9440`, created 2026-05-11, at the two CSS lines; no rule or suppression change is in the diff |

## Findings

No blocking finding in the release content. Residual risks carried forward:

- **R1 (P3, environment)**: the local Windows host cannot start ThreadSanitizer (error 87). The
  race gate is the CI Linux `quality.yml` `backend-tests` job; runs `39969299263` and
  `39970863908` passed on head `973f5be2`.
- **R2 (P3, accepted)**: copy serialisation depends on the tenant row lock because
  `system_dict_item` has no unique key. The dependency is intentional and covered by the NOWAIT
  regression.
- **R3 (P3, accepted)**: concurrent same-tenant role creation is serialised by the tenant row lock
  rather than a per-role upsert. Provisioning is serialised per tenant creation by design.
- **R4 (P3, immutable)**: published v0.17.0–v0.17.4 tags and assets are not rewritten. The v0.17.3
  notes correction exists in the repository file and the mutable release body only.
- **R5 (P3, fixed)**: the two `css:S9440` findings blocked Release Gate on `d36c63e9`. They are
  fixed with media-query guards in two CSS files; the SonarCloud rule and project configuration are
  unchanged, and resolution depends on the next analysis of `main`.

## Verdict

Approve. The release content is exactly what #420 merged plus the reduced-motion guard required to
clear the release gate; the version material matches it, local verification is green, and no schema,
workflow or backend contract change is introduced by this packet. The gate sequence is recorded: the
release-material merge `d36c63e9` failed once on a `proxy.golang.org` download flake (rerun passed)
and once on the two pre-existing Sonar issues, which the reduced-motion PR fixes. Publication gates
(`Release Gate Summary` on the final merge commit, four assets, `Foundation Release Verify`) are
decided by CI after the tag is cut and are recorded in `commands.json`.

## Machine Readable

```json
{
  "taskId": "2026-10-24-v0175-release-closeout",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "release/version-material",
      "frontend/theme-motion",
      "system/iam/tenant",
      "system/iam/role",
      "system/iam/user"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [],
    "notes": "The packet adds version material, evidence and two media-query guards; no backend file changes and no new module edge. The released backend content is the subgraph already reviewed in .harness/evidence/2026-10-23-iam-race-closeout: one parent row locked per operation (tenants, system_role or system_user), no path takes two parent locks, so no lock-order cycle or new hub is introduced. The CSS change only scopes existing transitions."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-24-v0175-release-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-10-24-v0175-release-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-10-24-v0175-release-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/VERSION_MANAGEMENT_GUIDE.md",
      ".harness/evidence/2026-10-23-iam-race-closeout/review.md"
    ]
  }
}
```
