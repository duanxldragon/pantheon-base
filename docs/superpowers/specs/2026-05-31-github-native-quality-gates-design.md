---
title: GitHub Native Quality Gates Design
doc_type: Design
layer: platform
depends_on_layers:
  - system/auth
  - system/iam
  - system/org
  - system/config
  - system/audit
  - system/lowcode
status: Approved
index_group: superpowers-specs
retention_reason: 将 Sonar 迁出主门禁，收敛为 GitHub 原生质量门，并把低代码烟测产物纳入强制清理策略
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/designs/WORKFLOW.md
  - docs/acceptances/CODE_REVIEW_STANDARD.md
  - docs/acceptances/ACCEPTANCE_CHECKLIST.md
  - docs/GITHUB_REPOSITORY_SETUP.md
  - docs/GITHUB_GOVERNANCE_CHECKLIST.md
updated_at: 2026-05-31
---

# GitHub Native Quality Gates Design

## 1. 目标

本轮设计把 `pantheon-base` 的质量审查从 “Sonar + GitHub checks 双轨” 收口为 “GitHub 原生门禁单轨”。

目标包括：

1. 移除 Sonar 作为 required check 和治理文档里的硬依赖
2. 用 GitHub Actions + Branch Protection 形成唯一的合并门禁
3. 将全库重复率控制目标固定为 `<= 3%`
4. 把 `business/cmdb` 和其他低代码烟测产物定义为临时产物，烟测结束后必须清理
5. 避免重复分析、重复修复、重复口径继续消耗开发时间

---

## 2. 设计结论

### 2.1 质量门禁总原则

质量门禁只保留 GitHub 原生能力：

- GitHub Actions 负责执行检查
- Branch Protection 负责强制门禁
- CODEOWNERS 负责路由 reviewer
- CodeQL / dependency review / secret scan / lint / test / duplication 负责具体规则

不再把 Sonar 作为主分支分析的强制依赖，也不把 Sonar 结果写入规范性门禁。

### 2.2 全库重复率口径

重复率目标采用“仓库质量范围”而不是“所有物理文件无差别统计”。

纳入重复率门禁的范围：

- `backend/**`
- `frontend/src/**`
- `frontend/scripts/**`
- `scripts/**`
- `tests/**`
- `.github/workflows/**`

显式排除的范围：

- `node_modules`、`dist`、`.git`、构建产物
- `*.generated.*`、生成注册表、schema 生成目录
- 低代码烟测产物目录和临时生成目录
- 翻译资源数据集和 overrides 资源

原因很直接：这些目录一旦被当成“真实重复代码”统计，会把指标完全拖偏，导致重复率不再代表可维护代码质量。

### 2.3 低代码烟测产物治理

`business/cmdb` 的定位收紧为烟测样板，不作为 base 长期保留代码的审查对象。

原则：

- `business/cmdb` 可以作为烟测输入、生成样板和临时验证对象
- 但烟测结束后，生成的业务代码、注册表、schema 和 i18n 资源必须清理
- 任何 smoke 流程如果留下生成物，都视为流程失败

### 2.4 门禁组合

主门禁建议固定为：

- `Quality Gates`
- `Security Gates`
- `Duplication Gate`
- `Docs Governance`
- `Frontend Contract`
- `Backend Tests`

其中：

- `Quality Gates` 负责前后端 lint / build / smoke / contract
- `Security Gates` 负责 CodeQL、依赖漏洞、secret scan、workflow posture
- `Duplication Gate` 负责全库重复率 `<= 3%`

---

## 3. 范围边界

### 3.1 主层：`platform`

`platform` 负责：

- 仓库级质量门禁结构
- Branch Protection 口径
- PR 模板和治理文档
- 重复率门禁和 GitHub 原生检查聚合
- 低代码烟测产物清理策略

它不负责：

- 具体业务域的 schema 设计
- 某个业务模块的页面细节
- 某条安全规则的产品语义

### 3.2 依赖层：`system/lowcode`

`system/lowcode` 负责：

- 生成器、动态模块、低代码烟测脚本的临时产物清理
- 临时生成目录、注册表、schema、i18n 资源的重置

它不负责：

- 长期保留的业务产品代码
- base 仓库里常驻的业务模块演化

### 3.3 依赖层：`system/auth` / `system/iam` / `system/org` / `system/config` / `system/audit`

这些层继续按原合同提供自身的功能验证和安全边界，不承担仓库级质量门禁的定义责任。

### 3.4 非目标

本轮不做：

- 再引入新的第三方综合质量平台
- 重新设计业务域合同
- 全量重构所有历史重复代码
- 变更产品视觉风格

---

## 4. GitHub 原生门禁设计

### 4.1 Workflow 分层

把现有 workflow 收敛为三类：

1. `quality.yml`
2. `security.yml`
3. `duplication.yml` 或同等逻辑的 duplication job

其中：

- `quality.yml` 负责本地开发者最常跑的代码质量和构建门禁
- `security.yml` 负责安全报告和安全门禁
- `duplication.yml` 负责全库重复率门禁

### 4.2 Branch Protection

`main` 和 `release/*` 必须启用：

- pull request only
- required reviews
- code owner review
- dismiss stale approvals
- conversation resolution
- required status checks

required checks 应只保留 GitHub 原生门禁名，不再要求 Sonar。

### 4.3 PR 模板

PR 模板里的 Sonar 相关勾选项和结果字段必须移除或改写成 GitHub 原生检查：

