# Pantheon 代码评审标准流程

更新时间：2026-05-04

类型：Acceptance
归属层：platform
状态：Active

本文定义 Pantheon Base 的固定代码评审流程。它适用于人工评审、AI 评审和阶段性交付前自检。

目标不是做格式化意见，而是防止设计边界、权限、多语言、审计、动态菜单和生成器契约在迭代中漂移。

## 1. 评审入口

每次评审开始前必须先声明本次改动归属层：

- `platform`
- `system/auth`
- `system/iam`
- `system/org`
- `system/config`
- `business/*`

如果改动跨层，必须同时说明：

- 主责层是谁
- 依赖层是谁
- 哪些改动是逻辑拆分，哪些改动是物理拆分
- 是否存在业务域反向侵入系统域的风险

## 2. 必读上下文

评审前必须至少读取：

1. `DESIGN.md`
2. `AGENTS.md`
3. 与本次归属层匹配的 `docs/contracts/*`
4. 与本次功能匹配的 `docs/designs/*`
5. `docs/acceptances/ACCEPTANCE_CHECKLIST.md`

低代码生成器相关评审必须额外读取：

- `docs/designs/GENERATOR_MODULE_DESIGN.md`
- `docs/designs/LOWCODE_GENERATOR_GUIDE.md`
- `docs/designs/MODULE_CONTRACT.md`
- `docs/designs/ERROR_CODE_AND_I18N.md`

## 3. 固定评审顺序

### 3.1 范围确认

- `git diff --stat`
- `git diff --name-only`
- 检查是否存在生成文件、注册表、schema、i18n 资源同时变更
- 检查是否存在未解释的跨层改动

### 3.2 架构边界

- `business/*` 不得直接 import `modules/system/*` 的 service / repository / handler
- `system/config` 不得吞并 `auth / iam / org` 职责
- `platform` 聚合页不得写入单一系统子域
- 根装配器只能组装模块，不承载模块内部业务逻辑

### 3.3 Schema 与数据库

- 表名必须使用 `system_` 或 `biz_` 前缀
- 新字段必须确认索引、唯一约束、审计字段和枚举来源
- 关系表默认不生成导航，除非设计文档明确说明
- 低代码 schema 必须保留 `displayNameEn`、字段英文文案、业务上下文、表角色、依赖、关系和数据权限模式

### 3.4 权限与菜单

- 菜单只承载导航，权限控制动作
- 页面权限、按钮权限、接口权限必须能独立演进
- 禁止继续用 `list` 权限代表 `create / update / delete`
- 生成器页面权限与高敏生成动作权限必须拆开：`system:generator:use` 与 `system:module:generate`
- 业务子模块必须确认父级菜单、页面菜单、按钮权限、组件 key 一致

### 3.5 多语言

- 前端展示文本必须走 `t()` 或等价能力
- 菜单和模块注册必须使用 `titleKey`
- 后端错误返回应优先是稳定 key，不返回终端自然语言
- 低代码生成结果必须 key-first，并同步前端 fallback 与后端 i18n seed
- 生成链路允许只维护 `zh-CN / en-US` 初始翻译，其他 locale 必须有明确 fallback 策略

### 3.6 前端页面与 UI

- 优先使用 Arco Design 和 Pantheon token
- 检查 `loading / empty / error / forbidden / submitting`
- 检查 Modal / Drawer 是否走统一平台封装
- 检查响应式布局是否覆盖 PC、pad、phone
- 涉及壳层导航时必须执行竖版侧栏与横版顶栏双模式验收

### 3.7 安全与审计

- 高敏动作必须有 JWT、Casbin、二次验证、环境守卫和审计
- 导入、导出、生成、卸载、清理、强制下线等治理动作必须有失败路径
- 审计中若保存错误 key，前端详情页必须翻译展示

### 3.8 测试副作用

低代码生成器和动态模块测试会重写 generated 注册表。评审时必须检查以下文件没有被误清空：

- `backend/modules/business/generated_registry.go`
- `frontend/src/modules/generated/business.ts`
- `frontend/src/core/router/generatedComponentRegistry.ts`
- `schema/generated/**`

如果测试需要改写工作区，必须满足其一：

- 在临时 workspace 中执行
- 或测试后显式验证并恢复真实 generated registry

## 4. 固定验证命令

按改动范围选择执行，不能只跑单一 build。

### 4.1 前端

```bash
cd frontend
npm run check:menu-contract
npm run check:i18n-hardcode
npm run audit:i18n-locales
npm run type-check
npm run build
```

### 4.2 后端

```bash
go test ./backend/internal/scaffold ./backend/modules/system/generator ./backend/modules/system/dynamicmodule ./backend/modules/system/i18n
go test ./backend/modules/business
```

### 4.3 UI 冒烟

涉及后台 UI、导航、对话框、响应式布局时，必须补浏览器证据：

- 默认布局
- 折叠菜单
- 横版顶栏
- 移动端窄屏
- 关键弹窗或抽屉

## 5. 发现项格式

评审输出必须 findings first，按严重程度排序：

```text
[P0|P1|P2] (confidence: N/10) file:line - 问题描述
影响：用户或平台会看到什么错误
修复：已修复 / 建议修复方式
验证：对应命令或证据
```

严重程度定义：

- `P0`：会导致安全问题、数据损坏、构建失败、核心链路不可用
- `P1`：会导致模块不可达、权限/i18n/菜单契约失效、明显行为回归
- `P2`：治理、文档、测试覆盖、可维护性缺口

## 6. 评审完成定义

一次评审只有同时满足以下条件，才能标记为通过：

- 已声明归属层和跨层边界
- 已读对应设计和验收文档
- 已检查 diff 中所有生成物与注册物
- 已修复可自动修复的 P0 / P1
- 已记录剩余 P2 和后续处理建议
- 已运行或明确说明未运行的验证命令
- 若代码影响合同、接口、菜单、权限、i18n、数据库或验收口径，已同步更新文档
