# 错误码与多语言设计

更新时间：2026-04-17

本文定义 Pantheon Base 的错误码与 i18n 责任边界。

目标是把下面这些问题一次讲清：

- 后端返回的是自然语言，还是错误 key？
- 前端 toast 应该直接显示 message，还是先翻译？
- 成功提示和失败提示分别由谁负责？
- fallback 规则是什么？
- 新增模块时，错误文案和 i18n key 由谁补？

如果这份文档不先定清楚，后续最容易变成：

- 后端有时返回中文，有时返回英文，有时返回 key
- 前端有时 `t(message)`，有时直接 `Message.error(message)`
- 成功文案和错误文案分散在几十个页面里
- 新模块只写接口，不补翻译 key
- 不同模块出现同义不同 key 的错误文案

## 1. 设计目标

- **后端只负责稳定的错误语义**
- **前端只负责最终展示语言**
- **错误 key 与 i18n key 统一**
- **成功/失败提示策略一致**
- **支持 fallback，不因缺失翻译直接崩 UI**

## 2. 统一响应原则

当前统一响应结构：

```go
type Response struct {
    Code    int
    Data    interface{}
    Message string
}
```

其中：

- `Code`：业务码
- `Data`：业务数据
- `Message`：**必须优先视为 i18n key**

## 3. 后端返回规则

## 3.1 后端不返回自然语言

后端默认不返回：

- 中文提示
- 英文提示
- 面向终端用户的完整展示文案

后端应该返回：

- 稳定错误 key
- 稳定成功 key（仅在确实需要时）

示例：

```text
param.invalid
permission.denied
user.login.error.not_found
user.role.required
refresh_token.invalid
```

## 3.2 后端错误分三层

| 层级 | 说明 | 示例 |
| :--- | :--- | :--- |
| `platform` | 基础设施错误 | `database.not_initialized` |
| `domain` | 业务规则错误 | `user.role.required` |
| `security` | 认证/授权错误 | `permission.denied` |

## 3.3 后端业务码规则

当前业务码：

| Code | 说明 |
| :--- | :--- |
| `200` | 成功 |
| `400` | 参数错误 |
| `401` | 未认证 / 认证失效 |
| `403` | 无权限 |
| `500` | 通用失败 |

短期允许继续使用这组码。

后续如果引入更细错误码体系，也不能破坏“`Message` 是 key”这一原则。

## 4. 前端展示规则

## 4.1 前端必须翻译 message

前端收到：

```json
{
  "code": 403,
  "message": "permission.denied"
}
```

默认展示应为：

```ts
t('permission.denied')
```

而不是直接显示：

```ts
"permission.denied"
```

## 4.2 当前问题

当前请求层里仍然存在：

- `Message.error(message || 'Request Failed')`
- `Message.error(error.message || 'Network Error')`

这说明当前前端还没有完全遵守“message 是 key”的规则。

## 4.3 正确行为

请求层应遵循：

1. 如果 `message` 是 key，则走 `t(message)`
2. 如果 key 缺失，则走 fallback
3. 如果是网络异常或非标准错误，再走默认前端 key

## 5. 成功提示规则

## 5.1 成功提示优先由前端控制

成功提示不建议由后端自由返回。

原因：

- 前端最知道当前页面上下文
- 成功提示文案经常是页面级表达
- 后端成功提示很容易泛化成一堆重复 message

推荐：

- 新增成功：前端统一使用 `common.createSuccess`
- 更新成功：前端统一使用 `common.updateSuccess`
- 删除成功：前端统一使用 `common.deleteSuccess`

## 5.2 后端成功 message

后端成功返回里的 `message: "success"` 可以保留，但前端通常不直接拿它弹 toast。

## 6. i18n key 命名规则

## 6.1 通用 key

用于全局公共文案：

- `common.*`
- `auth.*`
- `permission.*`

## 6.2 模块级 key

用于模块页面、字段、业务规则：

- `system.user.*`
- `system.role.*`
- `system.menu.*`
- `system.permission.*`
- `auth.session.*`
- `biz.order.*`

## 6.3 错误 key

错误 key 推荐结构：

```text
{module}.{action}.error.{reason}
```

示例：

```text
user.login.error.not_found
user.login.error.disabled
user.login.error.password_wrong
user.update.error.protected
menu.delete.error.has_children
post.dept.required
post.dept.invalid
post.dept.root_forbidden
user.post.dept_required
user.post.dept_mismatch
```

