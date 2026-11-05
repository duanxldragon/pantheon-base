# Summary — 2026-11-03-audit-p2-governance-wiring-closeout

GOV-01 / GOV-02 / GOV-03 / BE-02 闭环：三个零引用治理脚本各有归宿，
新增接线自检 checker，三个步骤按维护者指令提升为 blocking，两个依赖 ripgrep 的检查器改为 Node 内置扫描。

## 三选一判决表

| 脚本 | 判决 | 依据 |
|---|---|---|
| `scripts/check-security-patterns.mjs` | **接线** | `check:security-patterns` + `Docs Governance` 步骤；本轮改为 Node 扫描并加基线 |
| `scripts/check-ui-tokens.mjs` | **接线** | `check:ui-tokens` + `Docs Governance` 步骤；本轮改为 Node 扫描 |
| `scripts/migrate-task-manifests.mjs` | **收编** | 一次性迁移工具（默认 dry-run），移入 `scripts/harness/` 并修相对导入 |

## 提升为 blocking（2026-11-04，维护者指令）

三个 workflow 步骤去掉 `continue-on-error: true`，任一步失败即 `Docs Governance` job 失败 →
`Quality Gates` 失败。这补上了任务包 `Human Gates` 中保留给维护者的 gate-policy 决策。

## 依赖替换：ripgrep → Node 内置扫描

原来的 `runRipgrep` 把**任何**执行错误都吞成「没有匹配」：

```js
} catch (error) {
  if (error.status !== 1) { log('warn', `Pattern check failed: ${description}`); }
}
```

后果有三层：本机没装 rg 时打印 `✓ No violations found` 并 exit 0；两条规则用了 look-ahead
（`(?!Secure|HttpOnly)`、`(?!button)`），而 rg 默认引擎直接拒绝这类正则，所以那两条规则
**在任何机器上都没跑过**；CI 还得额外 `apt-get install ripgrep`。

替换为 `scripts/harness/scan-tree.mjs`（约 100 行，递归读取 + 扩展名白名单 + 构建目录跳过 +
缺失根目录上报），两个检查器的 `runRipgrep` 改为 `runPattern`，13 条模式改成 JS 正则字面量。
CI 的 `Ensure ripgrep` 步骤随之下线。

## 规则第一次真正运行：存量与基线

| 检查 | 命中 | 处置 |
|---|---|---|
| `Raw(` / `Exec(`（生产代码） | 46（8 + 38） | 进 `config/security-pattern-baseline.json`（39 条唯一指纹），reviewBy 2027-02-02 |
| `Raw(` / `Exec(`（`_test.go`） | 310 | 规则排除 `_test.go`（测试不是生产查询面） |
| UI token 检查 | 0 error / 6 warning | 警告级不阻断，不加基线 |

基线指纹 = `description + file + 该行文本`：跨行移动稳定、行内一改就失效，因此不是「整文件白名单」。

## 负向验证读数

| 门禁 | 负向构造 | 读数 |
|---|---|---|
| `check-checker-wiring` | 放入未接线的 `check-wiring-probe.mjs` | exit 1，点名该文件；删除后 exit 0 |
| `check-security-patterns` | 放入含 `db.Exec(` 的生产 `.go` 文件 | exit 1，点名探测文件；删除后 exit 0 |
| `check-security-patterns` | 存量 46 条 | exit 0 + `46 accepted by baseline` |
| `check-ui-tokens` | 存量 6 条警告 | exit 0 |

## 登记表校正

- **FR-016**：`check-evidence` / `check-review` 早已接线，登记表却写 “neither strict checker is wired”
  且 status `open`。已改 `implemented`，注明 2026-11-04 起为 blocking。
- **FR-017**：`check-runtime-evidence` 已接线、`check-inheritance-contract` 有 workspace-only npm script、
  `check-boundaries` 在 `ci.yml` 运行；status 由 `open` 改为 `implemented`。
- Review Notes 新增一条：ripgrep 静默吞错是 FR-026 类失败的二阶版本（传感器跑不了 ≠ 没有违规）。
