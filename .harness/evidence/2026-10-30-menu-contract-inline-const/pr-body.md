## 变更摘要

- 改动层级：platform（治理传感器本体，被核验对象不动）
- 改动模块：`frontend/scripts/check-menu-contract.mjs`、`tests/scripts/check-menu-contract.test.mjs`、`package.json`（仅新增 `test:menu-contract` 别名）、`docs/harness/failure-registry.md`（FR-022）
- 目标问题：菜单合同传感器只从 `const ( name = "value" )` 块形式建 Go 包常量表，行内 `const name = "value"` 整条漏收；`extractField()` 对无法解析的标识符返回空串，与「字段不存在」同形，随后 `path || pagePerm || perms` 的保留条件落空，**整条 seed 静默离开核验集合**。实测读数：同一份引用行内常量的正确 seed，HEAD 版传感器报 `后端缺少菜单 seed: /system/login-log`（把传感器缺陷误判成后端缺 seed）。
- 预期影响：门禁结论对同一份代码发生变化（这是本包的目的，也是它按 L2 走的原因）。修复后行内常量与块常量都能解析，`19 个菜单 / 23 条路由 / 102 个权限 / 23 个组件键` 读数不变；被保留 seed 块上的未解析裸引用变成第一批具名错误。零 schema、零路由、零权限键、零 i18n 资源、零后端改动。消费者 `pantheon-ops` 持有逐字节相同的传感器副本，须经 foundation release 才能吸收——本包不切版不发布。

## Harness 链路

- Task ID：2026-10-30-menu-contract-inline-const
- Task Manifest：.harness/tasks/2026-10-30-menu-contract-inline-const/manifest.json
- Evidence：.harness/evidence/2026-10-30-menu-contract-inline-const/commands.json
- Verification evidence：.harness/evidence/2026-10-30-menu-contract-inline-const/summary.md
- Review Artifact：.harness/evidence/2026-10-30-menu-contract-inline-const/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：sensor-added
- GitHub Signal：repo-quality-gate

> Quality Profile 选 `permission-policy` 而非 `i18n`/`none`：这条缝最高风险的后果是
> `PagePerm` / `Perms` 被静默清空后整条 seed 退出核验，即权限合同检查点对该菜单永久失明；
> 本包的判定规则也因此要求解析失败必须在下游后果之前先说出来。

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-30-menu-contract-inline-const
- task manifest: .harness/tasks/2026-10-30-menu-contract-inline-const/manifest.json
- evidence: .harness/evidence/2026-10-30-menu-contract-inline-const/commands.json
- boundaries: platform 治理传感器；不改被核验的 seed/菜单/路由/权限/i18n 对象；消费者侧只经 foundation release 流向
- backend response contract: not-applicable（无后端文件、无接口与响应结构变化）
- backend DTO contract: not-applicable
- permission contract: 未新增/未修改任何权限键；变化仅在「权限键能否被传感器读到」这一核验面
- audit coverage: not-applicable
- visual evidence: not-applicable（无 UI 面；`npm run build` 经 prebuild 跑同一传感器并通过）
- inheritance contract: Base-first——通用缺陷回底座修，`ops` 侧绕行（`const ( … )` 块）不回滚，两种形式修复后都合法
- base drift: generic-drift（传感器缺陷属底座，不是业务特有问题；不在消费者打补丁）
- Base/ops inheritance: 需下一次 foundation release 才能到达 `pantheon-ops`；本包不动 `VERSION`/`CHANGELOG`/`docs/release-notes/**`，发布时点归维护者（tag 与 release 资产不可回收）

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 单层级 `platform`，但跨仓库影响：传感器经 foundation release 进入消费者。改动面只有
> 核验者（+94/−22 的 `.mjs` 脚本 + 130 行新单元测试），被核验对象（`backend/**` 的 seed、
> `frontend/src/**` 的菜单 manifest 与 i18n 资源）零改动。工作树中既有的 6 个未提交 i18n
> 文件（`builtin_locale_resources.json` + `frontend/src/i18n/resources/*.ts`）属别的在途工作，
> 本 PR 不 stage、不提交、不背书——`check:harness-adoption` 剩余的两条 finding 都指向它们。

## 验证记录

