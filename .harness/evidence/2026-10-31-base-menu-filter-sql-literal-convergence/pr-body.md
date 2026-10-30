## 变更摘要

- 改动层级：`business/*`（继承边界，primary layer 记 `inheritance-sync`；消费者逐字节继承的底座文件）
- 改动模块：`backend/modules/business/retired_modules.go` 一个文件（`17 insertions(+), 7 deletions(-)`），加本包任务文档、manifest 与 evidence
- 目标问题：`pantheon-ops` 在关闭 SonarCloud 漏洞/缺陷（ops PR #156）时，把它从底座继承的 `retired_modules.go` 里两处 `query.Where/Or(column + " IN ?", values)` 改成三条整句子句常量，因为 ops 独有的 `scripts/check-gorm-sql-literal.mjs` 断言「GORM 的 SQL 文本与列名必须是字面量或包级常量」。底座没有这条断言、该文件自锁定提交 `93505225` 起零变化（`git diff 93505225..HEAD` 对该文件为空），于是消费者侧的 `npm run check:shared-drift` 报 `DRIFT_MODIFIED backend/modules/business/retired_modules.go` → `FAIL shared drift check: 1 modified`，每周 `Base Compatibility Rebuild` 的「Check shared-file drift against base HEAD」一步同理会红。
- 预期影响：把这条安全收紧回流到底座（Base-first），落地后两侧该文件**逐字节相同**，shared-drift 在源头消除（实测 `OK … 812 shared files identical to base, 10 allowlisted drift, 161 business-overlay files skipped`），底座自身也获得「SQL 文本不来自运行期列名拼接」这条不变式，而 `.foundation/allowed-drift.json` 一行未动——没有把安全收紧登记成「允许的偏差」。行为零变化：三个字段展开后仍是 `module IN ?` / `path IN ?` / `component IN ?`，取值仍只经 `?` 绑定；被改的 `applyMenuFieldFilter` 是包内私有函数，全仓除本文件三个调用点外无引用。零 schema、零路由、零权限键、零 i18n 资源、零接口变化；消费者无需为吸收本改动再改一次文件。

## Harness 链路

- Task ID：2026-10-31-base-menu-filter-sql-literal-convergence
- Task Manifest：.harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence/manifest.json
- Evidence：.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/commands.json
- Verification evidence：.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/summary.md
- Review Artifact：.harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：permission-policy
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

> Quality Profile 选 `permission-policy`：改动对象是菜单查询条件的构造方式，属权限/菜单
> 数据读取面；风险不是功能回归而是「SQL 文本能否被运行期变量拼接影响」，因此判定证据用
> 消费者检查器的成对读数（2 条违规 → 0 条）而不是口头断言。

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-10-31-base-menu-filter-sql-literal-convergence
- task manifest: .harness/tasks/2026-10-31-base-menu-filter-sql-literal-convergence/manifest.json
- evidence: .harness/evidence/2026-10-31-base-menu-filter-sql-literal-convergence/commands.json
- boundaries: `backend/modules/business/retired_modules.go` 单文件的查询构造形式 + 本包文档；不动 `.foundation/**`、不动 workflow、不动 seed/路由/权限/i18n 对象、不动消费者仓库
- backend response contract: not-applicable（无接口、无响应结构、无 DTO 字段变化）
- backend DTO contract: not-applicable
- permission contract: 未新增/未修改任何权限键；菜单过滤条件的取值集合与绑定方式逐条不变
- audit coverage: not-applicable（无审计链路改动）
- visual evidence: not-applicable（无 UI 面；改动文件是后端查询构造，前端与本改动无对应面）
- inheritance contract: Base-first——消费者的更严形式回流底座，不在消费者长期持有私有偏差；回流后 base main 与 ops main 该文件字节相同，drift 门禁（比对 base HEAD）不依赖新发布即转绿（Release Requirement：none）
- base drift: generic-drift-at-source（drift 的成因是两仓门禁不对称：ops 有 `check-gorm-sql-literal.mjs`，底座没有；修法是搬不变式，不是记豁免）
- Base/ops inheritance: 本 PR 修的是底座侧；消费者 main 已持有相同字节，`check:shared-drift` 提交后即绿。但 ops 锁定的 release 资产 v0.18.1（`baseCommit 93505225`）里该文件仍是拼接形式——按 lock 重放的干净树会重现旧形式（实测见 evidence commands[15]），需下一次 foundation release 才把本改动带进发布资产；切版时点归维护者，本包不动 `VERSION`/`CHANGELOG`/`docs/release-notes/**`

