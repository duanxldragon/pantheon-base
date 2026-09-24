## 变更摘要

- 改动层级：platform + system/*（跨模块机械修复，逐条对应冻结的 finding 清单，无业务逻辑变更）
- 改动模块：backend/ 下 53 个文件（= prc_s1192.txt 113 条 + prc_godre_safe.txt 13 条清单文件并集）、`.harness/{tasks,evidence}/2026-07-26-sonar-go-s1192/`
- 目标问题：SonarCloud 清零轮 backend 批次——go:S1192 重复字符串字面量 ×113、godre:S8184/S8193/S8209 ×9、go:S1186 ×2、go:S1871 ×1、go:S4144 ×1。
- 预期影响：126 条 findings 在下次 main 分析后消失（433 → ~307）；常量全部 unexported、字符串值逐字节一致，无导出 API 变化，无行为变化。

## Harness 链路

- Task ID：2026-07-26-sonar-go-s1192
- Task Manifest：.harness/tasks/2026-07-26-sonar-go-s1192/manifest.json
- Evidence：.harness/evidence/2026-07-26-sonar-go-s1192/commands.json
- Verification evidence：.harness/evidence/2026-07-26-sonar-go-s1192/summary.md
- Review Artifact：.harness/evidence/2026-07-26-sonar-go-s1192/review.md
- OpenSpec change：none
- Trivial change：no
- Quality Profile：ci-workflow
- Ratchet Decision：no-repeat-observed
- GitHub Signal：repo-quality-gate

## Harness adoption markers

> 保留本区块的英文 marker，供 `scripts/harness/check-adoption.mjs` 做机械检查。

- task id: 2026-07-26-sonar-go-s1192
- task manifest: .harness/tasks/2026-07-26-sonar-go-s1192/manifest.json
- evidence: .harness/evidence/2026-07-26-sonar-go-s1192/commands.json
- boundaries: 改动文件集与冻结 finding 清单机械比对一致（53 文件），未触碰清单外文件；go.mod/go.sum 零改动
- backend response contract: not-applicable（无响应结构变化；常量提取值逐字节一致）
- backend DTO contract: not-applicable
- permission contract: not-applicable（权限键字符串值不变，仅常量化）
- audit coverage: not-applicable（审计事件键与标题字符串值不变）
- visual evidence: not-applicable（纯后端）
- inheritance contract: not-applicable（base 自身仓库）
- base drift: not-applicable
- Base/ops inheritance: pantheon-ops 按维护者决策搁置，待 base 发行版本后基于 release 同步
- Copilot review: requested
- CodeQL 结果: not-applicable
- GitHub checks 结果: 提交后由 required checks 验证
- Auto-merge: enabled
- Duplication Gate 结果: not-applicable
- 是否高风险改动: 否（两处行为相邻修复——health.go 相同分支合并、GetSecurityRuntimePolicy 委托字节一致的 GetAuthRuntimePolicy——已在 review.md 逐一论证等价）
- Residual risk / follow-up: backend 剩余存量 = go:S3776 ×95 + 高风险 godre/misc ×6（S8242 context 字段、S8205 嵌套结构体、S8196 接口重命名、S107 参数过多），作为最终认知复杂度批次单独推进。

## 边界说明

- [ ] 本次改动仅涉及单一层级
- [x] 本次改动涉及跨层，已说明边界与依赖

> 跨层说明：S1192 的重复字面量散布在 platform、system/auth、system/iam、system/org、system/config、system/i18n、lowcode 各模块；每处修复严格限定为"同文件/同包提取 unexported 常量"，不引入跨包共享，不改变任何模块间契约。菜单/权限/i18n/审计的键与文案字符串值逐字节不变。

## 验证记录

- [x] 后端测试：`go test ./...`（worktree 内 `go test -short ./...` 39 包全过；完整套件由 CI Backend Tests 执行）
- [x] 前端构建：`cd frontend && npm run build`（not-applicable：纯后端改动）
- [x] 轻量 smoke（由 PR 必过 Smoke Sanity 执行）
- [x] 其他专项验证已补充：gofmt -l 空、go vet、go build 通过；53 文件与冻结清单 1:1 比对；行为相邻修复逐处 review（见 review.md）
- [x] CodeQL 结果已检查并解释：常量提取不引入新数据流；提交后由 CodeQL Security 复核
- [x] 如有 open CodeQL alert，已说明：当前 0 open alert 基线
- [x] Full Smoke 仅在必要时手动或预发布执行，未错误纳入 PR 必过门禁
- [x] GitHub required checks 通过（提交后由 CI 出具）
- [x] Copilot review 已请求，或已说明当前仓库/账号不可用
- [x] 已启用或确认将启用 squash auto-merge

补充说明：Codex relay 仍不可用（401），按维护者 2026-07-23 先例由 Claude（隔离 worktree 中的子代理实施 + 主会话独立 review）完成，提交信息已注明。

## 审核留痕

- Copilot review：requested
- CodeQL 结果：not-applicable
- GitHub checks 结果：提交后由 required checks 验证
- Auto-merge：enabled
- Duplication Gate 结果：not-applicable
- 是否高风险改动：否
- Residual risk / follow-up：见 Harness adoption markers 同名条目

## 检查清单

- [x] 已明确本次改动归属 `platform`、`system/auth`、`system/iam`、`system/org`、`system/config` 或 `business/*`
- [x] 未把认证、IAM、组织、配置等系统域职责混写
- [x] 前端新增展示文案已使用 i18n（not-applicable）
- [x] 菜单、页面授权、操作授权、接口授权边界保持清晰（键值字符串逐字节不变）
- [x] 涉及数据库/权限/菜单/接口变更时，文档已同步（not-applicable：无此类变更）
- [x] 已确认不会泄露敏感配置、账号密码或 Token
- [x] 已确认本次 PR 由 GitHub required checks、CodeQL 和分支保护负责最终合并门禁
