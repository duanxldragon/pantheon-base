---
title: depguard 边界规则包路径与实际 module 路径对齐
doc_type: Remediation
layer: platform
status: Archived
updated_at: 2026-11-24
linked_contracts:
  - docs/designs/REPOSITORY_LAYOUT.md
---

# Task Packet: 2026-11-24-golangci-depguard-boundary-paths

## Goal

让 `backend/.golangci.yml` 的 `business-boundary` depguard 规则匹配真实 Go module 路径，并以回归测试防止再次退化为空转规则；为 Ops 通过 foundation release 消费该修复准备唯一来源。

## Primary Layer

platform

## Workspace Context

- Target Repository: pantheon-base
- Repository Role: foundation-source
- Upstream Dependencies: pantheon-harness
- Downstream Consumers: pantheon-ops
- Sync Expectation: deferred
- Release Requirement: foundation-release

## Dependency Layers

仓库级工程配置与门禁语义；platform / system 产品行为不变。

## Harness Profile

- Template: custom
- Overlay: pantheon-base
- Quality Profile: none
- Delivery Tier: L2
- Coverage Dimensions:
  - architecture-fitness
  - maintainability
  - method-health

## Contract Anchors

- `AGENTS.md`
- `.harness/STATUS.md`
- `docs/designs/REPOSITORY_LAYOUT.md`（跨层导入规则 §8.2）
- `scripts/harness/check-boundaries.mjs`（同一规则的运行时门禁）
- `backend/go.mod`

## Scope

### In

- `backend/.golangci.yml` 三条 deny `pkg` 改为真实 module 前缀
- 新增 `tests/scripts/golangci-depguard-paths.test.mjs`，锁定 deny 路径与 `backend/go.mod` 一致，并覆盖 system/auth/platform 三个域
- 用临时探针包证明规则修复前不生效、修复后生效，随后删除探针

### Out

- `scripts/harness/check-boundaries.mjs` 规则与基线（已生效，不改）
- 业务代码、system 域实现、权限/菜单/i18n/schema/seed
- Ops 侧 `backend/.golangci.yml` 消费（须经正式 foundation release 与重建，本包不手改下游）
- 正式发布、版本号、release 资产与下游 lock

## Expected Files

### Create

- `docs/harness/tasks/2026-11-24-golangci-depguard-boundary-paths.task.md`
- `.harness/tasks/2026-11-24-golangci-depguard-boundary-paths/manifest.json`
- `.harness/evidence/2026-11-24-golangci-depguard-boundary-paths/commands.json`
- `.harness/evidence/2026-11-24-golangci-depguard-boundary-paths/summary.md`
- `.harness/evidence/2026-11-24-golangci-depguard-boundary-paths/review.md`
- `tests/scripts/golangci-depguard-paths.test.mjs`

### Modify

- `backend/.golangci.yml`

### Do Not Touch

- `backend/modules/**`
- `backend/pkg/**`
- `scripts/harness/check-boundaries.mjs`
- `VERSION`、`foundation-release.lock.json`、release 资产
- `.harness/STATUS.md` 之外他人未提交改动
- `pantheon-ops/**`

## Implementation Notes

- Minimal Complexity Rung: 复用既有 depguard 与既有 `check-boundaries` 规则，不新增运行期检查器
- 回归测试用 `node --test`，由既有 `npm run test:scripts` 的 `tests/scripts/*.test.mjs` glob 自动纳入，无需改动 CI 配置
- 只正则解析 `deny: - pkg:` 行，不引入 YAML 依赖
- 探针包仅用于证明修复前后行为差异，验证后删除，不进入提交

## Verification Plan

- `node --test tests/scripts/golangci-depguard-paths.test.mjs`，工作目录仓库根（修复前 RED、修复后 GREEN）
- `golangci-lint run ./modules/business/zz_depguard_probe/...`，工作目录 `backend`（修复前 0 issues，修复后 1 depguard issue）
- `golangci-lint run ./modules/business/...`，工作目录 `backend`（确认现有业务代码无新增 depguard 命中）

- `golangci-lint config verify` 需联网拉取 JSON schema，本机离线失败，登记为环境 gap，不作为配置错误
- 不涉及接口/权限/菜单/i18n/数据库，无需 runtime smoke

## Linkage

- Task ID: 2026-11-24-golangci-depguard-boundary-paths
- Task Manifest: .harness/tasks/2026-11-24-golangci-depguard-boundary-paths/manifest.json
- Evidence Directory: .harness/evidence/2026-11-24-golangci-depguard-boundary-paths/
- Review File: .harness/evidence/2026-11-24-golangci-depguard-boundary-paths/review.md
- Change Ref: none
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: none

## Evidence Required

- commands.json 含真实状态、cwd、退出码与探针前后对比
- summary.md 记录 RED/GREEN、现有业务代码回归结果与 release 消费 gap
- review.md 为 findings-first 自审并含机器可读 linkage

## Human Gates

- 正式 foundation release 发布、版本号与下游 lock 更新需维护者授权
- Ops 侧消费验证须在新 release 后单独执行

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