## 边界说明

- [x] 本次改动仅涉及单一层级
- [ ] 本次改动涉及跨层，已说明边界与依赖

> 代码面只有 `backend/modules/business/retired_modules.go`：新增三条包级整句子句常量、
> 三个调用点由列名字符串改传常量、私有 helper 形参 `column string` → `inClause string`、
> 两处 `Or`/`Where` 去掉拼接。`grep -rn applyMenuFieldFilter backend/` 只命中本文件，
> 无其它包引用，因此私有签名变化不外溢；无新增 import。工作树中既有的 6 个未提交 i18n
> 文件（`backend/modules/system/i18n/builtin_locale_resources.json` +
> `frontend/src/i18n/resources/*.ts`）属别的在途工作，本 PR 不 stage、不提交、不背书。

## 验证记录

- [x] 收敛前基线（实测）：`cd ../pantheon-ops && node scripts/business-overlay/check-shared-drift.mjs --base ../pantheon-base` → `FAIL shared drift check: 1 modified … DRIFT_MODIFIED backend/modules/business/retired_modules.go`（既有 10 条 `ALLOWED_DRIFT` 原样）
- [x] 归属判定：`git -C pantheon-base diff --stat 93505225 HEAD -- backend/modules/business/retired_modules.go` → 空；`git log` ops 侧指向 PR #156 → drift 由单方面修改产生，非底座移动
- [x] 两仓差异全量核对：`diff <(git show origin/main:…) <(ops 副本)` → 六个 hunk，全部属于这条收紧，无夹带 ops 专有标识符
- [x] 成对探针（同一检查器、同一文件、两种形式）：收敛前 `2 GORM SQL-literal violation(s)`（`retired_modules.go:172 Or()`、`:174 Where()`，`got column+" IN ?"`）；收敛后 `GORM SQL text and column names are literals or package constants across business modules` → **0 条**
- [x] 收敛后消费者门禁复跑（底座提交 `c335e5b9` 之后）：`OK shared drift check: 812 shared files identical to base, 10 allowlisted drift, 161 business-overlay files skipped` → DRIFT_MODIFIED 由 1 变 0，白名单零增删
- [x] 后端：`cd backend && go vet ./...` → 无输出；`go build ./...` → exit 0；`go test -count=1 ./...` → **47 包 ok / 0 FAIL**（未缓存）
- [x] `gofmt -l backend/modules/business/retired_modules.go` → 空
- [x] `git show --stat c335e5b9` → `1 file changed, 17 insertions(+), 7 deletions(-)`（业务面单文件）
- [x] 治理矩阵：`check:docs-frontmatter`（403 docs 通过）、`check:task-packet-template`、`check:task-packet`（本包 PASS、0 warning）、`check:structure`（strict 0 finding / 2954 files）、`check:harness-encoding`（strict 0 finding / 2606 files）、`check:duplication`（PASS）
- [x] 证据契约：`check-evidence.mjs --root . --strict` → 本包 PASS；`check-review.mjs --root . --strict` → 0 error
- [ ] 后端 race：`CGO_ENABLED=1 go test -race -count=1 ./...` → **本机不可用**，多包报 `ThreadSanitizer failed to allocate … (error code: 87)`，是 Windows/cygwin 的 TSan 运行时限制、与被改代码无关；覆盖方式为无 `-race` 全量 + CI 的 race 作业，缺口原始错误已入 evidence
- [ ] L1/L2 浏览器 smoke 与 `test:smoke:system`：本改动无前后端契约与 UI 对应面，未执行；缺口见审核留痕
- [ ] GitHub required checks 通过：`main` 无分支保护（required contexts 由 workflow 结论 + 维护者批准承担）
- [x] 未使用任何豁免手段：diff 无 `NOSONAR` / `//nolint` / `eslint-disable` / 阈值调整 / 白名单条目；探针里出现的两行 `waived` 是检查器对既有 `gorm-sql-literal:allow` 标记行的正常声明，该标记行随字节对齐一并回流

