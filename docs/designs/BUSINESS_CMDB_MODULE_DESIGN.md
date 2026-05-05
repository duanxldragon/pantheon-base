# CMDB 业务模块设计

更新时间：2026-05-05

类型：Design
归属层：business/cmdb
状态：Active

本文用于补齐 `business/cmdb` 的业务域设计锚点。当前代码已经存在 `business/cmdb/host` 切片，历史缺口在于没有把 CMDB 业务域、Host 子模块以及后续 Vendor 子模块的边界、菜单、权限、i18n、审计和验收要求集中声明。

---

## 1. 模块概述

CMDB 是业务域模块，负责承载基础资源台账、资源属性维护、资源生命周期状态和后续资源关系治理。

当前已落地子模块：

- `business/cmdb/host`：主机资源台账。
- `business/cmdb/vendor`：供应商、云厂商、IDC 或资产来源方治理基础 CRUD。

后续规划子模块：

- `business/cmdb/application`：应用与服务资源治理。
- `business/cmdb/relation`：资源关系、依赖拓扑与影响面分析。

CMDB 不负责：

- 登录、MFA、会话、安全策略，这些属于 `system/auth`。
- 用户、角色、菜单、权限策略，这些属于 `system/iam`。
- 部门、岗位、组织树，这些属于 `system/org`。
- 字典、设置、i18n、动态模块、生成器，这些属于 `system/config`。

## 2. 边界与依赖

| 类别 | 允许依赖 | 禁止依赖 |
| :--- | :--- | :--- |
| platform | `pkg/common`、统一响应、审计元数据、数据权限上下文 | 直接修改平台壳层或工作台聚合逻辑 |
| system/auth | `gin.Context` 中的登录主体、会话上下文 | 直接 import `modules/auth` Service |
| system/iam | 权限点、页面权限、Casbin 接口鉴权结果 | 在业务模块内直接写角色授权逻辑 |
| system/org | 用户的组织归属、部门维度数据范围 | 直接依赖 org 内部 repository |
| system/config | 字典、配置、i18n key、上传入口 | 在业务模块内重复造字典、配置或上传协议 |

## 3. 核心业务对象

| 对象 | 说明 | 当前状态 |
| :--- | :--- | :--- |
| Host | 主机、服务器、云主机或裸金属资源 | 已实现 |
| Vendor | 供应商、云厂商、IDC、资产来源方 | 基础 CRUD 已实现，导入导出待补 |
| Application | 应用、服务或系统资源 | 后续规划 |
| Resource Relation | 资源间依赖关系 | 后续规划 |

## 4. Host 子模块

### 4.1 归属

`business/cmdb/host` 是 CMDB 业务域下的子模块，不是独立业务域，也不是 system 能力。

### 4.2 数据模型

当前表：`biz_cmdb_host`。

关键约束：

- 表名前缀符合 `biz_` 要求。
- 列表接口已接入 `DataScopeReq + WithDataScope`，具备未来数据权限和租户过滤扩展位。
- `dept_id` 是 Host 当前的数据范围归属字段，`dept_and_children` 会基于系统域部门树展开后的 `DeptIDs` 过滤主机列表。
- 后端回归 `go test ./backend/modules/business/cmdb/host` 已固定：当前部门及下级部门主机可见，其他部门主机不可见。
- 当前属于单租户运行，后续若进入真实多租户，应优先审查主机编码唯一键是否从平台全局唯一调整为租户内唯一。

### 4.3 API 与权限

| 能力 | 建议接口语义 | 权限点 |
| :--- | :--- | :--- |
| 列表 | `GET /api/v1/business/cmdb/hosts` | `business:cmdb:host:list` |
| 详情 | `GET /api/v1/business/cmdb/hosts/:id` | `business:cmdb:host:detail` |
| 新增 | `POST /api/v1/business/cmdb/hosts` | `business:cmdb:host:create` |
| 编辑 | `PUT /api/v1/business/cmdb/hosts/:id` | `business:cmdb:host:update` |
| 删除 | `DELETE /api/v1/business/cmdb/hosts/:id` | `business:cmdb:host:delete` |
| 导出 | `POST /api/v1/business/cmdb/hosts/export` | `business:cmdb:host:export` |

约束：

- 页面权限、按钮权限和接口权限必须分层。
- 不允许使用 `business:cmdb:host:list` 兜底新增、编辑、删除。

### 4.4 菜单与路由

| 菜单 key | 路径 | 标题 key | 组件键 | 类型 |
| :--- | :--- | :--- | :--- | :--- |
| `business.cmdb` | `/business/cmdb` | `business.cmdb.menu` | 空或目录组件 | `M` |
| `business.cmdb.host` | `/business/cmdb/host` | `business.cmdb.host.menu` | `business/cmdb/host/CmdbHostList` | `C` |

