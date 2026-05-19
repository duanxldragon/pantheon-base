---
title: 主题 Token 参考表 (Theme Tokens Reference)
doc_type: Design
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-11
---

# 主题 Token 参考表 (Theme Tokens Reference)

English version: [THEME_TOKENS_REFERENCE.en.md](./THEME_TOKENS_REFERENCE.en.md)

本文是 Pantheon Base 4 个内置主题（`indigo / emerald / violet / slate`）的**具体 token 值参考表**，配合 `FRONTEND_UI_SPEC.md` §3 (Design Token) 使用。

UI Spec §3 定义了 token 命名结构和语义；本文给出每个 token 在每个主题下的**具体值**，作为前端实现和 AI 代码生成的事实表。

优先级约束：

- 涉及 **颜色 / 圆角 / 间距 / 字号 / 阴影 / 动效 / z-index** 的最终数值时，**一律以本文为准**
- `FRONTEND_UI_SPEC.md`、`FRONTEND.md`、`DESIGN.md` 只负责说明语义、原则和交互目标，不再作为数值真相源
- 若其他文档中仍出现旧数值，应视为历史描述，后续实现不得按旧值落地

---

## 1. Token 命名约定

```
--pantheon-<category>-<role>[-<state>][-<scale>]

category  : color | space | radius | shadow | type | motion | z
role      : bg | fg | border | accent | success | warning | error | info | ...
state     : default | hover | active | disabled | focus
scale     : xs | sm | md | lg | xl | 数字
```

示例：`--pantheon-color-bg-default`、`--pantheon-color-bg-elevated`、`--pantheon-space-md`。

**禁止**：在业务代码里出现裸 Arco token、裸 hex 色值、裸 px 值（除 0 和 1px 边）。

---

## 2. 中性色 Token（所有主题共享）

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--pantheon-color-bg-app` | `#F7F8FA` | `#0F1115` | 页面整体背景 |
| `--pantheon-color-bg-default` | `#FFFFFF` | `#16181D` | 卡片/Surface 默认背景 |
| `--pantheon-color-bg-elevated` | `#FFFFFF` | `#1C1F26` | 浮层、Modal 背景 |
| `--pantheon-color-bg-muted` | `#F0F2F5` | `#1A1D23` | 弱化区域（折叠面板、placeholder 区） |
| `--pantheon-color-bg-hover` | `#F3F4F7` | `#1F222A` | Hover 态背景 |
| `--pantheon-color-fg-default` | `#1D2129` | `#E4E7EC` | 主文本 |
| `--pantheon-color-fg-secondary` | `#4E5969` | `#A0A6B0` | 次文本 |
| `--pantheon-color-fg-tertiary` | `#86909C` | `#6B7280` | 占位、辅助文本 |
| `--pantheon-color-fg-disabled` | `#C9CDD4` | `#3F4452` | 禁用文本 |
| `--pantheon-color-fg-inverse` | `#FFFFFF` | `#0F1115` | 反色文本（深色背景上的白字） |
| `--pantheon-color-border-default` | `#E5E6EB` | `#2A2E37` | 默认边框 |
| `--pantheon-color-border-strong` | `#C9CDD4` | `#3F4452` | 强调边框 |
| `--pantheon-color-border-focus` | per-theme accent | per-theme accent | 焦点环 |
| `--pantheon-color-divider` | `#EAECEF` | `#262A33` | 分隔线 |

对比度自检：所有 `fg-default / bg-default` 对都 ≥ 4.5:1。

---

## 3. 品牌主题色

每个主题只改变 **accent (品牌色)** 与少量氛围背景。中性色完全共享。

### 3.1 indigo（默认企业后台）

| Token | Light | Dark |
|---|---|---|
| `--pantheon-color-accent` | `#4F46E5` | `#818CF8` |
| `--pantheon-color-accent-hover` | `#4338CA` | `#A5B4FC` |
| `--pantheon-color-accent-active` | `#3730A3` | `#C7D2FE` |
| `--pantheon-color-accent-bg-subtle` | `#EEF2FF` | `#1E1B4B` |
| `--pantheon-color-accent-fg-on` | `#FFFFFF` | `#0F1115` |
| `--pantheon-color-border-focus` | `#4F46E5` | `#818CF8` |

