# CMDB 模块设计

## 1. 模块概述

CMDB 是 Pantheon Base 的第一个业务域样例模块，用于验证 `business/*` 能否按模块契约接入平台底座。

当前目标不是一次性实现通用万能 CMDB，而是先完成轻量主数据闭环：

- 资源类型维护
- 资源实例维护
- 资源状态、环境、归属信息记录
- 菜单、权限、i18n、审计与模块注册闭环

## 2. 边界与依赖

模块归属：`business/cmdb`。

CMDB 负责：

- 维护业务资产的类型定义，例如应用、主机、数据库、网络设备。
- 维护业务资产实例，例如某个应用、某台服务器、某个数据库实例。
- 记录资源状态、环境、访问端点、负责人、归属部门等轻量属性。

CMDB 不负责：

- 用户、角色、部门、岗位的管理，这些属于 `system/iam` 与 `system/org`。
- 字典平台本身的管理，这些属于 `system/config`。
- 审计日志平台本身的管理，这些属于 `system/audit`。
- 拓扑图、自动发现、监控采集、配置下发，这些放到后续阶段。

依赖方式：

- 后端不直接 import `modules/system/*` 的 Service 或 Repository。
- 身份、角色、审计通过 `gin.Context` 与统一中间件获取。
- 字典、部门、用户等系统能力通过公共 API 或稳定表引用解耦。
- 平台仪表盘后续可以聚合 CMDB 摘要，但不能反向侵入 CMDB 内部实现。

## 3. 核心业务对象

### 3.1 资源类型

资源类型用于描述一类 CMDB 对象。

示例：

- 应用服务：`application`
- 主机：`server`
- 数据库：`database`
- 网络设备：`network`

### 3.2 资源实例

资源实例是可管理的资产记录。

示例：

- `app-pantheon-api`
- `db-pantheon-prod`
- `srv-prod-001`

## 4. 业务流程与状态流转

当前阶段只做轻量状态：

| 状态 | 说明 |
| :--- | :--- |
| `active` | 正常运行或可用 |
| `inactive` | 已停用 |
| `maintenance` | 维护中 |

后续可扩展为完整生命周期：规划中、上线、变更中、下线、归档。

## 5. 数据模型设计

### 5.1 `biz_cmdb_type`

| 字段 | 说明 |
| :--- | :--- |
| `id` | 主键 |
| `type_code` | 类型编码，业务内唯一 |
| `type_name` | 类型名称 |
| `category` | 类型分类 |
| `status` | 1 启用，2 禁用 |
| `remark` | 备注 |
| `created_at / updated_at / deleted_at` | 标准时间字段 |

### 5.2 `biz_cmdb_item`

| 字段 | 说明 |
| :--- | :--- |
| `id` | 主键 |
| `type_id` | 资源类型 ID |
| `item_code` | 实例编码，业务内唯一 |
| `item_name` | 实例名称 |
| `environment` | 环境，如 `dev/test/staging/prod` |
| `status` | 状态，如 `active/inactive/maintenance` |
| `owner_user_id` | 负责人用户 ID，引用系统用户但不做物理外键 |
| `owner_dept_id` | 归属部门 ID，引用系统部门但不做物理外键 |
| `endpoint` | 访问地址或连接端点 |
| `description` | 描述 |
| `created_at / updated_at / deleted_at` | 标准时间字段 |

### 5.3 `biz_cmdb_relation`

| 字段 | 说明 |
| :--- | :--- |
| `id` | 主键 |
| `source_item_id` | 源资源实例 ID |
| `target_item_id` | 目标资源实例 ID |
| `relation_type` | 关系类型，如 `depends_on/deployed_on/connects_to/backed_by` |
| `remark` | 备注 |
| `created_at / updated_at / deleted_at` | 标准时间字段 |

说明：

- 当前关系模型为轻量有向关系，用于详情页的上下游视图。
- 当前阶段不做完整拓扑引擎、自动发现或图计算。

## 6. API 设计

统一前缀：`/api/v1/business/cmdb`

### 6.1 资源类型

| 方法 | 路径 | 权限 |
| :--- | :--- | :--- |
| `GET` | `/type/list` | `business:cmdb:type:list` |
| `GET` | `/type/import-template` | `business:cmdb:type:import` |
| `POST` | `/type` | `business:cmdb:type:create` |
| `POST` | `/type/export` | `business:cmdb:type:export` |
| `POST` | `/type/import` | `business:cmdb:type:import` |
| `PUT` | `/type/:id` | `business:cmdb:type:update` |
| `DELETE` | `/type/:id` | `business:cmdb:type:delete` |

### 6.2 资源实例

| 方法 | 路径 | 权限 |
| :--- | :--- | :--- |
| `GET` | `/item/list` | `business:cmdb:item:list` |
| `GET` | `/item/import-template` | `business:cmdb:item:import` |
| `GET` | `/item/:id` | `business:cmdb:item:view` |
| `POST` | `/item` | `business:cmdb:item:create` |
| `POST` | `/item/export` | `business:cmdb:item:export` |
| `POST` | `/item/import` | `business:cmdb:item:import` |
| `PUT` | `/item/:id` | `business:cmdb:item:update` |
| `DELETE` | `/item/:id` | `business:cmdb:item:delete` |

### 6.3 资源关系

| 方法 | 路径 | 权限 |
| :--- | :--- | :--- |
| `POST` | `/relation` | `business:cmdb:relation:create` |
| `DELETE` | `/relation/:id` | `business:cmdb:relation:delete` |

## 7. 权限模型

CMDB 按四层权限模型接入：

