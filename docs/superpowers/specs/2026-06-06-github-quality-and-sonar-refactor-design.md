---
title: GitHub 质量门禁与 Sonar 重构设计
doc_type: Design
layer: platform
status: Proposed
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/designs/WORKFLOW.md
  - docs/GITHUB_GOVERNANCE_CHECKLIST.md
updated_at: 2026-06-06
---

# GitHub 质量门禁与 Sonar 重构设计

## 1. 目标

这份设计解决的是一个很具体的问题：

- 仓库希望借助 GitHub Actions 和 Sonar 提升代码质量
- 但当前 PR 门禁把过重的 smoke 流程绑进了主反馈链路
- 这一周的 Sonar 治理实际被大量 CI 等待和 UI selector 级别的问题消耗

目标不是做更大更全的流水线，而是做一套更快、更稳、更分层的质量体系。

本轮设计的目标：

1. 把 PR 主门禁收敛到快速、稳定、可重复的检查
2. 把 Sonar 明确定位为代码质量与覆盖率分析，而不是浏览器回归编排器
3. 把完整 smoke 回归下沉到手动、夜间或发布前验证
4. 去掉重复、重叠、职责不清的 GitHub workflow 设计
5. 把本轮做错和做对的部分沉淀成仓库级治理文档

---

## 2. 现状审查

当前仓库 workflow 列表：

| Workflow | 触发方式 | 当前职责 | 现状判断 |
| --- | --- | --- | --- |
| `.github/workflows/quality.yml` | `pull_request` / `merge_group` / `workflow_dispatch` | 文档治理、前端 contract、后端测试、Smoke Core、CodeQL 聚合门禁 | 过重，且职责混杂 |
| `.github/workflows/security.yml` | `pull_request` / `push` / `merge_group` / `schedule` / `workflow_dispatch` | 依赖漏洞、secret scan、workflow posture、CodeQL、安全门禁 | 有价值，但与 `quality.yml` 存在 CodeQL 重叠 |
| `.github/workflows/duplication.yml` | `pull_request` / `push` / `merge_group` / `workflow_dispatch` | 重复率门禁 | 有价值，但独立成 workflow 的收益不高 |
| `.github/workflows/smoke-full.yml` | `workflow_dispatch` | 完整 Playwright smoke | 分层方向正确 |
| `.github/workflows/sonar.yml` | `workflow_dispatch` | SonarCloud 扫描，生成 Go 覆盖率 | 分层方向基本正确 |

### 2.1 Sonar 现状

当前 Sonar 配置并没有要求跑完整冒烟来喂覆盖率。

证据：

- `sonar-project.properties` 只声明 `sonar.go.coverage.reportPaths=coverage.out`
- `sonar.coverage.exclusions=frontend/**,scripts/**,database/**`
- `sonar.yml` 通过 `go test ./... -coverprofile=coverage.out` 生成覆盖率

这说明：

1. Sonar 当前只吃 Go 覆盖率
2. Playwright smoke 不是 Sonar 覆盖率来源
3. “为了 Sonar 必须跑 full smoke” 不是当前仓库事实

### 2.2 真正的效率问题

真正拖慢 PR 反馈的是 `quality.yml` 里的 `smoke-core`。

当前 `smoke-core` 执行：

```text
npm run test:smoke:platform && npm run test:smoke:system
```

这并不是一个轻量级 core smoke。

按 `frontend/package.json` 的定义，它实际包含：

- platform contracts
- platform surfaces
- platform full-system pages
- system pages
- system forms
- system iam authz
- system governance
- system api

这已经是一大组浏览器级系统回归，不适合作为 PR 最内层硬门禁。

### 2.3 重复与设计失真

当前存在 3 个明显的设计失真：

1. `quality.yml` 同时承担质量、回归、安全信号聚合，职责过多
2. CodeQL 在 `quality.yml` 和 `security.yml` 里重复执行
3. `duplication.yml` 独立存在，但本质上属于代码质量，不一定值得单独占一个 workflow

---

## 3. 关键问题

