# Review — SonarCloud 清零与租户菜单播种

## 1. 契约与门禁对齐

- `.github/workflows/release-gate.yml` 的 `sonarcloud-gate` 有两条独立条件：候选提交的质量门禁必须为 `OK`，
  且 `resolved=false` 的问题总数必须为 0。基线是 32 条，所以只修那条漏洞不够——本包按门禁口径整包清零。
- `new_security_rating` 的失败条件来自 S2068。上一轮把字面量改成 `env ?? 字面量`，字面量仍在树里，
  问题只是换了行号；这次必须让源码里不存在任何常量口令，否则重分析会再次报同一规则。
- 租户菜单属于 `TENANT_CONTRACT_V1` 的导航授权面：授权行带 `tenant_id`，菜单目录本身是平台级的。
  本包只补写授权行，不动菜单树模型。

## 2. 重构等价性检查

- `GetCurrentTenant`：抽出的 `attachCallerMembershipRole` 保留「只读一次 membership、命中即停」的语义，
  且在没有 membership 时同样不改写 summary。
- `provisionTenantRoleBindings`：拆分前后顺序一致（先读平台 admin 的权限键与菜单，再逐角色读已存在集合、
  只插缺失行）。幂等性依赖「先读后跳过」，拆分没有改变这一点，`TestProvisionTenant_SeedsTenantAdminMenusIdempotently` 覆盖。
- F10 数据范围测试：`dataScopeTenantCase` + 断言函数只搬运了判断，没有改变四个用例的期望值。
- `submitForm`：`buildUserWritePayload` 的字段集合与原来逐字段赋值一致；`joinViewpointIfNeeded`
  把「租户视角下建用户后补成员」整段搬走，失败提示仍是独立的一条，创建本身不回滚。
- `dateTime.ts`：原正则等价于「纯日期」或「日期 + T00:00:00[.000][Z|±hh:mm]」，
  拆成两条后覆盖集合相同，`isGoZeroTime` 的返回值不变。

## 3. 边界检查

- 菜单播种用 `is_visible = 1`、`type <> 'F'`、`module <> 'system.tenant'` 三重条件收窄：
  租户管理员不会看到平台级的租户管理入口，也不会拿到按钮级菜单。
- 平台全局租户（`tenant_id = 0`）直接返回，不播种，避免给平台命名空间写授权。
- `TenantScopedRepository` 保留为类型别名，下游仓库的断言在编译期仍然成立（别名是同一类型）。
- GitHub 侧只做了两件事：开启 private vulnerability reporting、按 `used in tests` 关闭测试夹具的告警；
  没有放宽任何门禁，也没有关闭 Secret scanning / push protection。

## 4. 剩余风险

| 风险 | 判断 |
|---|---|
| SonarCloud 重分析未在本机发生 | 只能由主干重分析判定；本机不写「已清零」的结论，只写基线 32 与修法映射 |
| Tenant Smoke 未在本机跑 | Playwright 无法启动；菜单播种由 Go 用例覆盖，浏览器结论交给 CI |
| deprecated 别名长期存在 | 下个大版本必须删除；已在 `summary.md` 与 manifest 记录 |
| 菜单树仍无租户维度 | 设计如此，只隔离授权行；本包不改模型 |
| `js/file-access-to-http` 以 `used in tests` 关闭 | 夹具确实把本次运行生成的凭据回放给本地 API；若将来该脚本承载非测试用途，必须重新评估 |

## Machine Readable

```json
{
  "taskId": "2026-10-20-sonarcloud-zero-issues",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": "tenant provisioning -> system_role_menu -> navigation resolver -> tenant console",
    "checks": ["sensitive-flow"]
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-20-sonarcloud-zero-issues/manifest.json",
    "evidence": ".harness/evidence/2026-10-20-sonarcloud-zero-issues/commands.json",
    "reviewFile": ".harness/evidence/2026-10-20-sonarcloud-zero-issues/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-20-sonarcloud-zero-issues.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md",
      "SECURITY.md"
    ]
  }
}
```
