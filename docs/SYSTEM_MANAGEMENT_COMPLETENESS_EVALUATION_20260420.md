# 系统管理完整性评估报告（2026-04-20）

执行者：Pantheon 专家
评估方式：复用既有 QA 证据 + 静态完整性审查 + 构建/后端测试验证
本轮原则：已做过页面可达性冒烟的页面不重复浏览器重测

## 1. 层级边界

本次评估不把 `system` 当作一个大杂烩模块，而是按能力域拆分：

- `system/auth`：登录、安全中心、登录日志、会话管理
- `system/iam`：用户、角色、菜单、权限、个人中心
- `system/org`：部门、岗位
- `system/config`：字典、系统设置
- `system/audit`：操作日志，当前代码中以 `audit` 模块存在，但既有 QA 报告曾归到 `system/iam`，建议后续文档统一为审计能力域

`/dashboard` 属于 `platform` 聚合视图，不纳入本次系统管理问题判断。

## 2. 已复用的测试证据

既有归档报告 `docs/QA_SMOKE_REPORT_20260420.md` 覆盖了 16 个页面：

- `platform`：`/dashboard`
- `system/auth`：`/login`、`/auth/security`、`/system/login-log`、`/system/session`
- `system/iam`：`/system/profile`、`/system/user`、`/system/user/1`、`/system/role`、`/system/menu`、`/system/permission`、`/system/operation-log`
- `system/org`：`/system/dept`、`/system/post`
- `system/config`：`/system/dict`、`/system/setting`

本轮没有重新做这些页面的“能否打开 + console error”测试。
原因是现有证据已经证明路由可达性和基础加载通过，本次重点转向完整性缺口。

## 3. 总体结论

系统管理当前状态可以概括为：

- 页面可达性：基本完整，前端注册路由没有发现漏测页面
- 基础构建：通过，前端生产构建成功
- 后端测试：通过，`backend` 全量 Go 测试通过
- 产品完整性：仍未完全闭环，主要缺口集中在权限态、错误态和交互深度

结论不是“页面打不开”，而是“部分页面只达到了可访问，不等于完整可运营”。

## 4. 关键发现

### P0：操作日志路由缺少前端页面权限守卫

`system/audit` 的模块注册声明了 `system:operation-log:list` 权限，但路由本身没有绑定 `pagePermission`。

影响：

- 用户如果没有操作日志页面权限，仍可能通过直接输入 `/system/operation-log` 进入页面壳层
- 后端接口仍会受服务端权限影响，但前端 403 体验不完整
- 与 `docs/PERMISSION_MODEL.md` 中“页面权限不等于列表权限、无权限体验必须清晰”的目标不一致

证据：

- `frontend/src/modules/system/audit/index.ts` 注册了 `path: 'system/operation-log'`
- 同文件声明了 `system:operation-log:list`
- 当前 SQLite 的 `system_menu.page_perm` 已有 `system:operation-log:list`
- 前端路由 manifest 未消费这个页面权限

建议：

- 在 `AuditModule.routes[0]` 上补 `pagePermission: 'system:operation-log:list'`
- 统一把操作日志归类为 `system/audit`，避免继续塞进 `system/iam`

### P0：系统设置声明了更新权限，但保存动作没有消费

`system/setting` 模块声明了 `system:setting:update`，但页面只检查了 `system:setting:refresh`。保存按钮始终可见可点。

影响：

- 只有查看权限的角色可能看到“保存/取消”操作
- 如果后端拒绝，会变成“点击后失败”的晚失败体验
- 违反“按钮/资源权限必须独立建模”的项目红线

证据：

- `frontend/src/modules/system/setting/index.ts` 声明 `system:setting:update`
- `frontend/src/modules/system/setting/SettingPage.tsx` 只计算 `canRefreshCache`
- `SubmitBar` 没有绑定 `canUpdate`

建议：

- 增加 `const canUpdate = isAdmin || hasPerm('system:setting:update')`
- 保存与取消按钮按 `canUpdate` 做禁用或隐藏
- 表单字段在无更新权限时应只读，避免误导

### P1：核心管理列表页错误态不完整

部分系统管理页面加载失败时只弹 `Message.error`，没有页面级 `PageError`、重试入口或明确错误态。

影响：

- 网络/API 异常时用户只看到一次 toast，随后页面可能表现为空表
- 空态和错误态混淆，不利于排障
- 不满足 `loading / empty / error / forbidden / submitting` 五类状态要求

受影响页面：

- `system/iam`：用户、角色、菜单、权限
- `system/org`：部门、岗位
- `system/config`：字典

对比：

- 登录日志、会话管理、操作日志、用户详情、系统设置、安全中心已经有不同程度的 `PageError` 或细分错误态

建议：

- 列表页统一引入 `loadFailed` 状态
- API 失败时渲染 `PageError onRetry`
- 保留表格 `emptyText` 只表示真实空数据