### 6.3.1 通用错误 key

以下作为基础共用：

- `success`
- `param.invalid`
- `permission.denied`
- `permission.engine.not_initialized`
- `database.not_initialized`
- `network.error`
- `request.failed`

## 7. fallback 规则

## 7.1 前端翻译 fallback

优先级：

1. 远端语言包
2. 本地 fallbackResources
3. 通用兜底 key
4. 最后才显示原始 key

## 7.2 网络错误 fallback

网络错误、超时、浏览器异常，不走后端 key。

统一前端 key：

- `network.error`
- `network.timeout`
- `request.failed`

## 7.3 未知错误 fallback

当后端返回未知 key：

- 先尝试 `t(message)`
- 如果翻译结果仍等于原 key，则显示：
  - 开发环境：原 key + 兜底文案
  - 生产环境：通用错误文案

## 8. 前后端责任边界

## 8.1 后端负责

- 定义业务码
- 定义错误 key
- 保证 key 稳定
- 不返回面向用户的自然语言

## 8.2 前端负责

- 翻译 key
- 选择展示方式（toast / inline / form error / empty state）
- 提供 fallback
- 补本地最小语言包

## 8.3 模块负责

新增模块时，模块 owner 必须同步补：

- 错误 key 清单
- 菜单和页面文案 key
- 表单字段 key
- 按钮文案 key

## 9. 错误展示方式规范

不是所有错误都应该用 toast。

## 9.1 toast

适合：

- 删除失败
- 保存失败
- 网络异常
- 权限不足提示

## 9.2 表单项错误

适合：

- 字段必填
- 邮箱格式错误
- 密码不合法

## 9.3 页面级错误

适合：

- 403
- 404
- 500
- 首屏加载失败

## 9.4 空态提示

适合：

- 搜索无结果
- 无数据
- 未配置

## 10. 请求层规范

请求层统一负责：

- 401 refresh 尝试
- 标准响应拆包
- 错误 key 翻译
- 默认错误提示

请求层不应负责：

- 业务成功 toast
- 表单字段级错误提示
- 页面专属提示逻辑

## 11. 登录与认证错误规范

以下错误属于认证域：

- `user.login.error.not_found`
- `user.login.error.disabled`
- `user.login.error.password_wrong`
- `refresh_token.invalid`
- `refresh_token.expired`
- `refresh_token.rotated`

后续 `auth` 模块独立后，建议逐步统一为：

- `auth.login.error.*`
- `auth.refresh.error.*`
- `auth.session.error.*`

当前阶段允许保留旧 key，但文档和新代码要向新命名靠拢。

## 12. 权限错误规范

统一使用：

- `permission.denied`
- `permission.role.invalid`
- `permission.policy.exists`

页面级无权限与接口级无权限都可以使用同一个 key，但前端展示方式不同。

## 13. 模块新增时必须补的内容

新增模块时，必须同步补：

- 后端错误 key
- 前端页面文案 key
- 本地 fallback 资源
- 数据库 i18n seed（如使用）
- 文档说明

## 14. 当前落地差距

当前已经做到：

- 后端大部分错误返回 key
- 前端有 fallbackResources
- 前端启动会拉远端语言包

当前仍缺：

- 请求层统一 `t(message)` 翻译
- 网络错误 key 化
- 缺失 key 检测机制
- 成功/失败提示方式统一规范落地
- `auth` 拆分后的错误 key 收口

补充约束：

- 审计日志中的 `error_msg` 如果保存的是错误 key，前端详情页也应优先按 i18n key 翻译展示，而不是直接裸显 key。
- 对于“接口返回 200 但业务结果中 `applied=false` / 存在校验错误”的批量导入场景，允许通过审计元数据单独把操作日志标记为失败，以保证审计语义真实。

## 15. 验收清单

当以下问题都能明确回答时，说明本设计完整：

- 后端是否只返回 key？
- 前端是否统一翻译 message？
- 网络错误是否有独立 key？
- 模块新增时是否知道要补哪些 i18n key？
- 成功提示是否由前端主导？
- 未知 key 是否有 fallback？

## 16. 下一份建议补的文档

如果继续推进文档设计，下一批建议是：

- `docs/ACCEPTANCE_CHECKLIST.md`
- `docs/FRONTEND_COMPONENT_PLAN.md`

因为错误与 i18n 边界定完后，下一步应该解决：

- 前端组件层如何承接这些文案与状态规范；
- 阶段性交付如何统一验收。