- [x] 新单元测试：`npm run test:menu-contract` → **10/10 pass**
- [x] 全量脚本测试：`npm run test:scripts` → **181 tests / 181 pass / 0 fail**（新文件已在 `ci.yml` 的 glob 内，无需改 workflow）
- [x] 传感器本体：`cd frontend && node ./scripts/check-menu-contract.mjs` → exit 0，`19 菜单 / 23 路由 / 102 权限 / 23 组件键`（与修复前同数，未靠放宽判定变绿）
- [x] 修复前对照（实测，非推断）：`git show HEAD:frontend/scripts/check-menu-contract.mjs` 跑同一份行内常量 seed → exit 1，`后端缺少菜单 seed: /system/login-log`
- [x] 修复后对照：同一 seed → exit 0；再把引用改成未声明标识符 → 第一条错误即 `后端 seed 引用了无法解析的常量: Path: probeUndeclaredConst (…login_menu.go)`，下游后果排在其后
- [x] 对照实验清理：`cp` 还原 `login_menu.go`，`git status` 确认该文件干净；临时探针脚本已删除
- [x] L0 静态契约：`cd frontend && npm run test:smoke:l0` → smoke-coverage-contract + web-base（98 files）+ system-page-admission（16 entries）全过
- [x] 前端 lint + 构建：`cd frontend && npm run lint`（无输出）+ `npm run build`（prebuild 链含本传感器）→ `✓ built in 1.34s`
- [x] 治理矩阵全绿：`check:task-packet`、`check:task-packet-template`、`check:docs-frontmatter`（400 docs）、`check:harness-docs`、`check:harness-inventory`、`check:harness-encoding`（2584 files）、`check:structure`（2932 files）、`check:harness-adoption --strict`（本包 0 finding）、`check:failure-registry`、`check:generated`、`check:generated-modules`、`check:ui-quality-gate`、`check:duplication`
- [x] 证据契约：`check-evidence.mjs --strict` → 6 files / 0 errors；`check-review.mjs --strict` → 0 errors
- [ ] 后端测试：`go test ./...`——本 PR 无 `backend/**` 改动，不适用
- [ ] L1/L2 smoke 与 `test:smoke:system:iam-authz`：无运行时面变化，未执行；缺口见下
- [x] CodeQL 结果已检查并解释（见审核留痕）
- [ ] GitHub required checks 通过：`main` 无分支保护（API 返回 Branch not protected），合并门禁实际由 CI 结论 + 维护者批准承担
- [x] Copilot review 已请求（由 PR Automation 自动请求）

补充说明：传感器的运行面是「构建期 + CI 期」，其运行侧证据是同一份 seed 上 HEAD 版与修复版
的读数差与未声明标识符的具名错误读数；浏览器 smoke 与本改动无对应面，未以 smoke 代替度量。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：pending。本 PR 的代码面只有 `frontend/scripts/check-menu-contract.mjs`（+94/−22）与
  `tests/scripts/check-menu-contract.test.mjs`（新增 130 行），两者都在 `security.yml` 的
  CodeQL `languages: go, typescript` 提取范围内；改动为字符串解析与错误登记，无新增 sink
  （无 SQL 拼接、无路径拼接、无 `os.Create`、无反序列化）。运行后按 `CodeQL Security` job 结论回读。
- GitHub checks 结果：pending（`main` 未设 required contexts，结论以 workflow 实跑为准）
- Auto-merge：not enabled for this PR。`pr-automation.yml` 会在 PR 打开后秒级开启 auto-merge，
  而底座无分支保护、合并即落 main；本包按可 review 的显式合并处理，合并动作只在人工确认检查结论后发生。
- Duplication Gate 结果：ran（`npm run check:duplication` → PASS）。新增的 `.mjs` 接缝是既有
  `export function …` + `pathToFileURL` 守卫约定的第 N 次应用，不是新形状。
- 是否高风险改动：no。改动面单文件 + 单测试文件，被核验对象不动，无 workflow / 门禁规则 /
  权限 / schema 变化；风险点是「传感器结论变化可能让既有 main 变红」，已用保留同数读数
  （19/23/102/23）与全量治理矩阵排除。
- Ratchet 说明：不新增门禁规则、不加豁免。同类失败第二次出现（ops 的 S1192 绕行 + 本次底座复现），
  按 ratchet 落 FR-022 + 传感器语义修复 + 单元测试进 CI glob。清零判定用度量：修复前/修复后
  对同一 seed 的读数差、未声明标识符的具名错误、以及第一版实现产生 4 条噪声读数（来自
  `system/i18n/i18n_seed.go:94` 的 Go 代码块）→ 由此收敛出「裸标识符」+「被保留块」两条判定，
  噪声读数本身写进 evidence 而不是悄悄迭代掉。
- Residual risk / follow-up：① ops 吸收本修复需一次 patch 发布，发布不可逆、时点归维护者；
  ② 传感器仍是源码正则解析器而非 Go AST 消费者，`iota`、`fmt.Sprintf`、跨包限定常量仍不可解析——
  区别是现在失败会具名报错，不再静默给空值；③ 全静默的菜单 seed（`Path` / `PagePerm` / `Perms`
  都未解析）会在登记之前被丢弃，下游 `后端缺少菜单 seed` 仍会报，属诊断顺序弱点而非漏检；
  ④ ops 侧 `serviceModuleKey` 的常量块绕行不回滚，是否归一化由消费者仓库评审；
  ⑤ 工作树中既有的未提交 i18n 改动不在本 PR 范围内，也不为其背书。

## 检查清单

- [x] 已明确本次改动归属 `platform`（治理传感器），未触碰 `system/*` 与 `business/*` 的实现面
- [x] 未把认证、IAM、组织、配置等系统域职责混写（无后端文件、无系统域逻辑变化）
- [x] 前端新增展示文案已使用 i18n（无新增展示文案；`check:i18n-hardcode` 随 prebuild 通过）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（对象未动，只让传感器不再把它们静默读成空值）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无数据/权限/菜单/接口变更；failure-registry 与任务包已同步）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（diff 无凭据字面量；对照实验只在本地工作树内改动一个 seed 文件并已还原；不含任何 token/DSN）
- [x] 已确认本次 PR 由 GitHub workflow 结论与维护者批准负责最终合并门禁（`main` 当前无 required contexts，已在审核留痕写明）
