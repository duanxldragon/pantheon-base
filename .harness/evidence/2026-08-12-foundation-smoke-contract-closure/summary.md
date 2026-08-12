# Evidence Summary

Ops consumption of v0.10.15 proved that Base-owned smoke specifications were synchronized while smoke npm entrypoints and the coverage matrix remained stale. Consumption of v0.10.16 then proved that the Ops smoke web-base guard was also an unowned historical residual and rejected Base's hard-coded auto-recycle proxy target.

The producer now owns the package, smoke coverage matrix, and smoke web-base guard as one contract. The auto-recycle entry follows `PANTHEON_API_PROXY_TARGET` through the shared Playwright/runtime helpers instead of hard-coding port 8080. Foundation tests, smoke contract checks, lint, type-check, and production build pass locally. Exact-commit remote gates and immutable v0.10.17 publication remain pending.
