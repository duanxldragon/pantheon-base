# Review — 2026-10-20-tenant-delivery-hardening

## 结论

`approved`。修复落在缺陷产生处（命名空间解析与角色键校验），不是给症状打补丁。

## 复核要点

### 1. 请求体还能不能决定命名空间

不能。`policySubjectForWrite` 是唯一入口：

- 租户作用域：`targetTenant` 只能是 0 或当前租户；随后被强制为当前租户。`TenantId` 传其他租户返回
  `TENANT_FORBIDDEN`；传 0 也写成当前租户的域主语。
- 平台作用域：保留显式指定（平台控制台的既有能力）。

`validatePolicyPayload` 的唯一性检查改为按主语 `(v0, v1, v2)`，与存储形态一致。

### 2. 租户还能不能读到别的租户策略

不能。`applyPolicyTenantScope` 用 `v0 LIKE '%@tenant:<id>'` 限定列表与导出；
编辑/删除先用 `policyInTenantScope` 校验行主语，跨租户返回 404 而不是 403（不泄露存在性）。
工作台的策略读取按角色键解析成主语，不再按裸键查。

### 3. 导入与补齐还会不会写全局主语

不会。两者都先经 `policySubjectForWrite(roleKey, 0)` 解析主语：
租户作用域得到域主语，平台作用域得到裸键。导入的角色键在目标命名空间内校验。

### 4. 保留角色键是否真的阻断

`ensureRoleKeyAllowed` 在 create/update 的公共校验里调用，CSV 导入复用同一校验：

- `platform_ops` 直接拒绝；
- 平台命名空间已存在的键拒绝（覆盖 `admin` 及未来新增的平台角色）。

这不是硬编码白名单，平台新增角色会自动被保护。

### 5. 角色生命周期

- 删除：`rolePolicySubject(roleKey, tenantID)` 精确命中自己那一份；平台策略不受影响（有用例）。
- 重命名：同一事务 `UPDATE casbin_rule SET v0 = newSubject WHERE v0 = oldSubject`。
- Bootstrap：`NOT EXISTS` 子句同时匹配裸键和 `CONCAT('role:', key, '@tenant:', tenant_id)`，
  域策略不再被当孤儿删除。

### 6. 迁移与兼容

- `000028` 只加一列与一个索引，`information_schema` 守卫，幂等；旧事件保留 `tenant_id = 0`。
- 没有改 `system_role` / `system_role_permission` / `system_role_menu` 的任何结构。
- `platform.tenant_mode` 的修复只升不降，不会把运营主动隐藏的设置重新暴露。

### 7. 测试是否真的在锁行为

新用例都在真实 MySQL 上跑，且都是双租户/正反断言：

- 租户创建请求体 `tenantId=0` 后断言主语是域形式；
- 跨租户 `tenantId` 断言 403；
- 列表/导出断言看不到 `role:editor@tenant:202`；
- 导入/补齐断言裸键计数为 0；
- Bootstrap 断言活域策略保留、孤儿删除；
- 角色删除断言平台策略仍在、域策略消失；
- 重命名断言新主语 1 条、旧主语 0 条；
- 导入角色断言 `tenant_id = 101`。

## 边界检查

- 未改 `pkg/tenant`、`pkg/database/casbin.go`、租户开通逻辑。
- 未改 `.github/workflows/**`、`release-gate.yml`、`.sonarcloud.properties`。
- 未改菜单/权限全局模型（冻结决策）。

## 残余风险

| 风险 | 判断 |
|---|---|
| 浏览器层未本地验证 | 接受。Playwright 由 CI 执行，Tenant Smoke 是唯一可信来源 |
| 存量租户保留键未自动清理 | 接受。需要运营确认后重命名，已列入 Human Gates |
| 平台作用域仍可指定目标租户 | 接受。平台能力本身受 `PlatformCapabilityMiddleware` 保护 |
| 000028 历史事件归属 0 | 接受。无法从 role_key 反推租户，归 0 是保守读法 |

## Machine Readable

```json
{
  "taskId": "2026-10-20-tenant-delivery-hardening",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": "route -> handler(tenant ctx) -> permission service(subject resolve) -> casbin_rule -> middleware(domain/global subject)",
    "checksNote": "tenant-isolation and reserved-namespace were the two extra reviews actually performed (sections 2 and 4 of the prose) but are outside the checker enum cycle|hub|call-depth|sensitive-flow, so from 2026-10-26 they are recorded here as findings instead of checks.",
    "findings": ["Tenant isolation: a request body or header can no longer decide the namespace, and a tenant cannot read another tenant policies (prose sections 1-2).", "Reserved namespace: import/backfill no longer writes global subjects and reserved role keys are blocked (prose sections 3-4)."],
    "checks": ["sensitive-flow"]
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-20-tenant-delivery-hardening/manifest.json",
    "evidence": ".harness/evidence/2026-10-20-tenant-delivery-hardening/commands.json",
    "reviewFile": ".harness/evidence/2026-10-20-tenant-delivery-hardening/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/contracts/TENANT_CONTRACT_V1.md",
      ".github/workflows/smoke-core.yml"
    ]
  }
}
```
