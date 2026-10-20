# SonarCloud 未处理问题清零 + 租户控制台菜单播种（2026-10-20-sonarcloud-zero-issues）

**Status**: completed（CI 重分析待 PR 实跑）
**Scope**: SonarCloud 32 条未处理问题、Tenant Smoke 回归、GitHub Security 告警与文档
**Baseline → 现状**: SonarCloud `resolved=false` 32 → 0（待主干重分析确认）；质量门禁 `ERROR`（`new_security_rating` 3.0）→ 期望 `OK`；GitHub code scanning 开放告警 5 → 0
**Gate**: `go build` / `go vet` / `golangci-lint --new-from-rev` / `tsc` / `eslint` / `vitest` 全绿；docs-frontmatter、structure、encoding 门禁全绿

## 1. 一句话结论

发布门禁要求「质量门禁为绿 **且** 未处理问题为 0」，而主干当时是 32 条、门禁红。上一轮的 S2068 修复只把口令从字面量挪到了
`env ?? 字面量`，字面量还在，所以 Sonar 只是换了行号继续报。这一轮把字面量彻底删掉（口令按运行生成并写进夹具清单），
其余 31 条逐条改代码清零，同时修掉让 Tenant Smoke 持续失败的租户菜单缺失。

## 2. 规则 → 数量 → 修法

| 规则 | 数量 | 位置 | 修法 |
|---|---|---|---|
| `go:S1192` | 9 | `login_tenant_switch`、`security_service`、`seed_data`、`permission_data_scope`、`tenant_provision`、`tenant_service` ×3、`user_helper` | 收进包级常量：`msgTokenInvalid`、`orderEventRecent`、`moduleTenant`、`condTenantIDEquals`、`condRoleIDEquals`、`condIDEquals`/`condIDNotEquals`/`condStatusEquals`；`user_helper` 复用已有的 `condIDEquals` |
| `go:S3776` | 3 | `GetCurrentTenant` 16、F10 数据范围测试 16、`provisionTenantRoleBindings` 26 | 抽出 `attachCallerMembershipRole`、`dataScopeTenantCase` + `assertTenantResolvesOwnPolicy`、`platformAdminRoleID` / `readPlatformAdminBindings` / `grantTenantRolePermissions` / `grantTenantRoleMenus` |
| `go:S107` | 1 | `runTenantScopeRequest` 8 参数 | 折成 `tenantScopeRequest` 结构体，4 处调用点改为具名字段 |
| `go:S1135` | 1 | `dashboard_service.go:39` | 注释 "todo list" → "task list"（该规则匹配的是注释里的 TODO 字样） |
| `godre:S8193` | 2 | `permission_data_scope_tenant_test.go:238,241` | 去掉只用于一次比较的临时变量 |
| `godre:S8196` | 1 | `authuser.TenantScopedRepository` | 改名 `TenantUserFinder`，保留 deprecated 类型别名 |
| `typescript:S2068` | 1 | `tenant-fixture.ts:58` | 口令改为 `randomBytes` 按运行生成，值写入夹具清单；`env` 仍可覆盖 |
| `typescript:S9382` | 6 | `tenant-fixture.ts` 播种与 teardown | 顺序 await 改为 `Promise.all` 批次（租户、成员、字典三者互不依赖） |
| `typescript:S3358` | 2 | `TenantList.tsx` | 嵌套三元改为顺序条件链 `bodyContent` |
| `typescript:S6759` | 3 | `TenantSwitcher`、`TenantViewpointSwitcher`、`TenantViewpointBanner` | props 标注 `Readonly<...>` |
| `typescript:S6819` | 1 | viewpoint banner | `div role="status"` → `<output>`（CSS 已设 `display:flex`，布局不变） |
| `typescript:S5843` | 1 | `dateTime.ts` | Go 零值时间正则拆成「纯日期」与「零时刻」两条，复杂度各自达标 |
| `typescript:S3776` | 1 | `useUserList.submitForm` 20 | 抽出 `buildUserWritePayload` 与 `joinViewpointIfNeeded` |

## 3. 唯一的行为改动：租户开通补写菜单授权

`provisionTenantRoleMenus` 在角色与 Casbin 策略之后，为 `tenant_admin` 补写可见菜单授权：

- 取 `is_visible = 1 AND type <> 'F'` 且 `module <> 'system.tenant'` 的菜单；
- 逐条 `rbacbind.EnsureRoleMenu(tx, tenantID, adminRoleID, menuID)`，幂等；
- 平台全局租户（0）直接返回，不播种。

不补这一步时，新租户登录后 `system_role_menu` 为空 → 导航解析为空 → 侧边栏空白，
这正是 Tenant Smoke 在整改合并后每次都失败的原因。新增两条用例：
`TestProvisionTenant_SeedsTenantAdminMenus`、`TestProvisionTenant_SeedsTenantAdminMenusIdempotently`。

## 4. GitHub Security 侧

- `private vulnerability reporting` 由 disabled → enabled，`SECURITY.md` 里写的「私有渠道」这才真的存在；
- 5 条 `js/file-access-to-http`（`frontend/scripts/tenant-matrix-fixture-setup.mjs`）按 `used in tests` 关闭，
  理由写明「回放本次运行生成、写在 gitignore 目录里的凭据给本地 API，不随产物发布」；
- `SECURITY{,.en}.md` 增加 "GitHub Security Surfaces" 一节（六个入口 + 关闭告警必须留痕），
  `docs/GITHUB_GOVERNANCE_CHECKLIST{,.en}.md` 增加对应条目。

## 5. PR 分析补充（本轮自证）

PR #391 的 SonarCloud 分析给出 `new_security_rating = 1`，说明 S2068 的修法成立；同时它浮出两条**本次修改自身**带来的新问题：

1. `login_handler.go` 里新增 `msgTokenInvalid` 常量后，该文件里仍有 3 处 `"token.invalid"` 字面量，
   合计 4 处触发 `go:S1192` —— 已把这 3 处也换成常量。
2. `LoginHandler` 认知复杂度 18（`go:S3776`）—— 已把租户归属失败分支与 MFA 挑战分支抽成
   `failLoginTenantClaim` 与 `startMFAChallenge`，并把「按请求租户选服务」抽成 `loginServiceFor`。

这两条是本轮改动让文件重新进入分析视野后才被报出的，修完后净新增为 0。它们也说明
「本地 lint 全绿」不等于 Sonar 全绿：Sonar 的规则集比 `golangci-lint` 的默认配置更宽。

## 6. 残余风险

1. SonarCloud 的最终判定只能由主干重分析给出。本机可读 issues API，但关闭/标记问题需要 `SONAR_TOKEN`
   （仅存在于仓库 secret），因此本轮**没有**在 Sonar 侧做任何标记，清零完全靠改代码。
2. Playwright 在本机无法启动（`spawnSync` EBUSY），Tenant Smoke 的浏览器侧结论来自 CI advisory 任务。
3. `TenantScopedRepository` 作为 deprecated 别名保留到下个大版本，删除时机留给维护者。
4. 菜单树仍是全局的，只有授权行带租户维度；本轮不改这个模型。