- 导航权限：是否能看到 CMDB 菜单。
- 页面权限：是否能进入类型页或实例页。
- 操作权限：是否能创建、编辑、删除。
- 接口权限：由 Casbin 维护。

权限点：

- `business:cmdb:type:list`
- `business:cmdb:type:create`
- `business:cmdb:type:update`
- `business:cmdb:type:delete`
- `business:cmdb:type:export`
- `business:cmdb:type:import`
- `business:cmdb:item:list`
- `business:cmdb:item:view`
- `business:cmdb:item:create`
- `business:cmdb:item:update`
- `business:cmdb:item:delete`
- `business:cmdb:item:export`
- `business:cmdb:item:import`
- `business:cmdb:relation:create`
- `business:cmdb:relation:delete`

## 8. 菜单与路由设计

| 菜单 | 路由 | 说明 |
| :--- | :--- | :--- |
| CMDB | `/business/cmdb` | 一级业务菜单组 |
| 资源类型 | `/business/cmdb/types` | 资源类型维护 |
| 资源实例 | `/business/cmdb/items` | 资源实例维护 |

### 8.1 当前动态菜单接入形态

CMDB 当前采用的是 **注册式动态菜单**：

- 后端 `system_menu` 负责菜单树、`title_key`、`component`、`page_perm`、`module` 等导航元数据；
- 前端 `business/cmdb` 模块 manifest 负责页面组件注册与页面级权限声明；
- Layout 不写死 CMDB 菜单项；
- 详情页通过 `activeMenu` 维持左侧导航高亮。

这意味着：

- CMDB 已经满足“新增业务模块可按统一契约接入”的目标；
- 但当前仍不是“纯后端配置即可上线页面”的插件化装配。

### 8.2 下一阶段对齐目标

CMDB 应作为动态菜单下一阶段演进的第一批样板模块，优先验证：

- `component` 从普通元数据提升为受控组件 key；
- 前端通过平台级组件注册表解析 CMDB 页面；
- 菜单 seed、页面权限、manifest 声明可做自动一致性校验。

当前首批已落地：

- CMDB 类型页组件键：`business/cmdb/CMDBTypeList`
- CMDB 实例页组件键：`business/cmdb/CMDBItemList`
- CMDB 详情页组件键：`business/cmdb/CMDBItemDetail`

## 9. 前端页面设计

### 9.1 资源类型页

页面类型：ListPage。

状态要求：

- loading
- empty
- error
- forbidden
- submitting
- import/export feedback

### 9.2 资源实例页

页面类型：ListPage + Drawer/Modal 表单。

字段包括：

- 类型
- 编码
- 名称
- 环境
- 状态
- 负责人
- 归属部门
- 端点
- 描述
- 导入导出按钮与模板下载

### 9.3 资源实例详情页

页面类型：DetailPage。

详情页包含：

- 基本信息卡片
- 实例摘要卡片
- 出向关系表
- 入向关系表
- 轻量新增关系弹窗

关系视图目标：

- 支撑业务侧快速判断上下游依赖
- 不把当前阶段演进成复杂拓扑中心

## 10. 多语言设计

命名空间：`business.cmdb`

Key 示例：

- `cmdb.menu.root`
- `cmdb.menu.types`
- `cmdb.menu.items`
- `cmdb.type.title`
- `cmdb.item.title`
- `cmdb.item.environment`
- `cmdb.item.status`
- `cmdb.error.typeCodeExists`

## 11. 字典与配置依赖

当前模块自带基础字典 seed：

- `cmdb_environment`：`dev/test/staging/prod`
- `cmdb_item_status`：`active/inactive/maintenance`
- `cmdb_relation_type`：`depends_on/deployed_on/connects_to/backed_by`

业务模块只注册自身需要的字典，不接管系统字典管理能力。

## 12. 审计与安全要求

必须审计：

- 新增资源类型
- 编辑资源类型
- 删除资源类型
- 新增资源实例
- 编辑资源实例
- 删除资源实例
- 新增资源关系
- 删除资源关系

审计统一走平台操作日志，不在 CMDB 内部重复造审计表。

导入场景额外要求：

- 审计参数中记录导入文件名、文件大小、资源对象（type / item）。
- 审计结果中记录 `created / updated / failed` 汇总及错误样本。
- 当导入结果存在校验错误、即使接口响应为 200 + result，也必须在 `system_log_oper` 中标记为失败，避免“业务失败但审计显示成功”。

## 13. Seed 与初始化

CMDB 模块启动时负责：

- 自动迁移 `biz_cmdb_type` 与 `biz_cmdb_item`
- 初始化基础资源类型
- 初始化 CMDB 字典
- 初始化菜单与按钮权限节点
- 绑定 admin 角色默认菜单权限
- 在业务模块菜单 seed 完成后补齐 `system_role_permission`，修正 `system/iam` 先初始化、`business/cmdb` 后注册导致的权限回填时序差

## 14. 风险与边界外事项

当前阶段暂不做：

- 自动发现
- 完整拓扑关系图
- 资产变更审批
- 监控集成
- 多租户隔离

## 15. 测试与验收

最小验收：

- 后端 `go test ./...` 通过。
- 前端 `npm run build` 通过。
- admin 登录后可看到 CMDB 菜单。
- 资源类型可增删改查。
- 资源实例可增删改查。
- 资源类型与资源实例支持 CSV 导入、导出、模板下载。
- 导入失败时自动下载错误明细 CSV，便于业务侧修正后二次导入。
- 资源实例详情页可查看上下游轻量关系，并支持新增、删除关系。
- 平台仪表盘可聚合展示 CMDB 类型数、实例数、运行中实例数。
- 低权限用户不能绕过页面权限或接口权限。
- 新增、编辑、删除写入统一操作日志。
