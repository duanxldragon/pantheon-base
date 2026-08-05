# Summary

This patch release closes the governance gaps found after v0.10.0. CI Summary
now rejects every non-success result from required jobs while reporting the
real full-repository Go Lint result as advisory. `quality.yml` remains the
blocking new-code lint gate for pull requests and merge groups. Historical
release-task linkage is reconciled without inventing missing evidence, and the
repository now tracks its OpenSpec skeleton.

No Base product runtime, API, schema, permission, menu, i18n, or UI behavior is
changed. Pantheon Ops consumption is intentionally handled by a separate L2
upgrade task because the current lock predates this release line and the
consumer must prove compatibility, rollback, runtime, and UI behavior.