### 3.1 问题一：PR 门禁太重

当前 PR 门禁里最慢、最脆弱的部分不是 Sonar，而是大体量 Playwright smoke。

后果：

- 修改一个 Sonar issue，也要等十几分钟
- 页面细节或 selector 抖动，会阻塞与本次代码质量治理无关的改动
- 开发者开始为“跑绿流程”优化，而不是为“提升代码质量”优化

### 3.2 问题二：信号没有分层

现在的信号层次混在一起：

- 快速静态信号：lint、build、docs、workflow posture
- 稳定代码信号：后端测试、Go 覆盖率、Sonar
- 脆弱长链路信号：Playwright smoke
- 发布级信心信号：full smoke

这些信号的运行成本、失败语义、修复方式完全不同，不应同权。

### 3.3 问题三：重复执行

当前重复主要体现在：

- CodeQL 在 `quality.yml` 和 `security.yml` 双跑
- 独立 `duplication.yml` 带来额外排队和状态检查数量
- 安全与质量边界不够干净，导致 review 和 branch protection 配置更难维护

### 3.4 问题四：治理目标没有对齐“效率优先”

过去这一周，流程推动里有一个明显偏差：

- 过于强调“全部工作流跑绿”
- 没有先把“哪些工作流应该成为主门禁”定义清楚

这会让质量治理被流程噪音吞掉。

---

## 4. 做对了什么

这轮工作不是全错，有几件事方向是对的，应该保留。

### 4.1 正确地把 Sonar 放在辅助层

当前 Sonar 没有进入 required checks，这是对的。

保留原则：

- Sonar 用来识别新增代码质量问题
- Sonar 用来消费稳定覆盖率
- Sonar 不直接决定浏览器级回归是否通过

### 4.2 正确地把 Full Smoke 独立出来

`smoke-full.yml` 已经是独立 workflow，这个方向对。

这说明仓库已经具备“重回归不进 PR 主门禁”的基本结构，只是 `quality.yml` 内部还没完全收紧。

### 4.3 正确地使用 GitHub-hosted MySQL / Redis

CI 中由 workflow 自己拉起 MySQL / Redis，而不是依赖开发者本机或公网服务，这是正确的工程边界。

这点应该保留，不需要回退。

### 4.4 正确地保留 artifact 和失败现场

smoke 失败时上传 trace、`error-context.md`、后端日志，这对排查 flaky UI / E2E 问题非常有价值。

这部分不该删，只该从“强门禁”降到“异步回归支撑”。

---

## 5. 做错了什么

这部分必须直说，不然文档没有价值。

### 5.1 把 smoke 宽度误当成质量宽度

错误做法：

- 为了显得“覆盖更全”，把大量浏览器级用例塞进 PR 门禁

问题：

- 质量宽度不等于门禁质量
- 长测试只会拉低反馈效率，不会自动提高代码质量

### 5.2 把 CI 全绿误当成质量治理完成

错误做法：

- 把时间花在 selector、等待时序、trace 排查上
- 结果 Sonar 本身的问题收敛速度很慢

问题：

- 这会让“修流程”挤压“修代码质量”的时间

### 5.3 没有先定义分层，再推进执行

错误做法：

- 先追着当前 workflow 逐个跑绿
- 后面才回头问“这个 workflow 应不应该在 PR 阶段阻塞”

正确顺序应当是：

```text
定义信号层级
  -> 定义 required checks
  -> 再处理具体失败项
```

### 5.4 保留了重复的安全执行路径

CodeQL 同时出现在 `quality.yml` 和 `security.yml`，这是典型的“越做越全，越做越乱”。

---

## 6. 目标状态

### 6.1 设计原则

重构后的原则必须非常明确：

1. PR 必过链路只保留快速、稳定、可重复的信号
2. 覆盖率只来自单测和轻量集成测试，不来自浏览器 smoke
3. 浏览器 smoke 负责防业务回归，不负责给 Sonar 提供覆盖率口径
4. 安全信号只保留一套主执行路径
5. required checks 数量要少，名称要稳定，职责要清晰

