# Auth 模块拆分设计

更新时间：2026-04-17

本文用于把“认证与会话”从当前 `system/user` 混合实现中拆分为独立能力域，目标是在项目早期就锁定边界，避免后期继续把登录、用户管理、角色权限、安全策略揉成一个模块。

## 1. 设计目标

- **职责清晰**：`auth` 只负责“你是谁、是否可登录、会话是否有效”。
- **边界稳定**：`iam` 负责用户、角色、菜单、权限；`auth` 不承担后台管理 CRUD。
- **易于扩展**：为后续验证码、MFA、SSO、登录设备、安全策略、租户登录做好演进空间。
- **先逻辑拆分，后代码实现**：当前优先完成文档和边界设计，后续按计划分阶段重构。

## 2. 拆分结论

**结论：必须拆。**

但拆分方式是：

- **先做模块边界拆分**
- **再做代码目录拆分**
- **暂不做微服务拆分**
- **短期不强制拆表**

也就是说，当前阶段要把“认证域”从“系统管理域”中独立建模，而不是立刻拆成独立服务。

## 3. 当前问题

当前 `backend/modules/system/user/` 同时承担：

- 登录
- refresh token 轮换
- logout
- session 管理
- 当前用户 profile
- 密码修改
- 登录日志
- 用户列表 CRUD
- 角色绑定

这会导致几个长期问题：

1. **安全能力和后台管理耦合**
2. **文件职责持续膨胀**
3. **后续引入 MFA / SSO / 设备管理时无处安放**
4. **AI 容易继续把 auth 逻辑写进 user 模块**

## 4. 目标模块边界

建议把底座系统域拆成下面几块：

| 能力域 | 说明 | 典型职责 |
| :--- | :--- | :--- |
| `auth` | 认证与会话安全 | login、refresh、logout、session、password、security |
| `iam` | 身份与授权管理 | user、role、menu、permission |
| `org` | 组织架构 | dept、post |
| `i18n` | 多语言 | 语言包、翻译资源 |
| `audit` | 审计 | 操作日志、登录日志 |
| `config` | 平台配置 | dict、setting |

### 4.1 `auth` 的职责

`auth` 负责：

- 登录认证
- refresh token 轮换
- logout
- 当前会话读取
- 会话吊销
- 修改当前登录用户密码
- 登录日志
- 安全策略（密码策略、登录失败限制、验证码、MFA 等）

### 4.2 `auth` 不负责

`auth` 不负责：

- 用户列表 CRUD
- 角色 CRUD
- 菜单 CRUD
- 权限策略 CRUD
- 部门岗位维护

这些属于 `iam` / `org`。

## 5. 推荐目录结构

### 5.1 后端

```text
backend/modules/
  auth/
    module.go
    auth_handler.go
    auth_service.go
    auth_dto.go
    session_model.go
    login_log_model.go
  system/
  user/
    user_handler.go
    user_service.go
    user_dto.go
    user_model.go
  role/
  menu/
  permission/
  dept/
  post/
```

### 5.2 前端

```text
frontend/src/modules/
  auth/
    Login.tsx
    SecurityCenter.tsx
    SessionList.tsx
    api.ts
    index.ts
  system/
  user/
  role/
  menu/
  permission/
  dept/
  post/
  profile/
```

## 6. API 边界建议

### 6.1 `auth` 域接口

建议收敛为：

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | 登录 |
| `POST` | `/api/v1/auth/refresh` | 刷新 token |
| `POST` | `/api/v1/auth/logout` | 注销当前会话 |
| `GET` | `/api/v1/auth/me` | 获取当前登录主体信息 |
| `GET` | `/api/v1/auth/sessions` | 获取当前账号在线会话，仅返回未吊销且 refresh token 未过期的活跃会话，当前会话优先展示 |
| `DELETE` | `/api/v1/auth/sessions/:id` | 下线某个会话 |
| `PUT` | `/api/v1/auth/password` | 修改当前账号密码 |
| `GET` | `/api/v1/auth/security` | 获取安全配置/状态 |

### 6.2 `system/iam` 域接口