菜单标题必须使用 `titleKey`，组件键必须同时进入前端组件注册表和后端菜单组件白名单。

### 4.5 i18n

Host 子模块使用前缀：

- `business.cmdb.*`
- `business.cmdb.host.*`
- `cmdbhost.*` 用于后端错误 key。

新增字段、按钮、空态、错误态、导入导出摘要必须补齐所有 locale key。

### 4.6 审计

Host 子模块至少覆盖：

- `business.cmdb.host.audit.create`
- `business.cmdb.host.audit.update`
- `business.cmdb.host.audit.delete`
- 后续导入、导出、批量操作必须补审计点。

## 5. Vendor 子模块

### 5.1 归属

`business/cmdb/vendor` 属于 CMDB 业务域的子模块。它不应新增为 `system/config` 的供应商字典，也不应写入平台层工作台。

### 5.2 目标

Vendor 负责维护资源来源方与供应商治理信息：

- 供应商编码、名称、类型、状态。
- 云厂商、IDC、托管商、硬件厂商等分类。
- 联系方式、服务等级、合同或支持信息的扩展位。

### 5.3 数据模型建议

当前表：`biz_cmdb_vendor`。

建议字段：

- `id`
- `vendor_code`
- `vendor_name`
- `vendor_type`
- `status`
- `contact_name`
- `contact_email`
- `contact_phone`
- `remark`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `deleted_at`

租户就绪判断：

- Vendor 大概率会随业务空间或租户隔离，设计时应评估是否预留 `tenant_id`。
- `vendor_code` 更可能是租户内唯一，不应默认写死为平台全局唯一。

### 5.4 API 与权限

| 能力 | 建议接口语义 | 权限点 |
| :--- | :--- | :--- |
| 列表 | `GET /api/v1/business/cmdb/vendors` | `business:cmdb:vendor:list` |
| 详情 | `GET /api/v1/business/cmdb/vendors/:id` | `business:cmdb:vendor:detail` |
| 新增 | `POST /api/v1/business/cmdb/vendors` | `business:cmdb:vendor:create` |
| 编辑 | `PUT /api/v1/business/cmdb/vendors/:id` | `business:cmdb:vendor:update` |
| 删除 | `DELETE /api/v1/business/cmdb/vendors/:id` | `business:cmdb:vendor:delete` |
| 导入 | `POST /api/v1/business/cmdb/vendors/import` | `business:cmdb:vendor:import` |
| 导出 | `POST /api/v1/business/cmdb/vendors/export` | `business:cmdb:vendor:export` |

### 5.5 菜单与路由

| 菜单 key | 路径 | 标题 key | 组件键 | 类型 |
| :--- | :--- | :--- | :--- | :--- |
| `business.cmdb.vendor` | `/business/cmdb/vendor` | `business.cmdb.vendor.menu` | `business/cmdb/vendor/CmdbVendorList` | `C` |

### 5.6 当前实现状态

已落地：

- 后端 `backend/modules/business/cmdb/vendor` 垂直切片。
- 前端 `frontend/src/modules/business/cmdb/vendor` 页面和模块注册。
- `biz_cmdb_vendor` 表、列表/详情/新增/编辑/删除接口。
- 菜单 seed、组件键注册和 `business:cmdb:vendor:*` 权限点。
- 列表接口接入 `DataScopeReq + WithDataScope` 扩展位。
- 新增、编辑、删除审计 metadata。
- 多语言 key 覆盖当前页面和字段。

仍待补：

- 导入/导出接口、页面入口和审计点。
- 供应商类型、状态与 `system/config` 字典项联动。
- 租户字段是否进入真实 DDL 的最终决策。

### 5.7 字典依赖

Vendor 子模块建议依赖业务字典：

- `cmdb_vendor_type`
- `cmdb_vendor_status`

字典属于 `system/config` 提供的公共能力，但业务语义归属 `business/cmdb`。

### 5.8 审计

Vendor 子模块必须覆盖新增、编辑、删除、导入、导出审计。

审计 action 建议：

- `business.cmdb.vendor.audit.create`
- `business.cmdb.vendor.audit.update`
- `business.cmdb.vendor.audit.delete`
- `business.cmdb.vendor.audit.import`
- `business.cmdb.vendor.audit.export`

## 6. 验收要求

CMDB 任一子模块进入完成状态前，必须通过：

- 菜单和路由注册检查。
- 页面权限、按钮权限、接口权限检查。
- i18n key 完整性检查。
- 错误 key 统一检查。
- 审计点覆盖检查。
- 数据权限扩展位检查。
- 租户就绪判断检查。

具体验收以 `docs/acceptances/BUSINESS_MODULE_ACCEPTANCE_MATRIX.md` 为准。
