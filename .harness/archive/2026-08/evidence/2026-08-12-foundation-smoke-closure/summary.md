# Evidence Summary

Pantheon Ops business smoke exposed a 404 in the generated master-detail route after consuming `pantheon-base-v0.10.14`. The product source was aligned, but generic generated-business setup, Playwright configuration, cleanup helpers, and smoke specifications were outside the release manifest and remained stale in Ops.

The producer manifest and ownership gate now treat that executable QA chain as one shared closure. The closure owns the runtime Playwright configurations, generator setup and cleanup scripts, their helpers, and the complete generic `helpers`, `platform`, `system`, and `business/generated` smoke directories.

The Ops consumer was upgraded in parallel to expand manifest-owned directories, compare every file, remove obsolete files from Base-owned directories, and restore them on rollback. It retains compatibility with older releases that listed individual files.

Local producer tests pass 22/22. Local consumer sync tests pass 5/5 and consumer tests pass 24/24. Publication and downstream runtime evidence remain pending.
