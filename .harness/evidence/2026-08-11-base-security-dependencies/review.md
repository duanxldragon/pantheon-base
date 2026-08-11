# Review: 2026-08-11-base-security-dependencies

## Findings

- `js-yaml@3.15.0` was a high-severity transitive dependency of `nyc`; pinning `3.15.1` removes GHSA-5p4m-2wfm-xmqj.
- `nanoid@3.3.16` was a high-severity transitive dependency of Vite/PostCSS; pinning `3.3.17` removes its infinite-loop advisory.

## Residual Risk

- No high or critical npm audit findings remain. The release must be cut from the merged `main` commit and consumed by Ops.