建议保留：

- `/api/v1/system/user/*`
- `/api/v1/system/role/*`
- `/api/v1/system/menu/*`
- `/api/v1/system/permission/*`
- `/api/v1/system/dept/*`
- `/api/v1/system/post/*`

## 7. 数据模型建议

### 7.1 可保留现有表

当前阶段可以先保留：

- `system_user`
- `system_user_session`
- `system_log_login`

但逻辑归属改为：

- `system_user` 归 `iam`
- `system_user_session` 归 `auth`
- `system_log_login` 归 `audit/auth`

### 7.2 后续可扩展表

后续建议预留：

- `system_auth_policy`
- `system_auth_factor`
- `system_user_device`
- `system_login_risk_event`

## 8. 前端页面规划

`auth` 拆分后，前端建议形成三个层级：

### 8.1 认证入口页

- 登录页
- 忘记密码页（后续）
- 二次验证页（后续）

### 8.2 安全中心页

- 当前账号安全概览
- 登录设备列表
- 在线会话管理
- 密码修改
- 安全策略提示

### 8.3 账号资料页

资料维护继续保留在 `profile`，但安全相关入口逐步迁移到 `auth/security`。

## 9. 分阶段重构计划

### Phase 1：文档锁边界

- 完成 `auth` 能力域设计
- 完成前后端职责划分
- 完成 API 与页面规划

### Phase 2：后端逻辑拆分

- 从 `system/user` 中抽离 login / refresh / logout / session / password / login log
- 新建 `backend/modules/auth/`
- 由独立 `auth.InitAuthModule()` 负责装配

### Phase 3：前端模块拆分

- `Login.tsx` 移到 `modules/auth/`
- 新增 `SecurityCenter.tsx`
- 新增 `SessionList.tsx`
- `ProfileCenter` 只保留资料维护

### Phase 4：接口收口

- 将认证相关路由逐步迁到 `/api/v1/auth/*`
- 兼容保留旧路径一段时间
- 更新前端请求封装和文档

## 9.1 当前实现状态

当前代码已完成第一轮物理拆分：

- 后端已新增 `backend/modules/auth/`
- 前端登录页已迁到 `frontend/src/modules/auth/Login.tsx`
- 前端认证请求已迁到 `frontend/src/modules/auth/api.ts`
- `auth` 已由独立 `auth.InitAuthModule()` 装配，不再挂在 `system` 物理目录下
- 后端已新增 `/api/v1/auth/login`、`/api/v1/auth/refresh`、`/api/v1/auth/logout`、`/api/v1/auth/me`、`/api/v1/auth/password`
- 旧 `/api/v1/system/*` 认证路径仍保留兼容

当前仍保留的过渡点：

- `profile` 页面已收口为资料维护，安全能力已独立进入 `auth/security`
- JWT 中间件仍直接校验 `system_user_session` 表
- 当前用户会话管理、当前用户登录日志、管理员登录日志页、管理员全局会话页已落地

当前下一批待推进：

- `GET /api/v1/auth/security` 安全概览独立接口
- 管理员会话页的更完整筛选与设备信息解析
- 登录日志与安全事件进一步归入 `audit/auth`

其中第一项已完成当前阶段落地：

- `/api/v1/auth/security` 已返回当前用户信息、当前会话、活跃会话数、最近成功登录时间
- 当前会话与会话列表已补充 `browser / os / device / userAgent`
- 登录日志写入时会基于 User-Agent 记录浏览器与操作系统基础识别结果

## 10. 本次设计决策

### 必须坚持

- `auth` 是独立能力域，不再视为 `user` 的附属功能
- 不为“快”继续把认证逻辑塞回用户管理模块
- 先拆边界，再拆代码，再优化接口路径

### 暂不做

- 暂不微服务化
- 暂不拆数据库
- 暂不一次性改完所有路径

## 11. 后续关联文档

- `DESIGN.md`
- `docs/BACKEND.md`
- `docs/FRONTEND.md`
- `docs/FRONTEND_UI_SPEC.md`
- `AGENTS.md`