### 6.2 目标分层

```text
PR Required
  -> docs / lint / build / backend-tests / duplication / smoke-sanity / security

PR Optional or Manual
  -> sonar auxiliary scan

Nightly / Release / Manual
  -> full smoke
  -> dependency deep audit
  -> full sonar trend scan
```

---

## 7. 重构方案

### 7.1 `quality.yml` 目标职责

`quality.yml` 应只负责代码质量和轻量回归。

保留：

- `docs-governance`
- `frontend-contract`
- `backend-tests`
- `smoke-sanity`
- `duplication`

移除：

- `codeql-security`

原因：

- 安全检查不该混在质量 workflow 里
- CodeQL 应只保留在 `security.yml`

### 7.2 `smoke-sanity` 取代当前 `smoke-core`

当前 `smoke-core` 命名不准确，建议重构为真正的 `smoke-sanity`。

要求：

- 只覆盖最关键、最稳定的路径
- 总时长尽量控制在 3 到 6 分钟
- 不做大规模截图、视觉矩阵、全系统页面巡检

推荐保留的 sanity 范围：

- 登录与基础会话初始化
- 后端启动健康检查
- 1 到 2 条核心用户/角色链路
- 1 条 Redis 相关会话链路
- 1 条关键权限校验链路

从 PR required 中移出的内容：

- 大量 system pages 巡检
- 宽页面视觉合同
- 大体量 governance matrix
- 业务模块 generated smoke

### 7.3 `smoke-full.yml` 目标职责

`smoke-full.yml` 保留，但不进入 PR required checks。

推荐触发方式：

- `workflow_dispatch`
- `schedule`，例如夜间一次
- 发布前手动运行

不建议：

- `pull_request` 硬阻塞

### 7.4 `sonar.yml` 目标职责

`sonar.yml` 继续作为辅助质量分析 workflow。

保留原则：

- 使用 Go 覆盖率
- 不把 Playwright 结果接进 Sonar 覆盖率口径
- 不作为 PR required check

可增加：

- 夜间 `schedule`
- `main` 分支合并后的趋势分析

不建议：

- 把 Sonar 重新升格为主门禁

### 7.5 `security.yml` 目标职责

`security.yml` 作为唯一安全 workflow。

保留：

- `secret-scan`
- `workflow-posture`
- `codeql-security`

建议下沉或改造：

- `npm audit`
- `govulncheck@latest`

原因：

- 它们在每个 PR 上的噪音、网络不确定性和生态波动较大
- 更适合夜间、主分支、发布前，或改成更轻量的 dependency review

目标状态：

```text
PR Required Security
  -> secret scan
  -> workflow posture
  -> CodeQL

Nightly Security
  -> deep dependency audit
  -> ecosystem drift scan
```

### 7.6 `duplication.yml` 目标职责

建议移除独立的 `duplication.yml`，把重复率门禁并入 `quality.yml`。

原因：

- 重复率本质是代码质量，不是独立运行面的第一类公民
- 少一个 workflow，少一个 required check，少一层排队

重构后：

- `duplication` 作为 `quality.yml` 的一个 job
- `quality-gates` 聚合它的结果

### 7.7 目标 workflow 拓扑

```text
quality.yml
  docs-governance
  frontend-contract
  backend-tests
  duplication
  smoke-sanity
  quality-gates

security.yml
  secret-scan
  workflow-posture
  codeql-security
  security-gates

smoke-full.yml
  full-smoke

sonar.yml
  sonar-auxiliary
```

目标 required checks：

- `Quality Gates`
- `Security Gates`

不进入 required checks：

- `Full Smoke Suite`
- `SonarCloud Auxiliary Scan`

---

## 8. 所有 workflow 的处置建议

