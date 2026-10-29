# v0.17.0 Release Cut — Summary

Task: `2026-10-21-v0170-release-cut`.

## Scope

Thirteen commits landed after `pantheon-base-v0.16.1`:

| Area | Commits |
| --- | --- |
| Tenant isolation and permissions | `8b5a3012` (#386), `8ffb00bf` (#391), `985e5bb0` (#392), `16442bb5` (#393), `ffb22988` (#394) |
| Dependencies | `244913d8` (#381), `81fa442a` (#384), `f6579ad8` (#385) |
| Release pipeline and closeout | `0fed4a39` (#383), `7d0224ab` (#387), `ab24122d` (#388), `1b902f44` (#389), `eb20d72f` (#390) |

## Version decision

`docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 puts behaviour changes and new state on a minor bump. This
range changes behaviour on purpose (cross-tenant policy writes now fail with `TENANT_FORBIDDEN`,
platform-namespace role keys are rejected, `platform.tenant_mode` becomes public at startup) and adds
migrations `000025`–`000028`. `.harness/STATUS.md` had already recorded that the tenant remediation
would ship with v0.17.0 after the v0.16.1 cut was scoped back to its release candidate.

## Consumer contract

- `sharedPaths` unchanged: 52 entries (backend 4, frontend 46, docs 2). Verified against the
  generated v0.17.0 manifest.
- All six business-overlay assembly anchors resolve exactly once in the release tree.
- Migrations are additive and carry down migrations.
- No API route, permission code or menu key is removed.

## Verification

| Check | Result |
| --- | --- |
| Version references (VERSION / CHANGELOG / RELEASE_NOTES / STATUS) | agree |
| Generated manifest `sharedPaths` | 52, unchanged |
| Overlay anchors | 6/6 exactly once |
| `check-task-packet` for the new packet | pass |
| `check-failure-registry --strict` | pass |
| `check-evidence --strict` | one pre-existing failure outside this task (tenant-delivery-hardening evidence schema) |
| Required checks + Release Gate on the release commit | recorded below after the push |
| Four published assets + digests | recorded below after publishing |
| `Foundation Release Verify` on `release: published` | recorded below after publishing |

## Known gaps

- The 2026-10-20 tenant-delivery-hardening evidence predates the current evidence schema and still
  fails `check-evidence --strict`; it was not rewritten here.
- Hosted publishing is impossible with `GITHUB_TOKEN` in this repository (`default_workflow_permissions`
  is read). The tag and release are created with the maintainer credential, exactly as recorded for
  v0.16.1; closing this needs a PAT stored as a repository secret.
