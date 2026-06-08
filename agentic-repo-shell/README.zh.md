# Agentic Repo Shell

English version: [README.md](./README.md)

这个目录是给新项目使用的可复制 repo shell。

建议与以下目录一起使用：

- `agentic-method-kit/`

## 组成

- `agentic-method-kit/`：可移植的方法事实源
- `agentic-repo-shell/`：仓库本地 shell 与执行层
- `sample-overlays/pantheon/`：项目专属继承治理示例 overlay，不属于可移植核心

## 这个启动壳层包含什么

- `.agents/`
- `.github/`
- 仅保留骨架的 `.harness/`
- `docs/harness/`
- `scripts/harness/`
- 仅保留骨架的 `openspec/`
- shell 版本元数据

它刻意不携带当前工作区中的历史 task packets、evidence 或 review artifacts。

## 环境要求

必需：

- `git`
- `node` 20+

推荐：

- 一个仓库本地的 `AGENTS.md` 或等价入口文件
- 一套用于 non-trivial 工作的 OpenSpec 工作流

可选：

- 本地 `.codex/skills/`
- 浏览器 QA 工具

## 版本管理

当前 shell 版本：

- `1.0.0`

版本元数据：

- `SHELL_VERSION.json`

## 新项目引导

1. 把 `agentic-method-kit/` 复制到新仓库根目录
2. 把 `agentic-repo-shell/` 的内容复制到新仓库根目录
3. 可选地应用项目 overlay，`sample-overlays/pantheon/` 只作为可改造示例
4. 加入你自己的项目级 `AGENTS.md` 或 `CLAUDE.md`
5. 在开始 non-trivial 实现前，先创建第一个 OpenSpec change 或第一个 task packet

如果你是直接从当前工作区引导新仓库，也可以使用：

```powershell
pwsh ./scripts/bootstrap-agentic-repo.ps1 -TargetPath <new-repo>
pwsh ./scripts/bootstrap-agentic-repo.ps1 -TargetPath <new-repo> -OverlayPath sample-overlays/pantheon
```

说明：

- `-Force` 允许覆盖到现有目录，但不会先删除已有文件

## 推荐阅读顺序

建议按这个顺序进入：

1. [README.zh.md](./README.zh.md)
2. [scripts/harness/README.zh.md](./scripts/harness/README.zh.md)
3. [.agents/README.md](./.agents/README.md)
4. [docs/harness/HARNESS_CORE_MODEL.md](./docs/harness/HARNESS_CORE_MODEL.md)
5. [docs/harness/HARNESS_COVERAGE_MODEL.md](./docs/harness/HARNESS_COVERAGE_MODEL.md)
6. [docs/harness/HARNESS_TEMPLATE_TAXONOMY.md](./docs/harness/HARNESS_TEMPLATE_TAXONOMY.md)
7. [docs/harness/TOOL_ADAPTER_MATRIX.md](./docs/harness/TOOL_ADAPTER_MATRIX.md)
8. [docs/harness/failure-registry.md](./docs/harness/failure-registry.md)
9. [docs/harness/tasks/README.md](./docs/harness/tasks/README.md)
10. [openspec/README.md](./openspec/README.md)

## 引导后怎么用

1. 把项目自己的 contracts、designs 和 acceptances 放进仓库
2. 保持 `agentic-method-kit/` 作为方法事实源
3. 把 `docs/harness/` 作为仓库本地 contract 层
4. 把运行时 evidence 存在 `.harness/` 下
5. 当重复失败出现时，更新 `docs/harness/failure-registry.md`
6. 在本地和 CI 中运行 `scripts/harness/*`
7. 在方法升级后运行 `scripts/harness/check-method-health.mjs --strict`

## 文档治理门禁

这个 repo shell 还带了一套可移植、machine-readable 的文档治理门禁：

- `docs/harness/DOCUMENT_FRONTMATTER_SPEC.md`
- `scripts/harness/check-doc-frontmatter.mjs`

当仓库采用如下 governed docs 时启用它：

- `docs/contracts/*`
- `docs/designs/*`
- `docs/acceptances/*`
- 保留在 `docs/superpowers/specs/*` 下的 specs
- 保留在 `docs/archive/*` 下的历史文档

推荐检查：

```powershell
node scripts/harness/check-doc-frontmatter.mjs
node scripts/harness/check-doc-frontmatter.mjs --report-legacy
```

这个门禁会校验 frontmatter 是否存在、必填元数据、contract linkage、contract body 与 frontmatter 的关系漂移，以及 `docs/README.md` 主入口链接只能指向 `Active` 文档的规则。

## 可选 Overlay

默认 shell 是通用的。

只有当仓库需要设计类似项目专属控制项时，才参考 `sample-overlays/pantheon/`：

- 上游 / 下游继承治理
- drift checks
- 项目专属 PR 与 CI review gates
- 项目专属架构或合同检查

## 推荐结果

引导完成后，新业务仓库根目录至少应包含：

```text
.agents/
.github/
.harness/
agentic-method-kit/
docs/harness/
openspec/
scripts/harness/
```

## 可选层

这个 starter 默认不包含本地 `.codex/skills/`。

这是刻意设计：

- 方法本身必须保持工具无关
- Codex 仍可通过 `.agents/` 和仓库契约运行
- 只有当业务仓库需要稳定的仓库专属辅助工作流时，才加入本地 Codex skills

## Skills 指引

预装 skills 不是必须的。

推荐理解方式：

- `agentic-method-kit/` 和仓库契约是必须的
- `.agents/` 是默认的跨工具适配层
- 本地 skills 是可选加速层

如果你确实加入 skills，要避免它们成为关键路径：

- 它们可以提升速度
- 但不能成为方法定义的唯一位置