| Workflow | 建议处置 | 原因 |
| --- | --- | --- |
| `quality.yml` | 保留并重构 | 当前是主质量入口，但 job 组合不合理 |
| `security.yml` | 保留并收窄 PR 范围 | 需要保留安全边界，但应减少生态噪音 |
| `duplication.yml` | 去除，合并进 `quality.yml` | 减少 workflow 数量和 required check 表面 |
| `smoke-full.yml` | 保留，定位为手动 / 夜间 / 发布前 | 长回归有价值，但不适合 PR 阶段阻塞 |
| `sonar.yml` | 保留，定位为辅助分析 | 继续服务 Sonar 治理，但不参与合并门禁 |

---

## 9. NOT in scope

本轮方案明确不处理以下事项：

- 把前端 Playwright 覆盖率接入 Sonar
  原因：当前优先级是门禁分层，不是扩大 Sonar 统计口径。
- 构建 CD / 部署流水线
  原因：本轮聚焦 CI 与质量门禁，不扩展到发布自动化。
- 改造全部已有 smoke 用例
  原因：本轮先做分层设计，后续再按优先级拆分 sanity/full。
- 重新设计业务域测试策略
  原因：本轮只定义仓库级 workflow 边界。

---

## 10. What already exists

以下基础已经存在，不应推倒重来：

1. `smoke-full.yml` 已经独立存在
   结论：复用，不重造。
2. `sonar.yml` 已经独立存在，且只消费 Go 覆盖率
   结论：复用，不反向绑进 PR 门禁。
3. CI 已经使用 GitHub-hosted MySQL / Redis
   结论：保留，这是正确的运行边界。
4. smoke 失败 artifact 已经上传 trace 与日志
   结论：保留，这对异步排障很重要。
5. GitHub governance 文档已经明确 Sonar 非 required
   结论：保留原则，但需要把 PR required checks 进一步收紧到快路径。

---

## 11. 执行顺序

建议按以下顺序落地：

### 第一阶段：先收紧门禁

1. 从 `quality.yml` 移除 CodeQL
2. 把 `duplication.yml` 合并进 `quality.yml`
3. 把当前 `smoke-core` 改造成 `smoke-sanity`
4. 更新 Branch Protection，只保留 `Quality Gates` 和 `Security Gates`

### 第二阶段：再下沉长回归

1. 给 `smoke-full.yml` 增加夜间触发
2. 保留 `workflow_dispatch`
3. 发布前由人工或 release 流程明确触发

### 第三阶段：再校准 Sonar

1. 保持 Sonar 只吃稳定覆盖率
2. 继续围绕后端单测覆盖率处理 Sonar 问题
3. 不把浏览器 smoke 口径混进覆盖率治理

---

## 12. 验收标准

重构完成后的验收标准：

1. PR required checks 只剩两类总门禁：
   - `Quality Gates`
   - `Security Gates`
2. PR 主反馈链路目标时长控制在 10 到 12 分钟内
3. `smoke-sanity` 目标时长控制在 3 到 6 分钟内
4. `smoke-full` 不再阻塞普通 PR
5. Sonar 继续可运行，但不再决定 PR 是否可合并
6. CodeQL 不再在多个 workflow 中重复执行

---

## 13. 本轮复盘

### 13.1 需要纠正的做法

- 不再把“所有 workflow 跑绿”当作质量治理本身
- 不再默认把更多 smoke 塞进 PR 门禁
- 不再把 selector 级 flaky 问题和 Sonar 治理放在同一优先级
- 不再允许安全与质量 workflow 重复执行同一类检查

### 13.2 需要保留的做法

- GitHub-hosted 容器化测试环境
- Sonar 辅助分析定位
- smoke artifact 与 trace 留证
- Full smoke 与主 PR 门禁分离的方向

### 13.3 这次最大的教训

代码质量提升依赖的是：

- 更短的反馈回路
- 更稳定的主门禁
- 更清楚的信号分层

不是更长、更全、更多的 CI。

---

## 14. 下一步

下一步不应继续围绕当前 workflow 逐个修红。

正确顺序是：

```text
先改 workflow 结构
  -> 再重新定义 required checks
  -> 再处理收紧后的真实阻塞项
```

这才会让 Sonar 治理真正开始产生效率，而不是继续被流程噪音吞掉。
