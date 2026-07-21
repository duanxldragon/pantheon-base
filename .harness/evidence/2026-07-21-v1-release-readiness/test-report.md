# V1.0 全量测试报告（2026-07-21）

测试环境：本机 Windows 11；MySQL 127.0.0.1:3306 / Redis 127.0.0.1:6379（README 快速启动配置，库 `pantheon_base`）；后端为 HEAD 新构建二进制（8080）；前端 vite（smoke 套件自管 5173/5174）。

## 后端（go test ./... -count=1，真库夹具）

43 个包全部 `ok`，无失败、无跳过（PANTHEON_TEST_DSN 指向真实 MySQL；含本轮新增的安全事件批量确认 / 聚合 / 自动保留三用例）。重负载包：auth/login 51.9s、system/i18n 161.2s、iam/user 20.1s——夹具真实建库/删库执行。

## 前端全量 smoke（Playwright，修复后计数）

| 套件 | 结果 |
| --- | --- |
| platform:contracts（shell-visual + pagination） | 22/22 |
| platform:surfaces | 97/97（修复后复核） |
| platform:full（full-system-pages + full-page-audit） | 77/77 |
| system:pages | 81/81（2 处修复后单测复核） |
| system:forms | 通过 |
| system:iam-authz | 4/4（2 处 SearchToolbar 同步修复后） |
| system:governance（含 cleanup-range-ui 行为契约） | 16/17 + cleanup-range 6/6 |
| system:api | 11/11 |
| business:master-detail / many-to-many / auto-recycle | 3/3 各 1/1 |
| business:generated(real) / database-import | 各 1 失败（附注 B） |

### 附注 A — 已知失败豁免（生成器域，main 既有）
3 个失败全部位于低代码生成器 real-flow：
1. `module-governance.spec.ts:420`（生成器向导 business toggle 表单）
2. `module-governance-real.spec.ts:177`（backend generated_registry 未包含新模块）
3. `module-governance-host-real.spec.ts:328`（同上，database-import 宿主流程）

归因证据：
- `git diff origin/main..HEAD -- backend/internal/scaffold backend/modules/lowcode` 为空——本次发布 diff 零触碰生成器后端；
- main 分支 nightly Full Smoke Suite 2026-07-19 已为 failure（GitHub run 29701240960）；
- 生成器 verification 自报 `backend_registry: warn (registry_check_failed)`，frontend registry / 组件注册表 / feature-ledger 均 pass —— 缺陷收敛在 `listGeneratedModuleRefs → WriteGeneratedRegistries` 的 backend 段。

处置：列为 V1.0 已知问题（生成器域 deep 修复另开任务），不阻塞发布（gate-policy 豁免，见发布报告）。

## 本轮测试期间修复（已提交）

- 375ae042：390px 窄屏 header 弹层越界（本 diff 搜索框加宽引发的回归，CSS+autoFitPosition）；platform-shell / system-pages / shell-visual-contract 三处 SearchToolbar·清理条契约同步。
- 615de70b：role-authorization 两用例同步 SearchToolbar keyword 契约。
- 0e2a664f：评审轮修复（详见 review-report.md）。
