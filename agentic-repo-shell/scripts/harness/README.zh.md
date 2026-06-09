# Harness Scripts

English version: [README.md](./README.md)

这个目录包含仓库本地的 Harness Engineering 检查脚本。

可移植的方法事实源现在位于 `agentic-method-kit/`。
这个目录是当前工作区对那套方法的执行层。

这些脚本被 Codex、Claude Code、Cursor、GitHub Copilot、OpenHands、Aider 和人工工程师共同使用。工具专属 adapter 可以调用这些脚本，但这些脚本本身不绑定任何单一 agent。

## 当前脚本

### `check-task-packet.mjs`

根据 `docs/harness/TASK_PACKET_SPEC.md` 中要求的结构，校验 task packet Markdown 文件。

校验所有 task packets：

```powershell
node scripts/harness/check-task-packet.mjs
```

校验一个 task packet：

```powershell
node scripts/harness/check-task-packet.mjs docs/harness/tasks/2026-05-13-check-task-packet-script.task.md
```

输出 JSON：

```powershell
node scripts/harness/check-task-packet.mjs --json
```

退出行为：

- 当所有 task packets 结构都合法时，退出 `0`
- 当一个或多个 task packets 有错误时，退出 `1`
- warnings 会报告出来，但不会导致命令失败

### `check-evidence.mjs`

校验 `.harness/evidence/**/commands.json` 下的 Harness verification evidence 命令文件。

### `check-review.mjs`

校验 `.harness/evidence/**/review.md` 下的 machine-readable review artifacts。

### `check-graph-review.mjs`

检查 task packet `Structural Scope`、evidence `graphChecks` 与 review `structuralReview` 是否保持一致。

### `scaffold-graph-review.mjs`

根据 task packet 的 `## Structural Scope` 生成或刷新 `graphChecks` 与 `structuralReview`，但不覆盖其余 evidence / review 内容。

也支持 `--import <file>` 导入一次图审查结果，仅合并这些结构化字段。

### `build-graph-review-import.mjs`

把保存下来的 CodeGraph 风格 JSON 整理成 `scaffold-graph-review --import` 可消费的导入结构。

也支持直接读取实时 `codegraph` CLI 结果并转换成同一导入结构。

```powershell
node scripts/harness/build-graph-review-import.mjs --codegraph-path D:\workspace\example-app --live-callers CreateInvoice --live-callees CreateInvoice --write graph-review.json
node scripts/harness/scaffold-graph-review.mjs --write --import graph-review.json sample
```

如果需要先同步索引，或本机 `PATH` 找不到 `codegraph`，可改用 `--sync` 与 `--codegraph-bin` / `CODEGRAPH_BIN`。

实时直写 task evidence：

```powershell
node scripts/harness/scaffold-graph-review.mjs --write --codegraph-path D:\workspace\example-app --live-context "billing service" sample
```

常用查询模板：

```powershell
node scripts/harness/scaffold-graph-review.mjs --write --codegraph-path D:\workspace\example-app --live-callers CreateInvoice --live-callees CreateInvoice billing-flow
node scripts/harness/scaffold-graph-review.mjs --write --codegraph-path D:\workspace\example-app --live-impact BillingService billing-flow
```

### `check-template-health.mjs`

检查仓库是否具备最小通用 template-governance 面。

### `check-runtime-evidence.mjs`

报告 runtime-sensitive 任务在 evidence 中缺少 runtime logs / metrics / traces / performance 信号或显式 runtime gap 的情况。

### `check-doc-links.mjs`

检查方法与 harness 文档中的内部 Markdown 链接完整性。

### `check-doc-inventory.mjs`

检查关键文档与脚本清单 README 是否列出了它们声明治理的文件。

### `check-sync-drift.mjs`

检查根脚本与 repo-shell 镜像脚本是否仍保持同步。

默认 report-only 模式：

```powershell
node scripts/harness/check-evidence.mjs
```

JSON 输出：

```powershell
node scripts/harness/check-evidence.mjs --json
```

用于 CI 结构校验的 strict 模式：

```powershell
node scripts/harness/check-evidence.mjs --strict
```

退出行为：

- 默认 report-only 模式下，即使存在错误也退出 `0`
- `--strict` 模式下，如果 evidence schema 有错误，则退出 `1`
- warnings 仅作信息提示

### `check-visual-evidence.mjs`

针对 visual quality protocol，报告 UI task packet 和 evidence 缺口。

默认 report-only 模式：

```powershell
node scripts/harness/check-visual-evidence.mjs
```

JSON 输出：

```powershell
node scripts/harness/check-visual-evidence.mjs --json
```

Strict 模式（观察期已启动）：

```powershell
node scripts/harness/check-visual-evidence.mjs --strict
```

退出行为：

