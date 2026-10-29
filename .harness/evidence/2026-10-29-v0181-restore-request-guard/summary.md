# Summary — `2026-10-29-v0181-restore-request-guard`

## What this package does

Restores the `isForbiddenRequestError` export in `frontend/src/api/request.ts` and ships it as
`pantheon-base-v0.18.1` (patch, `release/0.18`). Nothing else changes: no backend, migration, route,
permission, menu, i18n, workflow or gate file is touched.

## How the defect surfaced

The verification the previous package asked for — rebuild `pantheon-ops` against the release and build
it — produced a real failure. Against v0.18.0:

```
src/modules/business/deploy/task/DeployTaskDetail.tsx(29,10): error TS2614:
Module '"../../../../api/request"' has no exported member 'isForbiddenRequestError'.
```

The consumer imports the predicate at line 29 and branches on it at line 182 to separate a permission
rejection from other request failures. Restoring the export in the consumer's staging tree made the
same build pass (`✓ built in 751ms`), which located the fix on the base side.

## Root cause

The S1 unexport wave (#439, `b0a1952a`) removed `isForbiddenRequestError` on a zero-caller reading
that covered only this repository. `api/request` is a foundation surface: the predicate belongs to a
four-member family (`isTimeoutRequestError`, `isNetworkRequestError`, `isForbiddenRequestError`,
`isServerRequestError`) that consumer business code references directly. Caller enumeration for a
shared export has to span the workspace, and a foundation release is not verified until the consumer
builds against it.

A workspace import scan now shows `pantheon-ops` imports twelve names from `api/request`, and after
this restore every one of them is exported.

## Version decision

`0.18.1` (patch), not `0.19.0`. `docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 lists bug fixes as patch, and
the diff is two added lines with no API, schema, route, permission, menu or i18n change. The release
line stays `release/0.18`.

## Guardrails added

- `FR-021` (`maintainability` / `static-sensor-gap`, `guide-updated`, `implemented`) registers the
  miss with the search scope and the consumer build as its detection path.
- `docs/harness/AI_QUALITY_GOVERNANCE.md` §5.4 requires a workspace-wide consumer reference search
  before removing a shared export, and requires the consumer build as part of the release acceptance
  reading.

No gate is changed; the rule is a guide change with the existing base-local checks unchanged.

## Boundaries

- No migration: the chain still ends at `000030_tenant_plan_definitions` (schema 30).
- No removed or added route, permission code, menu key or i18n key.
- `sharedPaths` unchanged at 52 entries; the consumer lock moves version, release line, commit and the
  two checksums.

## Release mechanics

1. This package merges to `main`.
2. `Release Gate Summary` and the required checks must be green on the merge commit.
3. `cut-foundation-release.mjs` → `check-release-secrets.mjs` → `publish-foundation-release.mjs`
   create the annotated tag and the GitHub release with the four assets.
4. `check-release-assets.mjs` and `Foundation Release Verify` confirm the asset set.
5. `pantheon-ops` moves its lock from 0.18.0 to 0.18.1, runs `rebuild:from-base`, `go build ./...` and
   `npm run build`; that pair of builds closes the simplification programme's last checklist item.

## Known gaps

- Publication and the consumer rebuild run after merge; the records are appended to `commands.json`.
- The reproduction lives in the consumer staging tree because no base-repository check compiles a
  consumer tree.
- `pantheon-ops` changes are a consumer-side diff and are not committed from here.
