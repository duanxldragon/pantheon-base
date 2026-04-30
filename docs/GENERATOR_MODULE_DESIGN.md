# 模块生成器设计

更新时间：2026-04-29

本文定义 `system/config -> generator` 的正式边界。

它重点回答：

- 生成器属于哪个系统子域
- 它与 `dynamicmodule` 的关系是什么
- 页面访问权限和真实生成动作权限为什么必须拆开
- 当前实现如何平滑从兼容权限过渡到高敏权限模型

---

## 1. 模块定位

模块生成器归属：

- `system/config -> generator`

它不是：

- `platform` 聚合页
- `system/iam` 权限治理页
- `system/auth` 安全能力
- `business/*` 业务模块本身

它的职责是：

- 采集模块 schema
- 生成受 Pantheon 模块契约约束的代码骨架
- 为后续模块接入准备菜单、权限、i18n、审计与导出物

一句话：

> `generator` 负责产出候选模块骨架，`dynamicmodule` 负责治理模块接入状态。

---

## 2. 目标边界

### 2.1 generator 负责

- `business/*` 模块骨架生成
- 模块 schema 校验与标准化
- 默认菜单、权限、i18n key 模板生成
- 本地导出 ZIP
- 在受控条件下触发“一键生成并注册”

### 2.2 generator 不负责

- 替代模块设计文档评审
- 绕过 `dynamicmodule` 直接宣告模块已生效
- 在 `system/*` 子域内随意生成未定义边界的系统模块
- 替代人工判断模块归属、权限模型和数据模型

### 2.3 当前约束

当前一键生成并注册仍只支持：

- `business/*`

`system/*` 子域仍必须先完成子域设计，再由研发按边界手工接入。

---

## 3. 与 dynamicmodule 的关系

推荐链路：

1. 在 `/system/generator` 定义模块 schema
2. 生成模块文件与默认契约
3. 调用 `/system/dynamic-modules/generate`
4. 进入 `dynamicmodule` 的待激活治理链路
5. 重启后端、重建前端
6. 在 `/system/modules` 验证状态是否变为已接入

约束：

- `generator` 不能跳过 `dynamicmodule` 直接宣称模块可用
- `dynamicmodule` 不反向承担 schema 设计和字段语义决策

---

## 4. 风险分级

| 动作 | 风险 | 说明 |
| :--- | :--- | :--- |
| 打开生成器页面 | 中 | 仅可查看和填写 schema，但仍属于工程能力页 |
| 本地预览/下载模块骨架 | 中 | 会影响研发产物，但不直接修改系统装配状态 |
| 一键生成并注册 | 高 | 同时影响源码、注册表和模块装配状态 |

当前结论：

- 页面访问权限可以与高敏动作权限分离
- 真正高敏的是“生成并注册”，而不是“看见页面”
- 若检测到同名模块或目标文件已存在，生成器应走受控覆写确认，而不是静默失败或直接无提示覆盖

---

## 5. 权限模型

### 5.1 页面权限

当前兼容权限：

- `system:generator:use`

它当前用于：

- `/system/generator` 路由访问
- 生成器菜单显示

问题：

- `use` 语义过宽，不适合作为长期高敏治理模型

### 5.2 动作权限

正式高敏动作权限：

- `system:module:generate`

它只用于：

- 触发“一键生成并注册”
- 调用 `POST /api/v1/system/dynamic-modules/generate`

### 5.3 关系约束

必须满足：

- 能进入页面，不等于能执行生成
- 没有 `system:module:generate` 时，页面仍可查看、预览、下载
- 真实写操作仍需后端 Casbin、环境守卫与二次验证共同保护

---

## 6. 当前实现迁移策略

### 6.1 Phase 1：兼容拆权

当前建议立即落地：

- 保留页面权限：`system:generator:use`
- 新增动作权限：`system:module:generate`
- 生成按钮只由 `system:module:generate` 控制

这是为了：

- 不破坏现有菜单、路由与角色授权
- 先把高敏动作从宽泛页面权限中拆出来

### 6.2 Phase 2：页面权限语义收敛

后续可演进为：

- 页面权限：`system:generator:view`
- 动作权限：`system:module:generate`

届时：

- `system:generator:use` 退役
- 角色授权页与文档统一改为 `view / generate` 双键模型

---

## 7. 页面行为要求

生成器页至少应区分以下能力：

- 查看 schema 向导
- 预览默认权限与菜单
- 导出 ZIP
- 一键生成并注册

权限要求：

- 无页面权限：直接 403
- 无 `system:module:generate`：隐藏或禁用一键生成并注册
- 无环境能力：返回动态模块禁用提示

页面状态仍必须完整覆盖：

- loading
- empty
- error
- forbidden
- submitting

---

## 8. 审计与安全要求

`system/config -> generator` 的高敏动作必须同时满足：

- JWT 身份校验
- Casbin 接口权限
- 环境守卫
- 二次验证
- 统一审计

至少记录：

- 操作人
- 模块名
- 模块 scope
- 生成目标
- 生成结果
- 注册结果
- 失败原因

---

## 9. 验收要求

### 9.1 页面基线

- `/system/generator` 可正常访问
- 可预览 schema、菜单与权限模板
- 可导出 ZIP，不要求一定具备高敏动作权限

### 9.2 权限基线

- `system:generator:use` 仅负责页面访问
- `system:module:generate` 仅负责一键生成并注册
- 角色授权页中两者可独立勾选

### 9.3 高敏动作基线

- 无 `system:module:generate` 时，前端不能直接触发提交
- 后端写接口仍需 Casbin + 二次验证 + 环境守卫
- 失败原因可解释

### 9.4 文档基线

- `generator` 与 `dynamicmodule` 的职责已拆清
- `system:generator:use` 被明确标注为短期兼容权限
- `system:module:generate` 被明确标注为正式高敏动作权限

---

## 10. 当前结论

`generator` 必须继续留在 `system/config`，但它不能再被理解成“普通代码辅助页”。

它的正确认知应该是：

- `system/config` 下的工程化生成能力
- 页面访问和高敏动作必须拆权
- 生成结果必须通过 `dynamicmodule` 进入受控接入链路

如果这一步不写清楚，后面最容易再次退回：

- 谁能进页面谁就能直接生成
- `generator` 和 `dynamicmodule` 职责混写
- 文档、权限和实现三套边界重新漂移
