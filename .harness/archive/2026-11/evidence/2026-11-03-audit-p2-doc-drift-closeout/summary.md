# Summary — 2026-11-03-audit-p2-doc-drift-closeout

DOC-01 / DOC-02 + GOV-06 / GOV-07 闭环：CONTRIBUTING 不再写死过期工具链与不存在的命令，
两份 PR 指南合并为一份并指向 live 模板。

## DOC-01 / GOV-06：CONTRIBUTING 漂移

| 原内容 | 问题 | 现在 |
|---|---|---|
| `Go: 1.21 or later` / `1.21 或更高版本` | 与 `backend/go.mod` 实际版本不符，且会随升级继续腐坏 | 改为「以 `backend/go.mod` 的 `go` 指令为准」 |
| `Node.js: 18.x or later` / `18.x 或更高版本` | 与 `SHELL_VERSION.json` 的 `minimumNode` 不符 | 改为「以 `SHELL_VERSION.json` 的 `minimumNode` 为准」 |
| `go run ./cmd/server --migrate` | 该 flag 不存在（`backend/cmd`、`internal`、`pkg` 全仓 grep 0 命中），照做必然失败 | 改为 `go run ./cmd/server`，并说明版本化迁移在启动时自动执行、除非 `PANTHEON_AUTO_MIGRATE=true` |
| `npm test` / `npm test -- --coverage` | frontend 没有 `test` script，只有 `test:unit` | 6 处改为 `npm run test:unit`（含 `-- --coverage` 变体） |

「指向机器源」而不是「写死新版本号」是有意的：写死会在下次升级时再次腐坏，
而这正是本轮要消灭的失败模式。

## DOC-02 / GOV-07：两份 PR 指南合并

- `docs/harness-pr-generator-guide.md` 成为唯一指南：生成器用法、manifest 最小结构、
  evidence 三件套、本地预检命令、常见失败。
- `docs/HARNESS_GOVERNANCE_GUIDE.md` 改为指针文档，保留文件名以免旧链接失效。
- 结构权威明确为三处：`.github/pull_request_template.md`（PR body section）、
  `scripts/task-manifest.mjs`（manifest 校验）、`scripts/check-task-packet-template.mjs`（packet section）。
- 已归档的 `sonarcloud-s4666` 不再作为「参考模板」出现，仅保留一句「已归档，不要再用」。

## 读数

`grep 1.21` 0 命中、`grep npm test` 0 命中、`--migrate` 只剩两条「不存在该参数」的说明句；
`check-doc-links --strict` 0 finding、`frontmatter-check` exit 0、`check-task-packet` exit 0。
