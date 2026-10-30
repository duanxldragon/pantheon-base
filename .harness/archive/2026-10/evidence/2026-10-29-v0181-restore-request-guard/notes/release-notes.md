# Release Notes

## pantheon-base-v0.18.1

Patch release on the `release/0.18` line. It restores one shared frontend export and changes nothing
else.

### No contract break

- Schema unchanged at 30. No migration in this release.
- No route, permission code, menu key or i18n key changed.
- No backend change.
- `sharedPaths` unchanged at 52 entries; the lock moves version, release line, commit and the two
  checksums only.

### Fixed

`frontend/src/api/request.ts` again exports `isForbiddenRequestError`, completing the four-member
request-error family:

| Predicate | Error kind |
| --- | --- |
| `isTimeoutRequestError` | `timeout` |
| `isNetworkRequestError` | `network` / `timeout` |
| `isForbiddenRequestError` | `forbidden` |
| `isServerRequestError` | `server` |

The S1 unexport wave (#439, `b0a1952a`) removed the predicate on a zero-caller reading that covered
this repository only. `pantheon-ops` imports it at
`frontend/src/modules/business/deploy/task/DeployTaskDetail.tsx:29` and branches on it at line 182 to
separate a permission rejection from other request failures. Rebuilding the consumer against
`v0.18.0` therefore stopped at:

```
src/modules/business/deploy/task/DeployTaskDetail.tsx(29,10): error TS2614:
Module '"../../../../api/request"' has no exported member 'isForbiddenRequestError'.
```

### Verification

- Consumer staging tree against v0.18.0: `npm run build` fails with TS2614.
- Same tree with the export restored: `npm run build` → `✓ built in 751ms`.
- Base frontend after the restore: `npm run lint`, `npm run type-check` and `npm run build` green.
- The four assets and `Foundation Release Verify` follow the same contract as v0.18.0.
