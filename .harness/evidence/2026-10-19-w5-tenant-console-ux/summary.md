# W5 — 租户控制台两处判定缺陷（2026-10-19-w5-tenant-console-ux）

**Status**: completed
**Scope**: F5（P1）+ F6（P1）
**Baseline → 现状**: 每个页面 2 个 `403 tenant.platformOnly` toast；部门页只渲染根节点、总数 1 → **0 个 tenant 控制台请求 / 0 toast；部门总数 5、子部门可见**
**Gate**: `tsc -b` / eslint 全绿；`ui_walkthrough.cjs` **23/23**；网络探针 `tenantConsoleCallsAnyPage=[]`

## 1. 一句话结论

两处都是「判断依据选错了」：

- **F5**：`TenantViewpointSwitcher` 用 `hasPerm('system:tenant:list')` 代理「平台能力」。租户管理员
  合法持有这个控制台权限键，于是每个页面都去调 `GET /system/tenant/list`，被
  `403 tenant.platformOnly` 拒绝，全局拦截器弹两个红 toast（StrictMode 双调用）。
  权限键回答的是「能不能用租户控制台」，不是「是不是平台作用域」。
- **F6**：`DeptList` 把嵌套树直接喂给 Arco Table，却用 `pagination.total = data.length`
  （根节点数量）且没有 `expandable`/`childrenColumnName`，于是只显示根、总数读作 1。

## 2. 改了什么

| 文件 | 修复前 | 修复后 |
|---|---|---|
| `usePlatformScope.ts`（新） | — | 调 `/auth/tenants/current`：`tenantId === 0`、`resolvedBy === 'platform-fallback'` 或 `'header'` → platform；`subject` → tenant；未知时隐藏 |
| `TenantViewpointSwitcher.tsx` | `isAdmin \|\| hasPerm('system:tenant:list')` | `platformScope === 'platform' \|\| isAdmin`；tenant 管理员不再发租户列表请求 |
| `TenantSwitcher.tsx` | 同样的权限代理 | 同样的真实信号；租户管理员重新获得 membership 切换器，平台主体仍由视角切换器服务 |
| `DeptList.tsx` | `data={data}`，`total={data.length}` | 复用已有的 `flatDeptRows`：`data={flatDeptRows}`、`total={flatDeptRows.length}`、分页页码按扁平行计算 |

`isAdmin` 作为兜底保留：全局 admin 的会话如果同时带租户 claim（`resolvedBy=subject`），仍然算平台能力。

## 3. 实测证据

### 3.1 UI 走查

```
PASS  dept:tree                     研发中心 visible=true
PASS  tenant-user-login             url=http://127.0.0.1:5174/dashboard
UI RESULT: 23/23 passed
```

`tenant-user-login` 的断言在这次整改中一并修正：旧脚本把「停留在 /login」当作 PASS，等于把 F1 的症状
当成功；W2 修复后改为要求跳进 shell。

### 3.2 网络探针（`network-after.json`）

以租户管理员 `acmeadmin` 打开 `/system/user` 与 `/system/dept`：

```
tenantConsoleCallsAnyPage: []
platformOnlyToasts: []
deptTotal: "5"
deptChildVisible: true
consoleErrors: []
```

对照组是基线：每个页面都会出现 `/system/tenant/list` 与 `tenant.platformOnly`。
`/auth/tenants/current` 现在被调用（这是真实的 scope 信号），`/system/tenant/list` 不再出现。

### 3.3 部门页

- 部门总数从 1 变为 5（接口返回的完整两层树）。
- 子部门 `研发中心（改名）` 与根节点 `Pantheon Base 组织根节点` 同页可见。
- 搜索、排序、分页继续走扁平行；排序仍由服务端参数驱动。

## 4. 不做的事

- **不吞 toast**：没有把 403 提示改成静默；租户管理员根本不发这个请求。
- **不新增 spec 文件**：扩展的是既有 `tenant-viewpoint-switcher.spec.ts` 覆盖的控件行为，
  并用 `ui_walkthrough.cjs` 做了同页证据。
- **不改成 Arco 树表**：任务包允许扁平行，且现有工具栏（搜索/排序/分页）按扁平行工作。

## 5. 剩余风险

- 部门层级现在靠行的顺序表达，没有展开/折叠控件；如果产品需要树形交互，应单独做树表迁移。
- 设置页仍有 4 条 console error（基线同样存在），与 `tenant.platformOnly` 无关，未在本波处理。
