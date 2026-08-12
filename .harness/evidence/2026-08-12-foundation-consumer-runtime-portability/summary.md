# Evidence Summary

Real Ops business smoke after consuming `pantheon-base-v0.10.18` passed CMDB (9), Deploy API (4), and Deploy UI (10), then exposed two Base-owned consumer portability gaps. The generated-module smoke asserted the producer-specific `pantheon-base/modules/...` import even though the Ops generator correctly used its own `pantheon-ops/modules/...` identity, and cleanup left the tracked feature-ledger snapshot modified after removing the temporary module.

The shared smoke now reads the active repository's `go.mod` module directive before asserting generated imports. Cleanup restores the tracked feature-ledger snapshot from the same Git-index baseline already used for registries and i18n. Focused producer regression tests pass; exact-commit hosted gates, immutable patch publication, and final Ops business smoke remain pending.
