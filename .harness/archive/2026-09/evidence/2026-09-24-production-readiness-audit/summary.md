# Evidence Summary: Pantheon Base 生产交付审查

**Task ID**: 2026-09-24-production-readiness-audit  
**Date**: 2026-09-24  
**Scope**: `pantheon-base` 全局安全、质量、性能与 `pantheon-ops` 继承评估

## 结论

代码质量达到候选交付水平；当前不能直接作为正式 foundation release，也不能直接更新到 `pantheon-ops`。

主要阻断项：Base 当前整改尚未形成新的正式 foundation release；Ops 仍锁定旧的 `pantheon-base-v0.10.25`，当前 Ops 工作树删除或缺少 `foundation-release.lock.json`、`business-overlay.json` 与 overlay 重建脚本，并存在大量未提交改动。

## 已验证通过

- `go test ./...`
- `go vet ./...`
- `npm run type-check`
- `npm run lint`
- `npm run build`
- `npm audit --audit-level=high`：0 vulnerabilities
- frontend prebuild contracts：menu、i18n、datetime、shell/UI、SearchToolbar、important budget、page admission、smoke web base、smoke coverage、import path case 全部通过
- CodeGraph：805 files、12,939 nodes、29,055 edges，index up to date

## 关键发现

| Severity | Area | Finding | Evidence |
| --- | --- | --- | --- |
| High | Release | 当前没有与本轮整改对应的正式 foundation release；`v0.13.0` 仍为准备中 | `.harness/RELEASE_v0.13.0_PREP.md`；`README.md` 仍声明最新已发布为 `pantheon-base-v0.11.0` |
| High | Inheritance | Ops HEAD 的 lock 仍指向 `pantheon-base-v0.10.25`，且 lock 中 `baseCommit=e7bd...` 与 Base manifest 的 `3008d...` 不一致 | `pantheon-ops/foundation-release.lock.json`；`pantheon-base/releases/pantheon-base-v0.10.25/manifest.json` |
| High | Inheritance | Ops 当前工作树删除 `foundation-release.lock.json`、`business-overlay.json` 和 `.business-overlay-report.json`，且 overlay checker/rebuild 脚本缺失 | `git status --porcelain`；`pantheon-ops/scripts/business-overlay/` |
| High | Delivery | Ops 工作树有 269 条未提交变化，不能安全覆盖或重建 | `pantheon-ops` working tree status |
| Medium | Runtime | 未建立多实例 setting 缓存失效运行态证据 | `.harness/STATUS.md` 显式残余 Gap |
| Medium | Performance | 未建立并发容量与尾延迟 SLA 基线 | `.harness/STATUS.md` 显式残余 Gap |
| Medium | CI | CI 尚缺完整 MySQL/Redis 集成 smoke 证据 | `.harness/STATUS.md` 显式残余 Gap |
| Low | Build | Vite 报 `__dirname` 与未来 `configLoader: native` 兼容性警告 | `frontend/vite.config.ts:40` |

## 生产配置证据

- `PANTHEON_DSN` 缺失时服务 fail-fast。
- 生产环境或显式 `PANTHEON_REDIS_REQUIRED=true` 时，Redis 地址缺失会 fail-fast。
- 生产环境必须设置 `PANTHEON_INITIAL_ADMIN_PASSWORD`，长度至少 12 位。
- 指标端点要求 bearer token，或必须显式开启公开模式。
- 导出路径统一存在 10,000 行上限，列表接口存在分页上限。

## 未验证或需 release 前复核

- govulncheck、CodeQL、SonarCloud、GitHub required checks 的本轮新鲜结果
- 多实例缓存失效和真实生产容量压测
- CI MySQL/Redis 集成 smoke
- 新 foundation bundle、repo snapshot、manifest、SHA-256 sidecar 是否已正式发布

## 放行条件

1. 将 Base 当前变更合并到正式 `main`，完成 release gate。
2. 创建不可变 foundation release 及完整发布资产。
3. 恢复并校验 Ops 的 lock、overlay、checker 和 deterministic rebuild 流程。
4. 更新 Ops lock 到正式 release，重建 repo snapshot，执行 overlay check 与业务 smoke。
5. 在 Ops 干净工作树中完成升级并留存证据。