### P1：系统设置缺少真实空态

`SettingPage` 只处理：

- 初始加载：`PageLoading`
- 初始错误：`PageNetworkError` / `PageServerError` / `PageError`
- 有配置：渲染配置分组

但没有处理“接口成功返回空数组”的页面空态。

影响：

- 如果种子异常、租户隔离后无配置、或未来按模块过滤为空，页面只剩标题
- 用户不知道是无配置、加载失败还是权限问题

建议：

- 在 `!loading && !error && settings.length === 0` 时渲染 `PageEmpty`
- 空态文案使用 `system.setting.empty`

### P1：既有 QA 是可达性冒烟，不是完整交互验收

现有 `PASS` 主要证明：

- 页面能打开
- console error 清零
- 主要页面截图与无障碍快照可采集

尚未证明：

- 新增/编辑/删除表单提交
- 表单必填与非法值校验
- 角色授权保存
- 权限策略 CRUD
- 字典类型与字典项主从维护
- 系统设置每个 tab 的保存/缓存刷新
- 操作日志详情/删除/清空
- 会话下线
- 安全中心改密码
- 低权限账号的页面 403 与按钮权限态

建议后续不要重复“打开页面”，而是只做交互深度测试。

### P2：操作日志现有 QA 证据里出现过 i18n key 泄漏

既有原始快照里出现过按钮文本 `common.clear`。当前静态代码的 fallback 资源已经包含：

- `common.clear`
- `common.clearConfirm`
- `common.clearSuccess`

当前 SQLite 的 `system_i18n` 为空，不会覆盖 fallback。
因此这个问题更像是旧构建或旧快照证据未刷新，不一定是当前代码仍存在。

建议：

- 下次只复核操作日志按钮文案，不需要全量重测页面
- 如果仍出现 key，优先查 i18n 初始化时机和远端语言包覆盖

### P2：登录页“忘记密码”是可点击按钮但没有动作

这属于 `system/auth` 入口页，不是系统管理核心页。
如果当前阶段不做找回密码，应改成禁用态、隐藏，或给出“暂未开放”的反馈。

## 5. 页面完整性矩阵

| 页面 | 层级 | 可达性 | 当前完整性判断 |
| :--- | :--- | :--- | :--- |
| `/system/user` | `system/iam` | 已测 PASS | CRUD 可见，但错误态需增强 |
| `/system/user/1` | `system/iam` | 已测 PASS | 详情错误态较完整 |
| `/system/role` | `system/iam` | 已测 PASS | 授权交互未深测，错误态需增强 |
| `/system/menu` | `system/iam` | 已测 PASS | 菜单元数据已增强，错误态需增强 |
| `/system/permission` | `system/iam` | 已测 PASS | 权限页可用，工作台/策略交互未深测，错误态需增强 |
| `/system/profile` | `system/iam` | 已测 PASS | 自助资料可用，加载失败只有 toast |
| `/system/dept` | `system/org` | 已测 PASS | CRUD 可见，错误态需增强 |
| `/system/post` | `system/org` | 已测 PASS | CRUD 可见，错误态需增强 |
| `/system/dict` | `system/config` | 已测 PASS | 主从页可用，错误态需增强 |
| `/system/setting` | `system/config` | 已测 PASS | 更新权限未消费，空态缺失 |
| `/system/login-log` | `system/auth` | 已测 PASS | 列表错误态较完整 |
| `/system/session` | `system/auth` | 已测 PASS | 列表错误态较完整，会话下线未深测 |
| `/auth/security` | `system/auth` | 已测 PASS | 安全中心错误态较完整，改密未深测 |
| `/system/operation-log` | `system/audit` | 已测 PASS | 缺页面权限守卫，清空/删除/详情未深测 |

## 6. 本轮验证命令

已执行：

```bash
cd frontend; cmd /c npm run build
cd backend; go test ./...
```

结果：

- 前端构建通过
- 后端测试通过

未执行新的浏览器页面重测：

- 当前本地 `127.0.0.1:5173` 与 `127.0.0.1:8080` 未启动
- 本轮目标是避免重复已测页面，优先做完整性评估

## 7. 建议收口顺序

1. 先修 `system/audit` 操作日志页面权限守卫
2. 再修 `system/config` 系统设置保存动作权限态
3. 统一系统管理列表页错误态模板
4. 补系统设置空态
5. 只针对交互做下一轮 QA，不重复页面打开测试

下一轮最小交互测试建议：

- 低权限账号访问 `/system/operation-log` 应显示 403
- 低权限账号访问 `/system/setting` 时保存按钮不可用或表单只读
- 断开后端后，用户/角色/菜单/部门/岗位/权限/字典页应显示 `PageError`
- 操作日志详情、删除、清空三个动作可完成或按权限正确隐藏
- 系统设置每个 tab 的保存和缓存刷新按权限正确工作
