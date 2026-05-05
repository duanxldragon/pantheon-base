# business/* 业务模块验收矩阵

更新时间：2026-05-05

类型：Acceptance
归属层：business/*
状态：Active

本文把业务模块验收从“参考模板”升级为固定矩阵，适用于 `business/cmdb` 以及后续所有 `business/*` 模块。

---

## 1. 九维验收矩阵

| 维度 | 必答问题 | 验收证据 |
| :--- | :--- | :--- |
| 边界 | 是否明确属于 `business/*`，并说明不负责哪些 system 能力 | 业务设计文档 |
| 数据 | DDL、索引、唯一键、审计字段、租户就绪判断是否完整 | DDL / migration / 设计文档 |
| 接口 | API 前缀、请求、响应、错误 key、权限点是否完整 | 后端测试 / API 清单 |
| 页面 | loading / empty / error / forbidden / submitting 是否覆盖 | 页面实现 / smoke 记录 |
| 菜单 | 菜单、路由、组件键、titleKey 是否一致 | `check:menu-contract` |
| 权限 | 页面权限、按钮权限、接口权限是否分层 | 权限 seed / Casbin / smoke |
| i18n | locale key 是否完整且无硬编码 | `check:i18n-hardcode` / locale audit |
| 审计 | 新增、编辑、删除、导入、导出等关键动作是否审计 | 操作日志记录 |
| 回归 | 是否有固定自动化或手工验收记录 | smoke / 测试报告 |

## 2. 业务模块准入

新业务模块进入实现前必须具备：

- 业务模块设计文档。
- 数据模型与租户就绪判断。
- API 与权限清单。
- 菜单与组件键清单。
- i18n namespace 与关键文案清单。
- 字典/配置依赖清单。
- 审计点清单。

## 3. 业务模块上线

业务模块进入“当前已完成”前必须通过：

- 后端模块测试。
- 前端构建。
- 菜单契约检查。
- i18n 硬编码检查。
- 至少一条主链路 smoke。
- 权限账号验证，覆盖有权限和无权限两类场景。

## 4. CMDB 当前验收重点

### 4.1 Host

- 确认 `business/cmdb/host` 的菜单挂接在业务域入口下。
- 确认列表接口接入 `DataScopeReq + WithDataScope`。
- 确认业务路由接入 `DataScopeMiddleware`，角色数据范围策略由 `/system/permission` 的“数据权限”页统一配置。
- 确认创建、编辑、删除有审计 action。
- 确认按钮权限不复用列表权限。
- 确认错误 key 使用 `cmdbhost.*`。

### 4.2 Vendor

Vendor 当前基础模块已实现，仍处于“导入导出与字典联动待补”状态。

已完成：

- `biz_cmdb_vendor` DDL / AutoMigrate。
- `business:cmdb:vendor:*` 权限点 seed。
- `business.cmdb.vendor.*` i18n key。
- 菜单 seed 和组件键 `business/cmdb/vendor/CmdbVendorList` 注册。
- 后端 `go test ./backend/modules/business/cmdb/vendor`。
- 列表接入数据权限扩展位。
- 新增、编辑、删除审计 metadata。

仍待补：

- 导入导出与审计点。
- 真实字典项联动。
- 有权限/无权限的浏览器 smoke 证据。

## 5. 固定命令

推荐固定执行：

- `go test ./backend/modules/business/cmdb/...`
- `go test ./backend/modules/system/iam/permission`
- `cd frontend && npm run check:menu-contract`
- `cd frontend && npm run check:i18n-hardcode`
- `cd frontend && npm run build`

如果业务模块提供真实浏览器 smoke，必须在本矩阵或对应业务设计文档中记录命令与证据路径。
