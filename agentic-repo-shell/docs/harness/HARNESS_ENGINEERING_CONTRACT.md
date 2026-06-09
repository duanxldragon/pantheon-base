# Harness Engineering Contract

English version: [HARNESS_ENGINEERING_CONTRACT.en.md](./HARNESS_ENGINEERING_CONTRACT.en.md)

类型：Contract
归属层：method
状态：Active

本文定义工具无关 Harness Engineering 协议。它约束所有 AI agent、自动化工具和人工工程师如何接收任务、读取上下文、修改代码、验证结果、提交证据和进入 review。

## 1. 目标

Harness Engineering 的目标是让仓库本身成为执行环境，而不是把流程锁在某个工具里。

Codex、Claude Code、Cursor、GitHub Copilot、OpenHands、Aider 和人工工程师都可以参与开发，但必须遵守同一套仓库协议：

1. 任务边界由合同、设计、验收文档定义。
2. 工具只负责执行、验证和举证。
3. 关键判断必须有 human gate 或 review gate。
4. 完成状态必须由测试、检查、浏览器证据和文档同步共同支撑。

## 2. 适用范围

本文适用于任何采用本方法的代码仓库，包括但不限于：

- Web 前端、后端 API、CLI、批处理、数据管道、移动端、基础设施和文档型仓库。
- 任何 agent 生成、修改、删除代码或文档的任务。
- 任何影响架构边界、接口、schema、权限、安全、运行时质量或用户体验的任务。
- 多 agent 或人机协同场景下的任务分解、验证、证据、review 和交接。

## 3. 非目标

本文不定义某个工具的快捷命令、私有 prompt 或插件行为。工具特定说明放在 `.agents/adapters/` 或对应工具自己的配置中。

本文不替代：

- 下游仓库自己的 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 或等价入口文件。
- 下游仓库自己的 `docs/contracts/*`、`docs/designs/*`、`docs/acceptances/*`。
- 任何项目专属 overlay。

## 4. 核心原则

### 4.1 仓库协议优先

关键规则必须沉淀在仓库中，优先级如下：

