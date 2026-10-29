# W2 review — tenant user onboarding

## 1. Contract fit

- 契约 §2.2（成员关系是登录前提）与 §2.3.1（写必须由上下文赋值租户）都被遵守：
  `CreateUser` 的 `TenantID` 只来自 `WithTenantContext(tenant.FromGin(c))`，请求体没有租户字段。
- §2.3.1 第 2 条（租户只能写自己那份）：`ensureTenantMembership` 只写 `user.TenantID`；删除时
  租户作用域只停用本租户行，平台作用域才清理全部行。

## 2. 事务与失败语义

- 用户、角色绑定、成员关系在同一个 `s.db.Transaction` 内完成。任何一个失败都回滚，不会出现
  「用户存在但登不进」的中间态。测试用回调注入失败证明了这一点。
- 成员关系插入失败被当作创建失败返回给调用方，而不是记日志后放行：半成品比失败更难排查。

## 3. 幂等与历史数据

- `ensureTenantMembership` 先查后写，并在已有行上确保 `active`，因此用户名复用/重试不会撞唯一键。
- 000027 只改状态，不删行；`information_schema` 守卫覆盖「tenant_memberships 不存在」和
  「system_user 没有 deleted_at」两种历史 schema。重复执行匹配 0 行。

## 4. 边界检查

- 没有新增 `user -> tenant` 的 import：成员表用裸表写入，租户常量从 `pkg/tenant` 读取。
- 没有放宽 `GateSessionIssuance`，也没有给 `tenant_id = 0` 造成员关系。
- 删除路径仍然先吊销令牌、再删关系、最后软删用户；顺序未变，新增的只是停用成员关系。

## 5. 剩余风险

| 风险 | 判断 |
|---|---|
| 默认成员角色 `member` 是产品决策 | 任务包明确按 `member` 实现；未由维护者另行确认，记录为 human gate 未关闭 |
| 平台管理员在租户视角下建用户会得到 membership | 任务包的 human gate 写的是「yes」；实现遵循该决定 |
| 并发删除同一用户 | 停用更新是幂等的；用户名改写依赖数据库行锁，未做并发压测 |
| 历史幽灵成员之外的其他脏数据（例如 user 行已物理删除但 membership 仍在） | 不在 F4 范围；成员列表 LEFT JOIN 不会显示 `__deleted_user_*`，但会显示空用户名。未处理 |

## Machine Readable

```json
{
  "taskId": "2026-10-19-w2-tenant-user-onboarding",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-19-w2-tenant-user-onboarding/manifest.json",
    "evidence": ".harness/evidence/2026-10-19-w2-tenant-user-onboarding/commands.json",
    "reviewFile": ".harness/evidence/2026-10-19-w2-tenant-user-onboarding/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