- report-only 模式下退出 `0`
- `--strict` 模式下，只要存在 warnings 就退出 `1`（CI 可配合 `continue-on-error: true` 观察）
- warnings 会指出缺少 viewport/state plan 的 UI task packets
- warnings 会指出缺少截图、浏览器 evidence 或显式 visual evidence gap 的 UI evidence

### `check-adoption.mjs`

检查 Phase 7 Harness adoption 入口：共享 contracts、adapters、PR template markers、implementation prompt evidence rules，以及实现文件变更是否伴随 task packet/evidence 更新，active OpenSpec changes 是否被变更过的 task/evidence artifacts 引用。

默认 report-only 模式：

```powershell
node scripts/harness/check-adoption.mjs
```

JSON 输出：

```powershell
node scripts/harness/check-adoption.mjs --json
```

Strict 模式：

```powershell
node scripts/harness/check-adoption.mjs --strict
```

用于测试或 CI 实验的显式 changed-file 模式：

```powershell
node scripts/harness/check-adoption.mjs --strict --changed-file backend/modules/auth/service.go --changed-file docs/harness/tasks/2026-05-18-sample.task.md --changed-file .harness/evidence/2026-05-18-sample/commands.json
```

退出行为：

- `--strict` 模式下，如果缺少必需的 adoption files 或 PR markers，则退出 `1`
- `--strict` 模式下，如果检测到实现文件变化但没有匹配的 task packet/evidence linkage，则退出 `1`
- `--strict` 模式下，如果存在 active OpenSpec changes，但变更过的 task/evidence 文件仍使用 `changeRef: none`，则退出 `1`
- warnings 仅作信息提示，不会导致 strict 模式失败

### `check-method-health.mjs`

检查一个仓库复制过来的方法层是否在结构上健康：

- method kit version metadata
- repo shell version metadata
- version compatibility
- required landing files
- method/runtime boundary directories

默认 report-only 模式：

```powershell
node scripts/harness/check-method-health.mjs
```

JSON 输出：

```powershell
node scripts/harness/check-method-health.mjs --json
```

Strict 模式：

```powershell
node scripts/harness/check-method-health.mjs --strict
```

项目专属的 inheritance、drift、architecture 和 backend contract checks 应放在 `sample-overlays/pantheon/` 这类可选 overlay 中，而不是放进可移植 repo shell。

### `check-failure-registry.mjs`

校验 Harness failure registry Markdown 表格，覆盖必需列、枚举值、必填字段、`FR-001` 编号格式，以及未替换的模板占位行。

默认扫描：

```powershell
node scripts/harness/check-failure-registry.mjs
```

JSON 输出：

```powershell
node scripts/harness/check-failure-registry.mjs --json
```

显式校验单个文件：

```powershell
node scripts/harness/check-failure-registry.mjs docs/harness/failure-registry.md
```

默认路径没有 registry 时只报告 warning，不阻断新仓库渐进采用；发现结构错误时退出 `1`。

### `check-doc-frontmatter.mjs`

根据 `docs/harness/DOCUMENT_FRONTMATTER_SPEC.md` 中的可移植 frontmatter 约定，校验受治理的 Markdown 文档。

默认 report-only 模式：

```powershell
node scripts/harness/check-doc-frontmatter.mjs
```

Legacy metadata 扫描：

```powershell
node scripts/harness/check-doc-frontmatter.mjs --report-legacy
```

当前检查包括：

- YAML frontmatter 是否存在
- 必填基础字段
- `docs/superpowers/specs/*` 与 `docs/archive/*` 的 retained doc 规则
- `linked_contracts` 是否存在
- `Superseded -> superseded_by`
- contract 正文中的 `关联设计 / 关联评估 / 关联整改 / 关联验收` 与 frontmatter relation fields 是否漂移
- `docs/README.md` 链接是否存在
- `docs/README.md` 主入口链接是否只指向 `Active` 文档

## 通用约定

所有检查脚本都接受 `--root <path>`，因此可以在测试中从 fixture 目录运行。省略时，会默认使用根据脚本位置推导出来的仓库根目录。

## 测试

单元测试与脚本放在同级目录，命名为 `*.test.mjs`，使用 Node 内建的 `node:test` runner 和 tmpdir fixtures。

运行全部 harness tests：

```powershell
node --test scripts/harness/*.test.mjs
```

各脚本对应测试：

| Script | Tests |
| :--- | :--- |
| `check-task-packet.mjs` | `check-task-packet.test.mjs` |
| `check-evidence.mjs` | `check-evidence.test.mjs` |
| `check-visual-evidence.mjs` | `check-visual-evidence.test.mjs` |
| `check-adoption.mjs` | `check-adoption.test.mjs` |
| `check-method-health.mjs` | `check-method-health.test.mjs` |
| `check-failure-registry.mjs` | `check-failure-registry.test.mjs` |
| `check-doc-frontmatter.mjs` | `check-doc-frontmatter.test.mjs` |
