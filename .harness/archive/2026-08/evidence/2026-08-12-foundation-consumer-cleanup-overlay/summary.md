# Evidence Summary

Real Ops business smoke against `pantheon-base-v0.10.17` exposed a destructive consumer gap: the Base-owned pre/post smoke cleanup treated every directory under `business/*` as generated and deleted the tracked Ops `bizscope`, `cmdb`, `deploy`, and `shared` overlays before Playwright started.

The cleanup now uses the consumer repository Git index as the ownership boundary. Tracked business source, schemas, registries, and generated i18n baselines are preserved; only untracked QA-generated artifacts are removed, including generated modules nested under a tracked domain. Producer tests and a direct real-Ops consumer validation pass. Final exact-commit GitHub gates, immutable `v0.10.18` publication, and Ops business smoke remain pending.
