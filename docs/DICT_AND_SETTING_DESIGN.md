# 字典与系统设置设计

更新时间：2026-04-17

本文定义 Pantheon Base 的字典管理和系统设置设计。

这两个能力属于 `system/config` 能力域，是企业后台“通用底座”的关键组成：

- 字典解决“枚举值和下拉选项不要硬编码”
- 系统设置解决“平台参数不要散落在代码和环境变量里”

当前落地状态：

- `system/setting` 已完成基础闭环：模型、迁移、默认配置、公开读取、管理端分组读取与保存、前端设置页、设置缓存刷新；
- `system/dict` 已完成基础闭环：模型、迁移、默认种子、字典类型/字典项 CRUD、公共 options 接口、前端主从维护页、options 缓存刷新；
- 上传配置分组、敏感配置加密存储、配置变更审计详情、设置缓存策略已完成基础实现。

## 1. 设计目标

- 统一管理业务枚举、状态选项、下拉选项
- 统一管理平台配置、安全配置、上传配置、UI 配置
- 支持缓存和刷新
- 支持模块化注册
- 支持后续业务模块复用

## 2. 能力边界

## 2.1 字典管理负责

- 字典类型
- 字典项
- 字典排序
- 字典状态
- 字典缓存刷新
- 前端下拉选项下发

## 2.2 系统设置负责

- 平台基础信息
- 安全策略
- 上传配置
- 登录策略
- 国际化默认设置
- UI 默认偏好

## 2.3 不负责

字典和设置不负责：

- 用户权限判断
- 业务流程状态机
- 大体量业务数据
- 私密凭据明文存储

## 3. 模块归属

建议模块：

```text
backend/modules/system/dict/
backend/modules/system/setting/

frontend/src/modules/system/dict/
frontend/src/modules/system/setting/
```

能力域：

```text
system/config
```

## 4. 字典管理设计

## 4.1 字典模型

建议拆两张表：

- `system_dict_type`
- `system_dict_item`

## 4.2 `system_dict_type`

字段建议：

| 字段 | 说明 |
| :--- | :--- |
| `id` | 主键 |
| `dict_code` | 字典编码，唯一 |
| `dict_name` | 字典名称 |
| `module` | 模块归属 |
| `status` | 状态 |
| `remark` | 备注 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |
| `deleted_at` | 软删除 |

示例：

```text
system_user_status
system_yes_no
biz_order_status
```

## 4.3 `system_dict_item`

字段建议：

| 字段 | 说明 |
| :--- | :--- |
| `id` | 主键 |
| `dict_code` | 字典编码 |
| `item_label_key` | 展示文案 i18n key |
| `item_value` | 实际值 |
| `item_color` | 标签颜色 |
| `sort` | 排序 |
| `status` | 状态 |
| `remark` | 备注 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |
| `deleted_at` | 软删除 |

## 4.4 字典 i18n 规则

字典展示文案不直接存自然语言，优先存：

```text
item_label_key
```

例如：

```text
dict.system_user_status.enabled
dict.system_user_status.disabled
```

## 4.5 字典使用规则

前端使用字典时：

- 通过 `dict_code` 获取字典项
- 使用 `item_label_key` 翻译展示
- 使用 `item_value` 提交后端
- 使用 `item_color` 显示状态标签

后端使用字典时：

- 校验值是否合法
- 不依赖自然语言文案

## 5. 系统设置设计

## 5.1 设置模型

建议表：

- `system_setting`

字段建议：

| 字段 | 说明 |
| :--- | :--- |
| `id` | 主键 |
| `setting_key` | 配置 key |
| `setting_value` | 配置值 |
| `value_type` | 值类型 |
| `group_key` | 配置分组 |
| `module` | 模块归属 |
| `is_public` | 是否允许前端公开读取 |
| `is_encrypted` | 是否加密存储 |
| `remark` | 备注 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

## 5.2 value_type

建议支持：

- `string`
- `number`
- `boolean`
- `json`

## 5.3 group_key

建议分组：

- `basic`
- `security`
- `login`
- `upload`
- `i18n`
- `ui`

## 5.4 setting_key 示例

```text
site.name
site.logo
security.password_min_length
security.password_expire_days
login.max_failed_attempts
login.lock_minutes
upload.max_file_size
i18n.default_language
ui.default_theme
```

其中 `ui.default_theme` 当前建议枚举为：

```text
indigo
emerald
violet
slate
```

## 5.5 公开配置

允许前端公开读取的配置：

- 站点名称
- logo
- 默认语言
- 默认主题

当前默认主题应与平台层主题 token 体系一致，不再使用历史占位值 `light`。

禁止公开读取：

- 密钥
- token secret
- 存储凭据
- 任何敏感安全配置明文

## 6. API 设计

## 6.1 字典接口

管理接口：

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/system/dict/type/list` | 字典类型列表 |
| `POST` | `/api/v1/system/dict/type` | 创建字典类型 |
| `PUT` | `/api/v1/system/dict/type/:id` | 更新字典类型 |
| `DELETE` | `/api/v1/system/dict/type/:id` | 删除字典类型 |
| `GET` | `/api/v1/system/dict/item/list` | 字典项列表 |
| `POST` | `/api/v1/system/dict/item` | 创建字典项 |
| `PUT` | `/api/v1/system/dict/item/:id` | 更新字典项 |
| `DELETE` | `/api/v1/system/dict/item/:id` | 删除字典项 |

公共读取接口：

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/system/dict/options?codes=a,b` | 批量获取字典选项 |

