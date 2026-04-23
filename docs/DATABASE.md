# 数据库设计规范与详细说明

## 1. 基础规范
- **引擎**: 统一使用 InnoDB。
- **编码**: `utf8mb4_general_ci`。
- **主键**: 统一使用 `bigint unsigned NOT NULL AUTO_INCREMENT`。
- **软删除**: 使用 GORM 默认的 `deleted_at` 字段，类型为 `datetime(3)`，默认值为 `NULL`。

## 2. 命名契约
- **底座表**: `system_` 前缀。
- **业务表**: `biz_` 前缀。
- **中间表**: `_rel_` 或 `_mapping` 风格（如 `system_rel_user_role`）。

## 3. 核心表详细说明

### 3.1 动态多语言存储 (`system_i18n`)
- **lang_key**: 唯一键名，建议层级命名（如 `auth.login.fail`）。
- **lang_type**: 语言代码 (zh-CN, en-US)。
- **查询优化**: 在 `(lang_key, lang_type)` 上建立复合唯一索引，确保查询及同步性能。

### 3.2 审计日志
- **操作日志 (`system_log_oper`)**:
  - `oper_param`: 存储 JSON 格式的请求体，需在中间件中进行脱敏处理。
  - `cost_time`: 记录 API 执行毫秒数，用于性能审计。
- **登录日志 (`system_log_login`)**:
  - 必须记录 `ipaddr`, `browser` 和 `login_location`（离线 IP 库解析）。

### 3.3 用户会话 (`system_user_session`)
- **session_id**: 会话主键，同时写入 access/refresh token。
- **refresh_jti**: 当前有效 refresh token 的 JTI。每次刷新都会轮换，旧 refresh token 会失效。
- **revoked_at**: 注销或强退时写入，受保护接口会检查会话是否仍有效。
- **refresh_expires_at**: 会话最长有效期，超过后必须重新登录。

### 3.3.1 用户软删除与唯一键
- **system_user.username**: 仍保持物理唯一约束。
- **软删除复用策略**: 删除用户时，服务层会先把已删除账号的 `username` 归档为内部保留值，再执行软删除；启动迁移也会自动修复历史已删除但仍占用用户名的数据，保证用户名可被重新创建。

### 3.3.2 其他系统域软删唯一键
- **system_role.role_key**、**system_post.post_code**、**system_dict_type.dict_code** 以及 **system_dict_item(dict_code, item_value)** 同样采用“归档唯一标识后再软删除”的策略。
- **目标**: 既保留审计与历史记录，又允许管理员在删除旧记录后重新创建相同标识的新记录。

### 3.4 Casbin 策略表 (`casbin_rule`)
- **来源**: `database/system_init.sql` 会直接建表并写入管理员默认策略；应用启动时也会通过 GORM Adapter 再做一次迁移与同步，保证脚本初始化和运行时行为一致。
- **用途**: 持久化保存 `p` / `g` 策略，避免服务重启后权限丢失。
- **初始化策略**: 系统启动时会确保 `admin` 拥有 `/api/v1/*` 的 `GET/POST/PUT/PATCH/DELETE` 权限。
- **管理入口**: 现已提供系统权限管理页面，直接维护 `casbin_rule` 中的 `p` 策略记录。

### 3.5 组织结构表 (`system_dept`, `system_post`)
- **system_dept**: 使用 `parent_id + ancestors` 维护树形组织结构，祖级路径由服务层自动计算和刷新。
- **组织根节点**: `system_dept.is_root=1` 表示组织根节点，用于承载“公司 / 组织”这一最高层；根节点不允许删除或挂到其他上级之下。
- **system_post**: 通过 `dept_id` 与 `system_dept` 建立部门-岗位一对多逻辑关联，不使用物理外键；岗位必须归属具体部门，不直接挂组织根节点。
- **用户接入**: `system_user.dept_id`、`system_user.post_id` 已用于用户管理页面的组织字段维护；用户选择岗位时必须与所选部门匹配。

## 4. 索引与性能
- **状态字段索引**: `status` 字段由于区分度低，通常不需要独立索引，除非结合其他字段做复合索引。
- **外键约束**: 为了支持后续的模块化拆分，**严禁使用数据库物理外键**。通过程序逻辑（Service 层）确保数据完整性。

## 5. 初始初始化路径
- [DDL 脚本见这里](../database/system_init.sql)
- `database/system_init.sql` 中默认管理员账号为 `admin / 123456`，密码已使用 bcrypt 哈希。
