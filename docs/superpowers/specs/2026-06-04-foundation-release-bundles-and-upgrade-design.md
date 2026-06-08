---
title: Foundation Release Bundles and Upgrade Design
doc_type: Design
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
  - system/org
  - system/config
  - system/lowcode
status: Approved
index_group: superpowers-specs
retention_reason: 将 foundation release 文档模型落成可执行的 release metadata、bundle 和 consumer upgrade 脚本
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/designs/FOUNDATION_RELEASE_MODEL.md
  - docs/designs/WORKFLOW.md
  - docs/acceptances/CODE_REVIEW_STANDARD.md
updated_at: 2026-06-05
---

# Foundation Release Bundles and Upgrade Design

## 1. 目标

本轮要把 `pantheon-base` 的 foundation release 模型从“只有文档约定”推进到“有实际产物、有脚本入口、下游可消费”。

目标包括：

1. 在 `pantheon-base` 内生成可审计的 release metadata
2. 在 `pantheon-base` 内生成可被脚本消费的 release bundle
3. 在 `pantheon-ops` 内提供基于 release manifest 的 upgrade 脚本
4. 继续复用现有 inheritance / drift / sync checks，不另起一套并行治理机制
5. 让后续 `pantheon-base/main` 的持续优化可以通过标准 release 被 `pantheon-ops` 有边界地吸收

本轮不做：

1. 自动创建 GitHub Release
2. 自动 push tag
3. 自动修改 `pantheon-ops` 业务代码
4. 自动提交 release 目录

---

## 2. 设计结论

### 2.1 双层 release 资产

`pantheon-base` 的 release 资产分成两层：

1. **仓库内长期记录层**
   - 路径：`releases/<version>/`
   - 用途：review、审计、回溯、作为 consumer 的长期引用面
2. **本地 bundle 构建层**
   - 路径：`dist/foundation-releases/<version>/`
   - 用途：脚本消费、临时打包、升级演练、后续压缩归档

这样可以避免两种坏结果：

1. 只有 `dist/`，长期协作无法审计
2. 把所有构建输出都提交进 git，仓库持续膨胀

### 2.2 Release metadata 是 release contract

`releases/<version>/` 下至少要有：

1. `manifest.json`
2. `release-notes.md`
3. `upgrade-notes.md`
4. `consumer-impact.md`
5. `verification-summary.json`

其中真正给脚本读取的主入口是 `manifest.json`。

其他文档是 reviewer 和 consumer 仓开发者读的解释层，不让关键信息散落在聊天记录里。

### 2.3 Bundle 是 machine-consumable release snapshot

`dist/foundation-releases/<version>/` 下至少要有：

1. `manifest.json`
2. `verification-summary.json`
3. `bundle/manifest.paths.json`
4. `bundle/shared-backend/`
5. `bundle/shared-frontend/`（若本轮纳入）
6. `bundle/docs/`
7. 可选压缩包，例如 `pantheon-base-<version>.zip`

bundle 不追求“把整个仓库打包给 ops”，而是只暴露 consumer upgrade 需要的共享面。

### 2.4 Consumer upgrade 以 manifest 驱动

`pantheon-ops` 的升级不再靠人工去猜“base 这次改了哪些共享文件”，而是：

1. 读取指定 release 的 `manifest.json`
2. 根据 `sharedPaths` / `releaseLine` / `baseCommit` / `compatibility` 决定升级范围
3. 运行现有 `check:inheritance`、`check:base-sync` 与 overlay drift checks
4. 输出升级摘要，不自动提交

升级脚本默认只负责：

1. 读取 release
2. 校验输入
3. 可选复制共享文件
4. 更新 `docs/PROJECT_INHERITANCE.md` 里的锚点
5. 运行最小检查

它不负责静默吞掉 drift，也不负责偷偷修业务代码。

---

## 3. 资产结构

### 3.1 `pantheon-base/releases/<version>/`

建议目录如下：

```text
releases/
  base-v0.8.0/
    manifest.json
    release-notes.md
    upgrade-notes.md
    consumer-impact.md
    verification-summary.json
```

`manifest.json` 建议字段：