- GitHub checks 结果
- Duplication gate 结果
- Security gate 结果
- 独立 reviewer 结果

---

## 5. 重复率门禁设计

### 5.1 工具选择

选用 `jscpd` 作为仓库级重复检测工具。

理由：

- 可直接跑全仓库
- 可输出机器可读结果
- 容易在 GitHub Actions 中强制失败
- 能针对生成目录、测试目录、资源目录做显式排除

### 5.2 门禁规则

固定阈值：

- 全库总重复率 `<= 3%`

门禁触发条件：

- 任一重复率超阈值即失败
- 任一新增的重复片段出现在非生成目录，也必须失败

### 5.3 统计范围

纳入重复率扫描的仓库目录：

- `backend`
- `frontend/src`
- `frontend/scripts`
- `scripts`
- `tests`
- `.github/workflows`

排除项：

- `frontend/src/i18n/resources/**`
- `frontend/src/modules/generated/**`
- `frontend/src/modules/business/**`
- `backend/modules/business/generated_registry.go`
- `backend/modules/system/iam/menu/generated_component_registry.go`
- `schema/generated/**`
- `**/dist/**`
- `**/node_modules/**`
- `**/.codegraph/**`
- `**/*.generated.*`
- 测试 fixture 和纯数据资产目录

### 5.4 清债原则

重复率目标不能靠“扩大排除”硬做出来。

允许排除：

- 生成物
- 数据资产
- 测试 fixture

不允许排除：

- 真正的业务代码重复
- 重复的列表页、表单页、API 封装、权限判断、清理逻辑

---

## 6. 低代码烟测清理设计

### 6.1 `business/cmdb` 的定位

`business/cmdb` 只作为烟测样板和低代码产物验证样本存在，不作为 base 的长期产品代码口径。

这意味着：

- 烟测期间可以生成、执行、验证
- 烟测结束后必须清理
- 不允许因为“烟测可用”就把临时代码留在主分支里

### 6.2 清理责任

现有清理脚本要升级为强制收口：

- `frontend/scripts/cleanup-generated-modules.mjs`
- `frontend/scripts/cleanup-smoke-fixtures.mjs`

需要补齐的行为：

- smoke 前先清一次，避免历史残留干扰
- smoke 后再清一次，保证产物不回写到仓库状态
- 若 cleanup 后仍存在生成目录、注册表、schema 或 i18n 生成内容，直接失败

### 6.3 清理对象

至少包括：

- `backend/modules/business/generated_registry.go`
- `frontend/src/modules/generated/business.ts`
- `frontend/src/core/router/generatedComponentRegistry.ts`
- `backend/modules/business/*` 内 smoke 生成的临时模块目录
- `frontend/src/modules/business/*` 内 smoke 生成的临时前端模块目录
- `schema/generated/business/*`
- `frontend/src/i18n/resources/generated/*`
- smoke 过程导入的临时角色、用户、部门、岗位、字典、i18n、权限

### 6.4 成功标准

一次烟测结束后：

- `git status` 不应残留生成物
- 生成注册表必须回到 baseline
- 低代码产物目录必须为空或回到预期模板
- 重复率扫描不应被 smoke 产物污染

---

## 7. 文档同步设计

必须同步更新的文档：

- `docs/GITHUB_REPOSITORY_SETUP.md`
- `docs/GITHUB_REPOSITORY_SETUP.en.md`
- `docs/GITHUB_GOVERNANCE_CHECKLIST.md`
- `docs/GITHUB_GOVERNANCE_CHECKLIST.en.md`
- `docs/acceptances/CODE_REVIEW_STANDARD.md`
- `docs/acceptances/CODE_REVIEW_STANDARD.en.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

同步原则：

- 去掉 Sonar 作为 required check 的描述
- 把 GitHub 原生门禁写成唯一主流程
- 把重复率目标写成 `<= 3%`
- 把低代码烟测清理写成必做步骤

---

## 8. 验证与验收

### 8.1 配置验收

验证项：

- `main` 分支保护只要求 GitHub 原生 checks
- Sonar 不再出现在 required checks 文档和 PR 模板里
- `quality.yml` / `security.yml` / duplication job 都能作为 required checks

### 8.2 重复率验收

验证项：

- `jscpd` 在仓库质量范围内输出总重复率
- 总重复率 `<= 3%`
- 生成目录和烟测产物不再污染结果

### 8.3 清理验收

验证项：

- 跑完 `test:smoke:business:*` 后，生成模块和注册表可自动清理
- `business/cmdb` 临时产物不会保留在 `git status`
- smoke 清理失败会使 CI 失败

### 8.4 安全验收

验证项：

- `CodeQL`、依赖漏洞、secret scan、workflow posture 继续作为强制门禁
- 不再需要 Sonar 才能判断安全门禁是否通过

---

## 9. 风险与控制

### 风险 1：重复率门禁被错误理解为“只要排除更多目录就行”

控制：

- 只允许排除生成物和数据资产
- 业务代码重复必须重构

### 风险 2：烟测清理不足导致生成物残留

控制：

- smoke 前后都做清理
- cleanup 结果不为空就 fail

### 风险 3：GitHub 原生门禁太散，团队感知仍像多套系统

控制：

- 用统一的 `quality.yml` / `security.yml` / duplication job 命名
- PR 模板只展示这三类门禁，不再展示 Sonar

### 风险 4：`business/cmdb` 的临时产物继续被误当成产品代码

控制：

- 文档明确写入“烟测样板，跑完即清”
- 清理脚本和门禁都把它视为 ephemeral artifact