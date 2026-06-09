# Visual Quality Protocol

English version: [VISUAL_QUALITY_PROTOCOL.en.md](./VISUAL_QUALITY_PROTOCOL.en.md)

类型：Contract
归属层：method
状态：Active

本文定义 UI 任务的视觉质量门。它是工具无关 Harness 协议的一部分，不绑定任何具体产品、组件库或后台风格。

## 1. 适用范围

任何任务只要影响以下内容，就必须执行视觉质量门：

- 页面布局
- 前端组件
- dashboard / admin / workbench / mobile / embedded UI
- 表格、表单、图表
- 导航、弹窗、抽屉、工具栏
- 交互状态：loading、empty、error、permission denied、disabled、success
- responsive/mobile viewport
- 视觉设计系统、颜色、字体、间距、图标、动效

## 2. 默认质量门

首选视觉质量 skill：

```text
impeccable
```

如果当前工具没有 Codex skill 能力，也必须按同一协议执行：

1. 先读取本文和当前仓库的设计系统文档。
2. 使用 `.agents/prompts/implementation.md`、`.agents/prompts/review.md`、`.agents/prompts/qa.md` 或等价提示。
3. 将视觉证据写入 `.harness/evidence/<task-id>/`，或在 PR / CI artifact 中使用同样结构。

## 3. 与其他设计工具关系

- `impeccable` 或等价流程是视觉质量门。
- 设计系统、Figma、storybook、screenshot diff、Playwright、浏览器手测和人工截图都可以作为输入或证据。
- 任何具体品牌风格、组件名单、token 名称和禁用样式都应由下游仓库的设计系统或 overlay 定义。
- 方法核心不沉淀产品专属视觉规则。

## 4. UI Task Packet 要求

UI 任务必须在 task packet 中补充：

- UI surface 类型。
- 目标视觉感受或设计系统引用。
- desktop / mobile / relevant viewport 验证计划。
- loading / empty / error / permission / disabled 等状态验证计划。
- 截图、浏览器证据或明确 visual gap。

## 5. Review Gate

UI review 必须检查：

- 是否使用视觉质量门，或记录无法运行的原因。
- 是否保留 rendered evidence 或明确 visual gap。
- 是否存在文本溢出、重叠、错位、弱对比、状态缺失。
- 是否符合当前项目定义的 UI 风格：克制、清晰、可扫描，不引入无理由的第二套视觉语言。
- 可交互元素是否有 `:focus-visible` 或等效可见焦点。
- 是否尊重 `prefers-reduced-motion: reduce`。
- hover / loading / focus 是否不会造成布局跳动。
- 是否避免装饰污染：颜色、字体、gradient、阴影、圆角必须收敛到项目的设计 token 或明确视觉系统。
- 是否只存在一种页面模式：同类页面应复用项目标准组件，而不是在同一信息层里混入第二套 hero、overview、metric、toolbar、dialog、table-card 视觉模式。
- 是否保持治理摘要、筛选区、表格区、表单区的结构顺序一致，避免信息定位重复或视觉层级冲突。
- 对话框和抽屉必须走项目标准入口，不能直接混用多套尺寸、footer、padding、关闭行为。

P0/P1 视觉问题不能 approved。

## 5.1 Mechanical Contract

如果项目已经定义了视觉合同脚本，应把它纳入验证计划并在 evidence 中记录结果。

该检查推荐覆盖：

- header / tab / breadcrumb 不裁剪文本。
- 标准筛选区、列表区、批量操作区、表格区的 spacing、radius、控制高度保持一致。
- 不允许视觉 token 泄漏到未批准的原始颜色、阴影、字号或 font-weight。
- 同类系统页不得同时存在多套 hero、overview、table-card 视觉模式。

项目 overlay 可以提供更严格的规则，但不能弱化 rendered evidence、状态覆盖、focus、motion 和布局稳定这些底线。

## 6. Evidence

推荐证据：

```text
.harness/evidence/<task-id>/
  summary.md
  commands.json
  screenshots/
  visual-review.md
```

如果无法截图，必须记录：

- 未截图原因
- 风险
- 后续验证方式

不能用“看起来应该没问题”作为视觉验证结论。

## 6.1 Blocking Rule

If a UI task packet declares UI scope and strict mode is enabled in CI, missing screenshot evidence or missing an explicit visual gap record is a blocking harness failure.