```json
{
  "schemaVersion": 1,
  "releaseVersion": "base-v0.8.0",
  "releaseLine": "release/0.8",
  "baseCommit": "0b06ee40ae2a281bf2a0004343368599a326bc67",
  "createdAt": "2026-06-04T12:00:00Z",
  "sourceRepo": "pantheon-base",
  "consumerMode": "foundation-release-consumer",
  "sharedPaths": {
    "backend": ["backend/cmd", "backend/internal", "backend/modules", "backend/pkg"],
    "frontend": ["frontend/src/core", "frontend/src/components", "frontend/src/modules/system"],
    "docs": ["docs/designs/FOUNDATION_RELEASE_MODEL.md", "docs/designs/WORKFLOW.md"]
  },
  "verification": {
    "summaryFile": "verification-summary.json",
    "requiredChecks": ["go test", "frontend build", "inheritance contract"]
  },
  "consumerCompatibility": {
    "pantheon-ops": {
      "minimumCurrentRelease": "release/0.8",
      "notesFile": "consumer-impact.md"
    }
  }
}
```

### 3.2 `pantheon-base/dist/foundation-releases/<version>/`

建议目录如下：

```text
dist/
  foundation-releases/
    base-v0.8.0/
      manifest.json
      verification-summary.json
      bundle/
        manifest.paths.json
        shared-backend/
        shared-frontend/
        docs/
      pantheon-base-base-v0.8.0.zip
```

`bundle/manifest.paths.json` 只描述 bundle 内的物理落点和来源路径，不重复承载 release 语义。

### 3.3 `pantheon-ops` 消费锚点

`pantheon-ops/docs/PROJECT_INHERITANCE.md` 继续作为人工可读锚点，至少维护：

1. `Base release line`
2. `Base version`
3. `Inheritance mode`

脚本不把它当唯一真相，而是把它当“应与 manifest 对齐的声明面”。

---

## 4. 脚本设计

### 4.1 `pantheon-base` cut-release 脚本

新增脚本：

- `scripts/foundation-release/build-release-manifest.mjs`
- `scripts/foundation-release/build-release-bundle.mjs`
- `scripts/foundation-release/cut-foundation-release.mjs`

职责拆分：

1. `build-release-manifest.mjs`
   - 根据参数生成 `releases/<version>/manifest.json`
   - 根据 CLI 输入或预置文本源生成 `release-notes.md` / `upgrade-notes.md` / `consumer-impact.md` 初始文档
   - 生成 `verification-summary.json`
2. `build-release-bundle.mjs`
   - 根据 manifest 把共享路径复制到 `dist/foundation-releases/<version>/bundle/`
   - 复制 machine-readable metadata
   - 可选生成 zip
3. `cut-foundation-release.mjs`
   - 作为统一入口
   - 先校验参数，再串联 manifest + bundle 构建
   - 最后输出 release summary

### 4.2 `pantheon-base` npm scripts

在 `pantheon-base/package.json` 中补：

```json
{
  "scripts": {
    "release:foundation:manifest": "node scripts/foundation-release/build-release-manifest.mjs",
    "release:foundation:bundle": "node scripts/foundation-release/build-release-bundle.mjs",
    "release:foundation:cut": "node scripts/foundation-release/cut-foundation-release.mjs"
  }
}
```

### 4.3 `pantheon-ops` consume-upgrade 脚本

新增脚本：

- `scripts/foundation-release/consume-foundation-release.mjs`

它接收：

1. `--manifest <path>`
2. `--bundle <path>`
3. `--apply-shared-backend`
4. `--apply-shared-frontend`
5. `--update-inheritance-docs`
6. `--check`

默认行为建议是 dry-run，显式传 `--apply-*` 才做文件复制。

### 4.4 `pantheon-ops` npm scripts

在 `pantheon-ops/package.json` 中补：

```json
{
  "scripts": {
    "upgrade:foundation:plan": "node scripts/foundation-release/consume-foundation-release.mjs --check",
    "upgrade:foundation:apply": "node scripts/foundation-release/consume-foundation-release.mjs --apply-shared-backend --update-inheritance-docs --check"
  }
}
```

---

## 5. 与现有检查链的集成

### 5.1 不替换现有 checks

以下现有入口继续保留，并作为 release / upgrade 的后置 gate：

1. `pantheon-ops/scripts/check-inheritance-contract.mjs`
2. `pantheon-ops/scripts/check-base-backend-sync.mjs`
3. `harness-engineering/pantheon-overlay/scripts/harness/check-overlay-health.mjs`
4. `harness-engineering/pantheon-overlay/scripts/harness/triage-base-drift.mjs`

### 5.2 release 侧最小检查

`cut-foundation-release.mjs` 至少校验：

1. `releaseVersion` 与 `releaseLine` 参数合法
2. `baseCommit` 可解析
3. 必需 metadata 文件存在或可生成
4. bundle 中声明的共享路径真实存在

