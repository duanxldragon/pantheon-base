# v0.16.0 Release Closeout — Summary

## Version decision

**Minor bump → `pantheon-base-v0.16.0`.**

`docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 lists *架构优化（不影响消费仓）* and *质量门禁增强* as
minor-version triggers. Two of the six changes merged after v0.15.0 fall squarely in those
categories, so the release is a minor, not a patch:

| PR | Type | Minor rationale | Consumer impact |
| --- | --- | --- | --- |
| #371 | `refactor` | 架构优化（不影响消费仓）：Go 包名 == 目录名；前端模块镜像后端三层结构；core 单数化 + `AppLayout.tsx` | none — no import path, route, permission code, menu seed or contract shape moved |
| #373 | `refactor(tests)` | 质量门禁增强：冒烟分层 L0–L3 + 按模块拆分 + 路径驱动选层 | none |
| #372 | `refactor(tests)` | 测试去重复 | none |
| #374 | `fix(tests)` | 清除拆分浮出的 17 条 SonarCloud 异味 | none |
| #370 | `fix(deps)` | 清除 Dependabot #43（`sprintf-js` DoS，**dev-only**） | none |
| #375 | `chore` | 删除空 `openspec/` 骨架 | none |

§2.4 (patch) is limited to security/bug fixes; only #370 qualifies there and it is a dev-only
dependency, too thin to justify a patch release on its own. Per §2.3, the naming correspondence
and smoke tiering put this release on a **minor**.

## Release scope (v0.15.0 → v0.16.0)

- **Naming / directory correspondence** (#371): `package <dir-leaf>` across
  `system/{iam,org,config,audit,i18n}`; `frontend/src/modules/system/*` mirrors the backend's
  three-level layout; `core/permissions → core/permission`, `core/settings → core/setting`,
  `core/layout/index.tsx → core/layout/AppLayout.tsx`, five PascalCase non-component `.ts` files
  to camelCase, plus a shared-layer path alias.
- **Tiered, module-split smoke suite** (#372/#373/#374): `system-pages.spec.ts` split into
  per-module specs over `system-pages-helpers.ts`; tiers L0 (static, in `prebuild`), L1 (critical
  path, blocking every PR), L2 (per-module, blocking for touched modules), L3 (full, report-only);
  new `scripts/resolve-smoke-modules.mjs` (13 unit tests) and the `pr-smoke-modules` CI job.
- **Hygiene** (#370/#374/#375): dev-dependency DoS cleared; 17 SonarCloud smells cleared; empty
  `openspec/` removed.

## Consumer impact

None. `pantheon-ops` consumes immutable tags and upgrades minor versions on demand
(`docs/designs/FOUNDATION_RELEASE_MODEL.md` §2.2). No base-side interface changed, so no migration
is required beyond the v0.15.0 upgrade path.

## Artifacts produced

- `VERSION` = 0.16.0
- `RELEASE_NOTES_v0.16.0.md`
- `CHANGELOG.md` entry `[pantheon-base-v0.16.0] — published (2026-10-12)`
- `README.md` / `README.en.md` version tables and delivery-status line
- `.harness/STATUS.md` version + release-closeout section
- immutable tag `pantheon-base-v0.16.0` + GitHub Release (body = release notes)

## Residual risks

1. **No mechanical gate pins README/STATUS/CHANGELOG text to `VERSION`.** Version alignment is
   upheld by review; a future release could drift. Mitigation: the completion checklist greps the
   four version references.
2. **`tests/` is still not type-checked or linted in CI** (69 pre-existing `tsc` errors recorded
   in the PR #373 work). Carried forward unchanged; not in scope for this release.
3. **The `TestDataScopeMiddlewareInjectsRoleDeptScope` Go test is a recurring flake** (temporary
   test-DB migration race). It has twice needed a rerun; unrelated to this release but it can
   redden a main run randomly.
