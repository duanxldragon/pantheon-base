# W5 review — tenant console UX

## 1. 判定依据的正确性

- `/auth/tenants/current` 返回 `{mode, tenantId, resolvedBy}`，是契约 §3.1 的解析结果。
  `resolvedBy` 的四个取值里：
  - `platform-fallback`：平台作用域，可切换；
  - `header`：平台主体钉住租户视角，仍需要切换器退出；
  - `subject`：租户会话（含登录选择），不是平台能力；
  - `compat-fallback`：`enabled=false`，钩子直接返回 `tenant`。
- 权限键只作为 `isAdmin` 兜底，不再单独决定 scope。租户管理员持有 `system:tenant:list` 这件事
  是授权事实，不应被解读为平台作用域。

## 2. 请求行为

- tenant 管理员：不请求 `/system/tenant/list`，不再触发 `tenant.platformOnly`。
- 平台管理员：`platformScope=platform` → 请求租户列表 → 切换器可用。
- 平台管理员钉住视角：`resolvedBy=header` → 仍可见，能切回平台。
- 钩子在 `unknown` 时不放行任何请求，避免「先发再隐藏」的浪费请求。

## 3. 部门表

- 复用文件中已存在的 `flatDeptRows`，没有新增数据转换。
- `getPagedItems` 与 `pagination.total` 都改成扁平行，二者一致。
- `rowSelection` 现在作用于可见的扁平行；`isRoot` 仍禁用根节点选择。
- 风险：失去树形缩进/展开；任务包明确允许，且验收只看「所有层级可见 + 总数正确」。

## 4. 测试覆盖

- `ui_walkthrough.cjs` 23/23，包含部门子节点与租户用户登录。
- 网络探针记录了实际请求集合，证明修复的是**请求依据**而不是提示样式。
- 没有新增 spec；既有 `tenant-viewpoint-switcher.spec.ts` 仍覆盖平台主体的切换/退出流程。

## 5. 剩余风险

| 风险 | 判断 |
|---|---|
| 平台管理员同时带租户 claim | `isAdmin` 兜底使其仍可见；未单独构造该账号做浏览器验证 |
| 部门层级可读性 | 扁平行没有缩进；如果用户反馈难读，需要树表设计 |
| 设置页 console error 4 条 | 基线已存在，与本波无关 |

## Machine Readable

```json
{
  "taskId": "2026-10-19-w5-tenant-console-ux",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-19-w5-tenant-console-ux/manifest.json",
    "evidence": ".harness/evidence/2026-10-19-w5-tenant-console-ux/commands.json",
    "reviewFile": ".harness/evidence/2026-10-19-w5-tenant-console-ux/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-19-tenant-permission-isolation-remediation.task.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
