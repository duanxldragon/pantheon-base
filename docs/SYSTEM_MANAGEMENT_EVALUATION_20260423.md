# 系统管理功能检查与评估（2026-04-23）

本次评估遵循 Pantheon 分层边界，按以下系统域执行：

- `system/iam`：用户、角色、菜单、权限
- `system/org`：部门、岗位
- `system/config`：字典、系统设置
- `system/auth`：登录日志、会话管理
- `system/audit`：操作日志

## 一、结论摘要

本轮检查后，**没有发现“系统管理下大面积不可用”的情况**。当前确认的核心问题集中在 `system/config`：

1. **系统设置中的站点名称修改后，应用壳层与登录页品牌名不会实时同步**
2. **系统设置保存按钮没有按 `system:setting:update` 操作权限做前端约束**
3. **系统页 smoke 覆盖不完整，之前遗漏了设置、登录日志、会话、操作日志**

上述问题已在本轮修复，并完成回归验证。

## 二、根因分析

### 1. 站点名称修改不生效

这不是数据库保存失败，也不是后端缓存未刷新，而是**平台壳层读取逻辑缺失**：

- 后端 `system/setting` 已支持 `site.name` 的公开读取与更新
- 但前端登录页和应用壳层一直直接使用静态 i18n 文案 `app.name`
- 因此即使 `site.name` 更新成功，页面品牌名仍显示旧值

结论：这是 **前端功能性问题**，不是单纯缓存脏数据问题。

### 2. 设置保存权限约束缺失

- 后端已有 `system:setting:update`
- 前端 `SettingPage` 之前未对保存动作做显式约束

结论：这是 **前端操作授权收口不完整**。

### 3. 系统页验证覆盖不足

原 `frontend/tests/smoke/system-pages.spec.ts` 仅覆盖：

- 用户
- 角色
- 菜单
- 部门
- 岗位
- 权限
- 字典

遗漏：

- 系统设置
- 登录日志
- 会话管理
- 操作日志

结论：这是 **测试覆盖缺口**，不是业务逻辑本身必然故障。

## 三、本轮修复

### platform / system/config

- 新增公共设置状态：`frontend/src/core/settings/publicSettings.ts`
- 启动时初始化公开配置：`frontend/src/main.tsx`
- 登录页品牌名改为读取 `site.name / site.logo`
- 应用壳层品牌名改为读取 `site.name / site.logo`
- 同步更新浏览器 `document.title`
- 系统设置保存后，`basic / i18n / ui` 分组会刷新公开配置

### system/config 权限体验

- 设置页保存按钮接入 `system:setting:update` 前端约束
- `SubmitBar` 增加 `submitDisabled` 支持

### 测试补强

- 新增后端设置服务测试：
  - 公开配置缓存失效
  - 敏感配置留空保持原值
  - number/json 类型校验
- 扩展系统页 smoke：
  - `/system/setting`
  - `/system/login-log`
  - `/system/session`
  - `/system/operation-log`
- 新增品牌联动 smoke：
  - 修改 `site.name`
  - 验证侧边品牌名与浏览器标题同步更新

## 四、验证结果

### 前端

- `cd frontend && npm run build` ✅
- `cd frontend && npm run test:smoke:system` ✅（12/12 通过）

### 后端

- `cd backend && go test ./modules/system/setting` ✅
- `cd backend && go test ./modules/system/...` ✅

## 五、当前评估结果

### `system/iam`

- 用户、角色、菜单、权限页面主链路可打开，列表区正常渲染
- 本轮未发现新的页面级阻断问题

### `system/org`

- 部门、岗位页面主链路可打开，列表/树结构正常渲染
- 本轮未发现新的页面级阻断问题

### `system/config`

- 字典管理主链路正常
- 系统设置此前存在“改了但品牌不生效”的真实问题，现已修复

### `system/auth`

- 登录日志、会话管理页面主链路正常
- 本轮未发现新的页面级阻断问题

### `system/audit`

- 操作日志页面主链路正常
- 本轮未发现新的页面级阻断问题

## 六、剩余建议

以下属于后续增强，不属于本轮确认缺陷：

1. `system/config` 中的安全策略、登录策略、上传策略，建议继续向运行时真实策略收口，而不只停留在配置维护
2. 可补一轮基于 gstack Browser 的人工验收，重点看：
   - 设置保存后的视觉反馈
   - 站点 logo 展示效果
   - 长品牌名下的壳层布局稳定性
3. 可继续补充专项 smoke：
   - 字典 CRUD
   - 设置分组保存
   - 会话强制下线
   - 操作日志详情弹窗