### 3.2 emerald（协作/运营氛围）

| Token | Light | Dark |
|---|---|---|
| `--pantheon-color-accent` | `#059669` | `#34D399` |
| `--pantheon-color-accent-hover` | `#047857` | `#6EE7B7` |
| `--pantheon-color-accent-active` | `#065F46` | `#A7F3D0` |
| `--pantheon-color-accent-bg-subtle` | `#ECFDF5` | `#022C22` |
| `--pantheon-color-accent-fg-on` | `#FFFFFF` | `#0F1115` |
| `--pantheon-color-border-focus` | `#059669` | `#34D399` |

### 3.3 violet（平台化/智能氛围）

| Token | Light | Dark |
|---|---|---|
| `--pantheon-color-accent` | `#7C3AED` | `#A78BFA` |
| `--pantheon-color-accent-hover` | `#6D28D9` | `#C4B5FD` |
| `--pantheon-color-accent-active` | `#5B21B6` | `#DDD6FE` |
| `--pantheon-color-accent-bg-subtle` | `#F5F3FF` | `#2E1065` |
| `--pantheon-color-accent-fg-on` | `#FFFFFF` | `#0F1115` |
| `--pantheon-color-border-focus` | `#7C3AED` | `#A78BFA` |

### 3.4 slate（低饱和稳态办公）

| Token | Light | Dark |
|---|---|---|
| `--pantheon-color-accent` | `#475569` | `#94A3B8` |
| `--pantheon-color-accent-hover` | `#334155` | `#CBD5E1` |
| `--pantheon-color-accent-active` | `#1E293B` | `#E2E8F0` |
| `--pantheon-color-accent-bg-subtle` | `#F1F5F9` | `#0F172A` |
| `--pantheon-color-accent-fg-on` | `#FFFFFF` | `#0F1115` |
| `--pantheon-color-border-focus` | `#475569` | `#94A3B8` |

---

## 4. 状态色 Token（所有主题共享）

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--pantheon-color-success` | `#00B42A` | `#23C343` | 成功 |
| `--pantheon-color-success-bg` | `#E8FFEA` | `#0A3D1E` | 成功背景 |
| `--pantheon-color-warning` | `#FF7D00` | `#FF9A2E` | 警告 |
| `--pantheon-color-warning-bg` | `#FFF7E8` | `#3D2A0A` | 警告背景 |
| `--pantheon-color-error` | `#F53F3F` | `#F76965` | 错误 |
| `--pantheon-color-error-bg` | `#FFECE8` | `#3D1212` | 错误背景 |
| `--pantheon-color-info` | `#3491FA` | `#5AA9FF` | 信息 |
| `--pantheon-color-info-bg` | `#E8F4FF` | `#0A2540` | 信息背景 |

---

## 5. 间距 Scale

| Token | 值 | 用途 |
|---|---|---|
| `--pantheon-space-2xs` | `2px` | icon 与文字微间隙 |
| `--pantheon-space-xs` | `4px` | 标签与值之间 |
| `--pantheon-space-sm` | `8px` | 按钮内边距、表单 cell |
| `--pantheon-space-md` | `12px` | 卡片内距、表单组间 |
| `--pantheon-space-lg` | `16px` | 卡片边距、对话框内距 |
| `--pantheon-space-xl` | `24px` | 区块间距、页面 padding |
| `--pantheon-space-2xl` | `32px` | 大区块间距 |
| `--pantheon-space-3xl` | `48px` | 页面 hero 区段间距 |

约定：禁止出现非 token 的 px 值；唯一例外是 `1px` 边框和 `0`。

---

## 6. 字号 Scale