1. 用户在当前会话中的直接要求。
2. 当前仓库的 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md`、`.cursor/rules` 等入口文件。
3. `docs/harness/*` 工具无关协议。
4. `docs/contracts/*`、`docs/designs/*`、`docs/acceptances/*`。
5. 工具 adapter 和 agent 私有技能。

如果工具 adapter 与仓库合同冲突，以仓库合同为准。

### 4.2 工具只是执行器

Codex skill、Claude skill、Cursor rule、Copilot instruction 都只是 adapter。它们可以优化体验，但不能成为唯一事实源。

任何关键约束如果只存在于某个工具配置中，都必须迁移或摘要到 `docs/harness/*` 或对应合同文档。

### 4.3 人负责目标和判断

人负责：

- 定义目标和优先级。
- 决定跨层边界和 tradeoff。
- 批准 schema、权限、删除、上游合同变更等高影响操作。
- 审查证据和剩余风险。

Agent 负责：

- 按任务包读取上下文。
- 执行实现。
- 运行验证。
- 保存证据。
- 产出 review-ready 说明。

### 4.4 证据优先

不能只说“已完成”“已验证”“应该没问题”。必须给出：

- 执行过的命令。
- 通过或失败结果。
- UI 相关截图或 smoke 结果。
- 已知未验证项。
- 受影响文档是否已同步。

### 4.5 外部评估者默认存在

对 `non-trivial` 任务，默认应显式区分：

- 实现者视角
- 评审者视角

实现者可以产出自检，但不应把“我检查过了”当作默认完成判定。

以下情况默认需要独立评审者或显式 review gate：

- 触发第 6 节 human gate 的任务
- 安全、权限、审计、schema、信任边界相关任务
- release、CI、secrets、删除或高影响运维流程变更

如因环境或任务规模只能 self-review，必须明确写出原因和剩余风险。

### 4.6 约束要能升级，也要能退役

重复失败不应只修代码，应按 `FAILURE_RATCHET_POLICY.md` 升级为 guide、template、sensor 或 gate。

同样，旧 workaround 不应永久累积。重大模型或工具升级后，应按 `HARNESS_RETIREMENT_REVIEW.md` 评估哪些约束可以降级、替换或删除。

## 5. 标准工作流

所有非 trivial 任务必须按以下流程推进：

```text
Intake -> Context -> Plan -> Red -> Green -> Verify -> Evidence -> Review -> Handoff
```

### 5.1 Intake

读取任务包或用户请求，声明：

- primary layer
- dependency layers
- touched contracts
- implementer posture
- reviewer posture
- expected verification
- human gates

### 5.2 Context

按当前仓库阅读顺序读取必要文档，不做无边界的全量阅读。

推荐读取顺序：

1. 仓库入口文件：`AGENTS.md`、`CLAUDE.md`、`GEMINI.md`、`.cursor/rules` 或等价文件。
2. 文档地图：`docs/README.md` 或等价索引。
3. 匹配任务层级的 contract、design、acceptance 文档。
4. 任务包、change record、issue、PR 描述或实现计划。
5. 项目专属 overlay 文档，仅当任务明确采用该 overlay 时读取。

### 5.3 Plan

非 trivial 任务必须有最小计划。跨层任务、新功能、重构、漂移治理和高敏配置变更必须使用 task packet。

`trivial` 与 `non-trivial` 的判定，按 `TRIVIALITY_CLASSIFICATION_POLICY.md` 执行。

### 5.4 Red

能用测试或检查固定行为的任务，先写失败测试或失败检查。

例外必须说明：

- 纯文档整理
- 探索性 audit
- 无法在当前环境运行的外部依赖

### 5.5 Green

实现只覆盖任务包范围。不得顺手重构无关代码，不得修复未归因的问题。

### 5.6 Verify

按变更面选择最小验证集：

- backend: `go test` 相关包，必要时 `go test ./...`
- frontend: `npm run type-check`、`npm run lint`、`npm run build`
- contracts: schema、API、权限、安全、依赖边界、配置、文档链接等仓库定义检查
- runtime/UI: smoke、截图、console error、日志、指标、trace、性能或浏览器路径
- visual quality: 按 `VISUAL_QUALITY_PROTOCOL.md` 执行 `impeccable` 或同等视觉质量门

### 5.7 Evidence

验证结果按 `VERIFICATION_EVIDENCE_SPEC.md` 保存或摘要。

### 5.8 Review

按 `REVIEW_LOOP_SPEC.md` 和 `CODE_REVIEW_STANDARD.md` 做 findings-first review。

除 trivial 或明确记录理由的低风险例外外，review 默认应作为实现之后的外部评估环节存在，而不是作者自评的同义词。

### 5.9 Handoff

交付说明必须包含：

- changed files
- commands run
- pass/fail result
- evidence path
- review mode
- known gaps
- required human decisions

### 5.10 Default Adoption For Ordinary Work

Unless a task is explicitly trivial under Section 8, any code, contract, design, acceptance, UI, route, permission, i18n, schema, or workflow change must ship with:

- a task packet or explicit link to an approved parent task packet
- verification evidence in the repository-defined structure
- a review mode, or a documented reason why only self-review was used
- known gaps recorded instead of omitted

This rule applies equally to:

- ordinary feature delivery
- bugfixes
- refactors that change behavior or contracts
- UI polish work
- cross-layer remediation work

## 6. Human Gates

以下操作必须先获得人确认，或在 PR 中显式进入 review gate：

- 删除大量文件或目录。
- 修改数据库 schema、迁移或 seed 语义。
- 修改权限模型、菜单模型、审计模型或 i18n key 规则。
- 修改仓库核心合同、架构边界、公共 API 或共享数据模型。
- 在派生仓库、插件或扩展中 override 上游定义的公共能力。
- 引入新运行时依赖、新外部服务或新安全边界。
- 变更 CI gate、发布流程或 secrets 处理方式。

凡进入 human gate 的任务，默认也应进入独立评审者视角，而不是只保留实现者自检。

## 7. 完成定义

一个任务只有同时满足以下条件，才可以标记完成：

1. 已声明归属层和跨层边界。
2. 已读取对应合同、设计和验收文档。
3. 已声明实现者视角与评审者视角，或说明为什么只保留 self-review。
4. 已执行任务包或最小计划。
5. 已运行与变更面匹配的验证命令。
6. 已保存或摘要验证证据。
7. 涉及合同、接口、菜单、权限、i18n、数据库或验收口径时，已同步文档。
8. 涉及 UI 时，已执行视觉质量门并保存截图、浏览器证据或未运行原因。
9. 已列出未验证项和剩余风险。
10. Review gate 没有未解决的 P0/P1。
11. 如果仓库启用了文档治理，还需通过 `DOCUMENT_FRONTMATTER_SPEC.md` 定义的 frontmatter / README / 合同关联校验。

## 8. Trivial 任务例外

以下任务可以不创建 task packet，但仍需遵守相关合同：

- 单字 typo 修复。
- 注释或 README 小幅澄清。
- 只读查询、日志查看、状态汇报。
- 不影响行为的格式化，且已有格式化命令验证。

例外任务仍不能绕过敏感操作 human gate。

如对 trivial 判定存在争议，以 `TRIVIALITY_CLASSIFICATION_POLICY.md` 为准，并默认回退到 `non-trivial`。

## 9. 迁移路线

Harness 成熟度分三阶段推进：

1. 协议层：建立 `docs/harness/*` 与 `.agents/*`，确保工具无关。
2. 证据层：建立 task packet、evidence schema 和证据目录。
3. 门禁层：把仓库专属边界、质量检查、运行态证据和文档治理下沉为脚本和 CI。
