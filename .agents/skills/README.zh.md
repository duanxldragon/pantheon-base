# 仓库本地 Skills

English version: [README.md](./README.md)

这里存放 `pantheon-base` 的仓库本地 Codex skills。

共享模板源头：

- 工作区级的 `harness-engineering/.agents/skills/README.zh.md`

当任务明显属于本仓特有流程时，优先使用这里的 skills，再回退到通用 workflow skills：

- `repo-verify`：为当前改动面选择最小本地验证矩阵
- `repo-pr-gate`：在 PR 或合并前收口 Pantheon Base 改动
- `repo-ci-triage`：复现并归类 GitHub Actions 红灯
- `gh-fix-ci`：把 CI 修复流程适配到 Pantheon Base 的 workflow 和门禁

推荐顺序：

1. `repo-verify`
2. `repo-pr-gate`
3. GitHub Actions 红灯时用 `repo-ci-triage`
4. 需要按 GitHub run 级别继续排查时再用 `gh-fix-ci`