| Token | 字号 / 行高 | 用途 |
|---|---|---|
| `--pantheon-type-caption` | `12px / 18px` | 辅助说明、表格细字 |
| `--pantheon-type-body-sm` | `13px / 20px` | 紧凑表格、密度 compact |
| `--pantheon-type-body` | `14px / 22px` | 默认正文 |
| `--pantheon-type-body-lg` | `16px / 24px` | 强调段落 |
| `--pantheon-type-heading-sm` | `16px / 24px` | 卡片标题 |
| `--pantheon-type-heading` | `18px / 26px` | 区块标题 |
| `--pantheon-type-heading-lg` | `20px / 28px` | 页面 H2 |
| `--pantheon-type-display` | `24px / 32px` | 页面 hero / 仪表盘大数字 |

字重：常规 `400`、强调 `500`、标题 `600`。**不允许** `700` 及以上。

---

## 7. 圆角

| Token | 值 | 用途 |
|---|---|---|
| `--pantheon-radius-sm` | `4px` | 输入框、tag、徽标 |
| `--pantheon-radius-md` | `6px` | 按钮、checkbox、单选 |
| `--pantheon-radius-lg` | `8px` | 卡片、Modal、Drawer |
| `--pantheon-radius-xl` | `12px` | hero 容器、提示框 |
| `--pantheon-radius-pill` | `9999px` | 圆形头像、状态点 |

**禁止**：胶囊形卡片、超过 `12px` 的非 pill 圆角。

---

## 8. 阴影

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--pantheon-shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | `0 1px 2px rgba(0,0,0,0.4)` | 微提升（按钮 active） |
| `--pantheon-shadow-sm` | `0 2px 6px rgba(0,0,0,0.06)` | `0 2px 6px rgba(0,0,0,0.5)` | 卡片 hover |
| `--pantheon-shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | `0 4px 12px rgba(0,0,0,0.6)` | Dropdown、Tooltip |
| `--pantheon-shadow-lg` | `0 8px 24px rgba(0,0,0,0.10)` | `0 8px 24px rgba(0,0,0,0.7)` | Modal、Drawer |

**禁止**：大面积渐变阴影、超过 `24px` 模糊半径、彩色阴影。

---

## 9. 动效时长与缓动

| Token | 值 | 用途 |
|---|---|---|
| `--pantheon-motion-duration-fast` | `120ms` | hover/focus 反馈 |
| `--pantheon-motion-duration-base` | `200ms` | 默认过渡 |
| `--pantheon-motion-duration-slow` | `320ms` | Modal/Drawer 进出 |
| `--pantheon-motion-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | 默认 |
| `--pantheon-motion-easing-emphasized` | `cubic-bezier(0.4, 0, 0.6, 1)` | 强调动效 |

`prefers-reduced-motion: reduce` 时所有动效降到 ≤ 80ms 或直接禁用。

---

## 10. Z-index 层级

| Token | 值 | 用途 |
|---|---|---|
| `--pantheon-z-base` | `0` | 默认 |
| `--pantheon-z-sticky` | `100` | 表格头吸顶、PageHeader 吸顶 |
| `--pantheon-z-dropdown` | `1000` | 下拉、Tooltip |
| `--pantheon-z-overlay` | `2000` | Drawer 遮罩 |
| `--pantheon-z-modal` | `2100` | Modal |
| `--pantheon-z-notification` | `2200` | Toast、全局通知 |

---

## 11. 主题切换实现约定

- 主题 token 通过 `:root[data-theme="indigo"]` 等属性选择器挂载
- 切换主题只改 CSS 变量值，**不重建** DOM
- 同时支持 `data-color-mode="light|dark"` 二级属性
- 用户偏好持久化见 `FRONTEND.md` §平台壳层偏好持久化

---

## 12. 验收

- 4 个主题 × 2 个模式 = 8 个组合下，所有页面对比度满足 AA
- 所有业务代码 grep 不出裸 hex / px (除 `1px`)
- 切换主题不重新加载页面
- `prefers-reduced-motion` 生效