## 6.2 设置接口

管理接口：

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/system/setting/list` | 配置列表 |
| `GET` | `/api/v1/system/setting/group/:groupKey` | 按分组获取配置 |
| `POST` | `/api/v1/system/setting/cache/refresh` | 刷新设置缓存 |
| `PUT` | `/api/v1/system/setting/group/:groupKey` | 批量保存配置 |

公开读取接口：

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/api/v1/system/setting/public` | 获取公开配置 |

## 7. 前端页面设计

## 7.1 字典管理页

页面模板：

- `ListPage`

建议布局：

```text
DictPage
  ├── DictTypeList
  └── DictItemList
```

交互：

- 左侧选择字典类型
- 右侧维护字典项
- 支持启用/停用
- 支持排序
- 当前版本未提供独立“刷新缓存”按钮，后续增强时再补缓存刷新入口

## 7.2 系统设置页

页面模板：

- `ConfigPage`

当前前端基线已补齐：

- 按 `basic / security / login / upload / i18n / ui` 分组维护配置
- 敏感配置不回显明文，提供“留空保持不变”交互
- 页面底部展示当前分组最近配置变更审计
- 审计项展示操作人、操作 IP、变更字段、状态、操作时间
- 敏感字段只显示“已变更”，不展示前后值

## 7.3 字典缓存刷新

当前基线实现：

- `GET /api/v1/system/dict/options` 使用进程内缓存提升公共字典读取效率
- 字典类型 / 字典项发生增删改时，自动失效对应 `dict_code` 缓存
- 管理端提供 `system:dict:refresh` 权限点与手动刷新按钮
- 手动刷新支持按 `codes` 精准刷新，未指定时清空全部缓存

建议分组：

- 基础信息
- 安全策略
- 登录策略
- 上传配置
- 国际化
- UI 偏好

## 8. 权限设计

建议权限点：

```text
system:dict:list
system:dict:create
system:dict:update
system:dict:delete

system:setting:view
system:setting:update
```

其中当前已落地的字典权限点为：

```text
system:dict:list
system:dict:create
system:dict:update
system:dict:delete
```

`system:dict:refresh` 已落地，用于手动刷新字典 options 缓存。

## 9. 菜单设计

建议菜单：

```text
平台配置
  ├── 字典管理
  └── 系统设置
```

如果暂不新增一级“平台配置”，也可以先挂在系统管理下。

## 10. i18n key 规划

建议：

```text
system.menu.config
system.menu.dict
system.menu.setting

system.dict.type
system.dict.item
system.dict.dictCode
system.dict.dictName
system.dict.itemLabelKey
system.dict.itemValue
system.dict.refreshCache

system.setting.basic
system.setting.security
system.setting.login
system.setting.upload
system.setting.i18n
system.setting.ui
```

## 11. 缓存设计

## 11.1 字典缓存

字典适合缓存：

- Redis 可用时写 Redis
- Redis 不可用时走内存或数据库

缓存 key：

```text
dict:{dict_code}:{lang}
```

## 11.2 设置缓存

设置适合缓存：

```text
setting:public
setting:group:{group_key}
setting:list:{group_key}:{module}
```

## 11.3 刷新策略

- 修改字典项后刷新对应字典缓存
- 修改设置后自动失效 setting 相关缓存
- 支持按 `groupKeys` 手动刷新并预热 group 缓存
- 提供管理员手动刷新缓存入口

## 12. 与 i18n 的关系

字典项展示文案使用 i18n。

注意：

- 字典项不是 i18n 表
- i18n 负责翻译文案
- 字典负责枚举值和可选项

## 13. 与业务模块的关系

业务模块可以声明自己的字典：

```text
biz_order_status
biz_ticket_priority
```

但仍由底座字典模块统一管理和下发。

业务模块新增字典时必须同步：

- dict type seed
- dict item seed
- i18n seed
- 文档说明

## 14. 安全规则

系统设置里如果出现敏感配置：

- 不允许明文展示完整值
- 不允许公开接口返回
- 必须标记 `is_encrypted`
- 保存时必须加密或交给专门密钥系统

当前阶段建议：

- 敏感配置主密钥仍使用环境变量管理
- 敏感配置值允许存入系统设置，但必须以加密形式保存，管理端只显示“已配置”状态，不回显明文

## 15. 分阶段实现

## 15.1 Phase 1：字典管理

- DDL
- 后端 CRUD
- 前端字典页
- 字典 options 接口
- options 缓存刷新

## 15.2 Phase 2：系统设置（已完成基础闭环）

- DDL
- 后端分组读取/保存
- 前端 ConfigPage
- public setting 接口
- 敏感配置加密存储
- 配置变更审计详情

## 15.3 Phase 3：模块 seed

- 模块注册 seed

## 16. 当前落地差距

当前剩余增强项：

- 业务模块字典接入样例

## 17. 验收清单

完成时必须满足：

- 可以维护字典类型
- 可以维护字典项
- 前端可以批量获取字典 options
- 字典文案走 i18n
- 可以按分组维护系统设置
- 公开配置和敏感配置有边界
- 修改后缓存刷新
- 权限和审计接入

## 18. 下一份建议补的文档

下一份建议补：

- `docs/BUSINESS_MODULE_TEMPLATE.md`
- `docs/business/ORDER_MODULE_DESIGN.md`

因为配置底座设计完成后，下一步就可以：

- 先定义业务模块接入模板；
- 再写一个真实业务模块样例验证整套底座。
