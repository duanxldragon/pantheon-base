APPROVE；architectural status **CLEAR**。本次条件修改修复大型治理归档的进程启动失败，未改变现有运行态门禁责任。

- 根因证据：失败头 `9034d4f3` 的 2,614 个变更路径序列化为 287,684 字节，超过 Linux 单个环境字符串的 131,072 字节限制；错误发生在 Bash 启动前。环境入口见 `.github/workflows/quality.yml:99`，原始错误见 `ci-failure-annotations.json:1`。
- 修改边界：`.github/workflows/quality.yml:97` 只在 `all_count != governance_only_count` 时解析 smoke 模块；既有治理分类保留非空计数约束（`:40`）。治理变更原本已不要求运行态门禁（`:995`），且模块 smoke 原本要求 `governance_only != 'true'`（`:703`）。
- 混合源码变更继续解析，未知路径仍升级至全部模块：`scripts/resolve-smoke-modules.mjs:104`、`:114`。前端、后端、lint、Smoke Sanity 及最终运行态结果检查未改（quality.yml `:347`、`:385`、`:443`、`:583`、`:1027`）。
- 新回归读取实际 YAML 条件，覆盖大型治理归档、混合源码、普通源码及原 merge-group 行为：`tests/scripts/quality-workflow.test.mjs:9`。独立新执行 **19/19 通过、零跳过**；actionlint exit 0。

源绑定：

| 文件                        | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `quality.yml`               | `b8a76bfeec907dd63b043ff59e2564f3c20491e3116bf600f391138d0848089d` |
| `quality-workflow.test.mjs` | `93fd0bd2b731c8ac4755ddd96e60b14c26024aed62d10cbc19c4a9b804f8eb0d` |

结构检查：无新增循环或 hub；敏感流程仅减少无必要的解析启动。超大**混合**变更仍可能触发 E2BIG，此修复保持其可见失败，未扩展为通用传输重构。

无文件修改。批准范围仅为上述 CI 条件与回归；最终更新头的 hosted 检查仍须通过。
