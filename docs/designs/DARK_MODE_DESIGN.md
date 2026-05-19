---
title: 暗色模式设计 (Dark Mode Design)
doc_type: Design
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-11
---

# 暗色模式设计 (Dark Mode Design)

English version: [DARK_MODE_DESIGN.en.md](./DARK_MODE_DESIGN.en.md)

本文定义 Pantheon Base 的暗色模式（color mode = dark）实现规范、Token 反转策略、组件适配清单和切换行为。

具体 token 数值见 `THEME_TOKENS_REFERENCE.md`，本文聚焦**模式行为**而非数值。

---

## 1. 设计目标

- 不是「把亮色反色」——暗色模式有独立的对比度、阴影、饱和度策略
- 同一品牌主题（indigo / emerald / violet / slate）在 dark 模式下仍可识别
- 中性背景**不**用纯黑（`#000`），用「带蓝色调」的深灰（`#0F1115` 起步）
- 文本**不**用纯白（`#FFF`），用 `#E4E7EC` 减少眩光
- 暗色模式焦点环对比度仍 ≥ 3:1

---

## 2. Token 反转策略

不是逐 token 取反色，而是按**语义角色**重新定义。`THEME_TOKENS_REFERENCE.md` §2、§3 已给出所有 light/dark 对照值。

关键反转原则：

| 语义 | Light 模式 | Dark 模式 |
|---|---|---|
| `bg-app`（页面背景） | 浅灰 `#F7F8FA` | 深灰 `#0F1115`（**不**用纯黑） |
| `bg-default`（卡片背景） | 白 `#FFFFFF` | 比 app 略亮的深灰 `#16181D` |
| `bg-elevated`（浮层背景） | 白 `#FFFFFF` | 再亮一级 `#1C1F26` |
| `fg-default` | 接近黑 `#1D2129` | 接近白但**不**纯白 `#E4E7EC` |
| `accent`（品牌色） | 中度饱和 | **降饱和** + **提亮** |
| `accent-bg-subtle` | 极浅品牌色 | 极深品牌色 |
| `shadow` | 黑色低透明 | 黑色**高透明**（暗背景需要更深阴影才可见） |

---

## 3. 品牌色在 Dark 下的调整规则

亮色模式的品牌色（如 indigo `#4F46E5`）放到深背景上会显得**过暗**且**饱和**——眼睛会刺。

调整原则：

1. **提亮**：HSL 的 L 值提升 20-30%（如 `#4F46E5` → `#818CF8`）
2. **降饱和**：S 值降低 10-15%
3. **保持色相**：H 不变（保持品牌识别）
4. **subtle 背景反向**：浅色背景 (L > 90%) 变成深色背景 (L < 15%)

参考实现见 `THEME_TOKENS_REFERENCE.md` §3.1-3.4。

---

## 4. 不能简单反转的元素

| 元素 | Light 行为 | Dark 行为 |
|---|---|---|
| 业务截图 | 原样展示 | 加 `filter: brightness(0.8)` 包装，或保留原色但加深色 frame |
| 公司 logo | 原色 | 提供 dark 版本 SVG；不允许整 logo 反色 |
| 业务图表（折线、柱） | 高饱和色 | 中度饱和色，保持色相 |
| 代码块 | 浅色 syntax theme | 深色 syntax theme（如 dracula、one-dark） |
| 数据表格 zebra | 行间浅灰 | 行间深灰 + 边框暗化 |
| Toast/Notification 边框 | 状态色 | 状态色但加 30% 不透明叠加 |

---

## 5. 阴影策略

亮模式：阴影是「轻、低透明、模拟纸张抬升」
暗模式：阴影是「**深、高透明**、模拟阴影投射 + 周边光晕」

```
Light:  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
Dark:   box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.04);
```

第二层 `inset` 微白光晕模拟环境光反射，让浮层从背景中浮出。

---

## 6. 焦点环

暗模式下默认焦点环颜色：`accent` 提亮版（同 §3 规则）。

```css
:root[data-color-mode="dark"] {
  --pantheon-color-border-focus: var(--pantheon-color-accent);  /* dark 下已被 §3 提亮 */
}

*:focus-visible {
  outline: 2px solid var(--pantheon-color-border-focus);
  outline-offset: 2px;
}
```

对比度自检：dark 焦点环 vs `bg-default` ≥ 3:1。

---

## 7. 切换行为

### 7.1 用户偏好优先级

```
显式用户选择 (localStorage / DB)
    ↓ 缺失时
平台默认（管理员配置或代码默认 light）
    ↓ 缺失时
系统偏好 (prefers-color-mode)
```

### 7.2 切换不重载

- 切换 color-mode 仅修改 `<html data-color-mode>` 属性
- CSS 变量自动重计算
- **不**重新加载页面
- **不**重建组件树

### 7.3 持久化

- 已登录用户：通过 `PUT /api/v1/auth/me/preferences` 持久化
- 未登录用户：仅 `localStorage`
- 服务端默认值由 `system/config` 公开设置控制；用户显式选择**覆盖**默认

---

## 8. 暗色模式专属注意

| 注意点 | 规则 |
|---|---|
| 图片背景 | 透明 PNG 在 dark 下边缘可能锯齿——确保图片 export 带 dark 背景的 alpha |
| iframe 内嵌 | iframe 内部页面无法继承外部 CSS 变量；明确告知 iframe 提供方支持 dark 或加 dark mode 标识到 iframe URL |
| Print 模式 | print 时强制切回 light（暗色模式打印浪费墨） |
| 截图证据 | QA 截图至少包含 light 一份；dark 模式截图按抽样规则补 |

---

## 9. 实现 checklist

- [ ] `<html data-color-mode="light|dark">` 在初次渲染前已挂载（避免闪烁）
- [ ] 应用启动时 inline `<script>` 读取偏好并设置 `<html>` 属性
- [ ] 所有自定义 CSS 都引用 `--pantheon-*` 变量，没有裸 hex
- [ ] dark 模式下所有页面 4 个主题切换都通过对比度自检
- [ ] 切换 color-mode 不闪烁、不重载
- [ ] Modal、Drawer、Tooltip、Dropdown 在 dark 下浮层层级清晰（阴影 + 微边框区分）
- [ ] 业务图表色板有 dark 版本
- [ ] 代码块 syntax theme 与 color-mode 同步

---

## 10. 验收

- 4 主题 × 2 模式 = 8 个组合下，主要页面（登录、Dashboard、列表、表单、详情）截图归档
- 用户切换 color-mode 后刷新页面，偏好保留
- `prefers-color-mode` 未持久化用户首次访问时生效
- 关闭 JS 后仍能用 CSS 媒体查询 fallback 到正确模式

---

## 11. 关联

- `THEME_TOKENS_REFERENCE.md` §所有 token 在 light/dark 下的值
- `ACCESSIBILITY.md` §对比度要求
- `FRONTEND_UI_SPEC.md` §2.1.1 多主题策略
- `FRONTEND.md` §平台壳层偏好持久化