补充说明：本改动的断言面全在构建期与单测层（查询条件构造 + 两侧门禁读数），没有运行时路径、组件或接口面变化；等价性证据是同一文件在 ops 检查器下的 2 → 0 成对读数与底座 47 包 ok，不以 smoke 代替度量。

## 审核留痕

- Copilot review：requested（由 PR Automation 自动请求）
- CodeQL 结果：pending。代码面是 `backend/modules/business/retired_modules.go` 的查询条件构造，改动方向是**减少**拼接（列名不再参与运行期字符串拼接，整句来自字面量），不新增 sink；运行后按 `CodeQL Security` job 结论回读。
- SonarCloud 结果：pending。本改动移除了一个 `column + " IN ?"` 形式的 SQL 拼接，理论上只减不增；合并后按 `SonarCloud Gate` 作业读数回读（底座 release gate 要求 main 未解决 issue 为 0）。
- GitHub checks 结果：pending（`main` 未设 required contexts，结论以 workflow 实跑为准）
- Auto-merge：由 `pr-automation.yml` 在 PR 打开后自动开启（SQUASH + delete-branch），与本轮既有 PR 一致；已记录的机制事实是自动化 squash 合并不会触发 main 的 push 型工作流，需按显式 dispatch 回读。
- Duplication Gate 结果：ran（`npm run check:duplication` → PASS）
- 是否高风险改动：borderline-no。理由：触碰的是继承边界（消费者逐字节继承的底座文件）+ 查询 SQL 构造，按 workspace 规则升 L2；但行为等价有机器读数、无 schema/权限/接口/workflow 变化，故不需两位领域批准。若维护者判为高风险，需按 `repo-pr-gate` 补第二位（域或安全）评审。
- 白名单路线被明确放弃：`.foundation/allowed-drift.json` 是共享配置，把这条 drift 记成「允许的偏差」会给后续真实偏差提供先例；本次一次写入尝试被拦下后未重试，改走源头收敛。**规则变更类动作仍归维护者。**
- Ratchet 说明：`no-repeat-observed` —— 本包不新增传感器、不加门禁规则、不加豁免（把检查器
  引入底座属维护者决定的高风险范围），但把不变式的代码形态搬到源头，消掉了这条 drift 的复发
  条件：同类问题的根因是「ops 有 `check-gorm-sql-literal.mjs`，底座没有」这一门禁不对称；本包搬的是代码形态，把检查器引入底座 CI 需动 `package.json` 与 `.github/workflows/*`（高风险范围），作为显式缺口留给维护者决定，避免在本 PR 夹带 CI 变更。
- Residual risk / follow-up：① 底座暂无这条检查器，不变式在底座侧由评审 + 本 evidence 维持；② 收敛后的文件保留了一句指向 ops 独有脚本的注释，在本仓是悬空引用——刻意保留是因为 shared-drift 按字节比对，注释差异会重新产生 FAIL，④ 与 ① 同一消解路径；③ weekly `Base Compatibility Rebuild` 未由本包声称转绿（最近两次 schedule 失败于 `Compile rebuilt backend`，属 ops 未对齐 v0.18.1 时期），需下一次周一 08:57 实跑回读；④ 本机 `-race` 不可用，见验证记录；⑤ 不切 foundation release、不动版本与发布文件；⑥ 工作树既有的未提交 i18n 改动不在本 PR 范围也不背书。

## 检查清单

- [x] 已明确本次改动归属 `business/*`（继承边界，primary layer `inheritance-sync`），未触碰 `system/*` 与平台传感器实现面
- [x] 未把认证、IAM、组织、配置等系统域职责混写（只改菜单查询条件的构造形式）
- [x] 前端新增展示文案已使用 i18n（无前端文件改动、无新增展示文案）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（查询 SQL 文本与绑定值逐条等价，权限键零变化）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（无上述变更；任务包、manifest、evidence 与本 PR 正文已同步）
- [x] 已确认不会泄露敏感配置、账号密码或 Token（diff 无任何凭据字面量、无 DSN、无 token；探针临时目录只含该 `.go` 文件且已删除）
- [x] 已确认本次 PR 由 GitHub workflow 结论与维护者批准负责最终合并门禁（`main` 当前无 required contexts，已在审核留痕写明）