本轮不把完整 runtime 测试硬编码进 cut 脚本，因为你的当前节奏是“先把机制落成，再决定在哪个分支/时机做验证”。

### 5.3 upgrade 侧最小检查

`consume-foundation-release.mjs` 在 `--check` 下至少执行：

1. manifest schema 校验
2. inheritance doc 锚点一致性检查
3. backend sync 检查
4. overlay drift triage

如果未来要扩展 frontend shared sync，也在同一脚本里加开关，不额外裂出第二套入口。

---

## 6. 文件边界

### 6.1 本轮新增

`pantheon-base`：

- `scripts/foundation-release/build-release-manifest.mjs`
- `scripts/foundation-release/build-release-bundle.mjs`
- `scripts/foundation-release/cut-foundation-release.mjs`
- `tests/scripts/foundation-release/*.test.mjs`
- `releases/.gitkeep` 或首个示例 release
- `docs/archive/upgrade/FOUNDATION_RELEASE_RUNBOOK_20260604.md`

`pantheon-ops`：

- `scripts/foundation-release/consume-foundation-release.mjs`
- `tests/scripts/foundation-release/*.test.mjs`

必要时从 `harness-engineering/pantheon-overlay/` 补通用 helper，但优先避免把 release 逻辑继续分散到第三处。

### 6.2 本轮修改

`pantheon-base`：

- `package.json`
- `docs/designs/FOUNDATION_RELEASE_MODEL.md`
- `docs/designs/FOUNDATION_RELEASE_MODEL.en.md`
- `docs/designs/WORKFLOW.md`
- `docs/designs/WORKFLOW.en.md`

`pantheon-ops`：

- `package.json`
- `docs/PROJECT_INHERITANCE.md`
- `docs/PROJECT_INHERITANCE.en.md`
- `README.md`
- `README.en.md`

---

## 7. 错误处理

### 7.1 cut-release 失败条件

以下情况直接失败：

1. `releaseVersion` 未提供
2. `releaseLine` 未提供
3. `baseCommit` 不是当前仓可解析 commit
4. `releases/<version>/` 已存在且未显式允许覆盖
5. bundle 共享路径缺失

### 7.2 consume-release 失败条件

以下情况直接失败：

1. manifest 缺字段
2. `consumerMode` 不是 `foundation-release-consumer`
3. `sourceRepo` 不是 `pantheon-base`
4. 目标共享路径不存在且无法安全写入
5. `check:inheritance` 或 `check:base-sync` 失败

### 7.3 不自动吞错误

任何“共享层 drift 已经存在”的情况，都必须显式打印出来，不允许脚本自动改到绿为止。

脚本目标是把升级变成可审查的流程，而不是把风险藏起来。

---

## 8. 验证策略

### 8.1 `pantheon-base` 测试

用 Node 原生测试覆盖：

1. manifest 生成
2. bundle 复制清单
3. 参数校验
4. 重复 cut 保护

### 8.2 `pantheon-ops` 测试

用 Node 原生测试覆盖：

1. manifest 解析
2. inheritance doc 更新
3. dry-run 输出
4. apply 模式下的共享文件复制

### 8.3 暂不要求的验证

本轮不要求：

1. 真正切 tag
2. 真正 push release branch
3. 真正删除 `pantheon-ops` 现有后台模块
4. 真正跑完整业务 smoke

---

## 9. 风险与控制

### 风险 1：release metadata 与真实代码不一致

控制：

1. bundle 从 manifest 反推，不手写路径
2. `cut-foundation-release` 统一入口生成所有产物

### 风险 2：consumer 脚本把 ops 改成隐式 fork

控制：

1. 默认 dry-run
2. apply 需要显式开关
3. apply 后立即跑现有 drift / inheritance checks

### 风险 3：仓库里堆满大体积构建产物

控制：

1. 长期记录只放轻量 metadata
2. bundle 放 `dist/`
3. 压缩包默认本地生成，不默认纳入 git

### 风险 4：release 机制与 overlay 治理各自一套口径

控制：

1. release 只负责“发布什么”
2. overlay checks 继续负责“升级后是否对齐”
3. 两者通过 manifest 和现有检查链耦合，不重复造规则

---

## 10. 本轮建议实施顺序

1. 先在 `pantheon-base` 落 manifest builder 和 bundle builder
2. 再补 `cut-foundation-release` 统一入口
3. 然后在 `pantheon-ops` 落 consume-upgrade 脚本
4. 最后补文档 runbook 和 npm script

这样可以先把发布侧做扎实，再做消费侧，避免两边一起散开。
