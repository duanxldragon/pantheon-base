# Summary — 2026-07-25-sonar-small-buckets

22 SonarCloud OPEN findings fixed in code, none suppressed:

| File | Rule | Fix |
|---|---|---|
| Dockerfile | docker:S7018 ×2 | apk package lists sorted alphanumerically |
| Dockerfile | docker:S7031 | user-creation and directory RUN merged into one layer |
| frontend/index.html | javascript:S2486 | try now wraps only the storage read; catch sets an explicit null fallback and the media-query default applies even when storage throws (strict improvement) |
| frontend/index.html | javascript:S3358 | nested ternary in `isKnownNoise` rewritten as if/returns |
| backend/start-dev.sh | shelldre:S7688 ×2 | `[` → `[[` |
| backend/start-dev.sh | shelldre:S7677 | startup error echoed to stderr |
| full-page-audit.spec.ts | typescript:S2925 ×3 | 1500ms waits → sider visibility + networkidle / networkidle only; 500ms dialog wait → CSS animation-finish wait + `animations: 'disabled'` screenshot |
| shell-visual-contract.spec.ts | typescript:S2925 ×2 | 250ms/100ms style-settle waits → `getAnimations({subtree}).finished` waits on the element being measured |
| system-pages.spec.ts | typescript:S2925 | post-logout 1s wait → login-page networkidle before the negative message assertion |
| auth-smoke-helper.test.ts | typescript:S2925 | 50ms wait → double-rAF flush so queued error events deliver before the negative assertion |
| coverage.ts | typescript:S2245 | fixture filename entropy: Math.random → node:crypto randomUUID |
| system-workspace-task-depth.ts | typescript:S7780 | escaped RegExp source → String.raw |
| load/spike/stress-test.js | javascript:S7726 ×3 | k6 default exports named (loadScenario/spikeScenario/stressScenario) |
| stress-test.js | javascript:S2245 ×2 | random case pick / random sleep → deterministic (__VU+__ITER) rotation and 1–3s staggered think time (reproducible load shape) |

## Verification

- `tsc --noEmit` (frontend, includes tests): clean.
- Smoke Sanity on the PR exercises the edited shell-visual-contract and
  system-pages waits directly; full-page-audit is a manual QA sweep, not a CI
  gate (header comment in the file).
- k6 scripts are load-tooling executed manually; the rotation change keeps the
  1/3-per-case distribution while making runs reproducible.
