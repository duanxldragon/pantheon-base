---
title: Pantheon Base UI 改进路线图
doc_type: Roadmap
layer: platform
status: Active
updated_at: 2026-07-09
reviewer: Claude Code (Opus 4.8)
---

# Pantheon Base UI 改进路线图

> 配套：`UI_REVIEW_REPORT.md`（审查+评分）、`DESIGN_SYSTEM_REPORT.md`（token+对标）。
> 原则：**基于当前设计语言，不做“为了美观而重构”**。每项标注 原因 / 影响范围 / 成本。已达企业级的部分不列入（见 UI_REVIEW §2）。
> 分级：P0=契约级/误导性最强 · P1=一致性关键 · P2=打磨 · P3=能力增强。

---

## P0 —— 真相源与承诺闭合（先做，成本低、误导性最高）

### P0-1　统一设计 Token 真相源

- **问题**：`THEME_TOKENS_REFERENCE.md`(Active) 定义 `--pantheon-*` 全套（含暗色、间距/字号/动效/z-index），实现是 `--brand-*/--panel-*/--shell-*` 另一套；命名、数值、覆盖范围三重不一致。
- **原因**：违反 DESIGN.md 开篇“真相源单一”；后续 AI/人按文档生成会引用不存在的变量。
- **动作**（二选一，推荐 A）：
  - **A（推荐，低成本）**：把 `THEME_TOKENS_REFERENCE.md` 重写为**实现真相**——记录实际的 `--brand-*/--panel-*/--radius-*`，删除或标注“未实现”的 `--pantheon-*`、暗色、scale 承诺。文档一次性对齐代码。
  - **B（高成本）**：按文档补齐 `--pantheon-*` 实现层。仅当产品确实要暗色/全 scale 时选。
- **影响范围**：纯文档（A）或全 CSS（B）。
- **验收**：不存在“Active 文档描述一套代码里没有的 token 体系”。

### P0-2　`DARK_MODE_DESIGN.md` 状态归位 ✅（已闭合，走“做”路径）

- **问题**：status 与实现不一致。
- **结果**：暗色模式已落地（见 P3-1），`DARK_MODE_DESIGN.md` 回到 `status: Active` 并在开篇记录真实实现入口。文档状态与实现一致。

---

## P1 —— 一致性关键（中等成本、体感明显）

### P1-1　收口 dashboard.css 视觉越界 + 补 checker 覆盖

- **问题**：`dashboard.css` 是唯一含 `linear-gradient`(:14)、裸 Arco token（`--color-text-1/-3`、`--color-fill-bg-*`、`--arcoblue-6`）、Ant 状态色（`#faad14/#f04b45/#16b755`）、Ant 琥珀阴影的文件；且 `check-shell-visual-contract.mjs` **只读 layout/index/list-page/Login 四文件，未覆盖 dashboard.css** → 反模式从校验网漏出。
- **原因**：DESIGN.md §7.7/§7.9 明令禁止；且“有 checker 却不覆盖”给人虚假安全感。
- **动作**：① dashboard 改用 Pantheon token（配合 P1-2 的语义色）；② 移除 `linear-gradient`，用纯 surface + 边框建立层次；③ 把 `dashboard.css` 加入 `check-shell-visual-contract.mjs` 扫描列表。
- **影响范围**：`modules/platform/dashboard.css`、`frontend/scripts/check-shell-visual-contract.mjs`。
- **成本**：中。

### P1-2　补齐语义状态色 Token（success/warning/error/info）

- **问题**：只有 `*-soft` 软背景，无实心语义色，Info 缺失；三处色值分叉。
- **动作**：在 `:root` 补 `--color-success/-warning/-error/-info` + `-bg`，全部对齐 Arco 系；旧 `--status-*-soft/--danger-soft` alias 到新 token；全站状态色引用改 token。
- **影响范围**：`index.css`、`dashboard.css`、`list-page.css:44,49`、`index.css:2237` + 新页面。
- **成本**：中。

### P1-3　字体契约对齐（Source Sans 3）

- **问题**：DESIGN.md §7.6 要求 Source Sans 3 全局，实现用 system 栈、`index.html` 无字体加载。
- **动作**（二选一）：① 真引入——`index.html` 加 Google Fonts / 自托管 woff2，`index.css` font-family 置顶 Source Sans 3；② 契约降级——DESIGN.md §7.6 改为“system-ui 栈为准，Source Sans 3 可选”。
- **影响范围**：`index.html` + `index.css`（方案①）或 `DESIGN.md`（方案②）。
- **成本**：低。

### P1-4　操作列超 3 折叠为“更多”

- **问题**：`UserList.tsx:275` 一行 5 内联操作 + 硬编码 `width:316`，违反 FRONTEND_UI_SPEC §8.2；全站零 Dropdown 行操作。
- **动作**：在 `SystemRowActions` 支持 `maxInline`（默认 3），溢出收进 Arco `Dropdown`；列宽改用 `TABLE_ACTION_COLUMN_WIDTH` 语义。
- **影响范围**：`SystemRowActions.tsx` + 消费页（尤其 user）。
- **成本**：中。

### P1-5　行操作双写法收口

- **问题**：4 页用 `SystemRowActions`，5 页手写 `<Space className="system-list__actions">`。
- **动作**：menu/permission/dict/i18n/audit 迁移到 `SystemRowActions`（树页可加 `variant="nowrap"`）。
- **影响范围**：5 个列表页。
- **成本**：中。

---

## P2 —— 打磨（低成本、纪律性）

### P2-1　圆角越界值吸附

- 越界 `7/9/10/14/16px` 就近归并到 `4/6/8/12`；补 `--radius-xl:12px`。范围：`core/layout/index.css` 为主。视觉近乎无感。

### P2-2　抽通用 Spacing / 字号 / 动效 / z-index 阶梯

- 补 `--space-2xs..3xl`、`--font-size-*`、`--motion-duration-fast/base/slow`+easing、`--z-*` 六档；业务页与浮层优先消费。壳层专用变量保留。渐进、低风险。

### P2-3　排序能力补齐

- permission/dict/audit 列表补 `sorter`（与 user/role/dept 对齐）。范围：3 个列表页。

### P2-4　死代码 / 遗留清理

- 删除未消费 token：`--login-glow`、`--login-metric-secondary/-tertiary`、`--app-grid-line`。
- 处理 `PageHeader`（0 引用）：删除或改为 `GovernanceSummaryBar` 的正式别名。
- `SideRailNote` 等旧右栏（§6.6.7 遗留）纳入整改清单，停止新增。

### P2-5　降 `!important` 与深选择器

- 147 处 `!important`（layout 23 / index 74 / login 18 / list-page 14 / user 13…）逐步用 Arco CSS 变量定制入口替换；优先高频覆盖点。**非一次性重构**，随手改。

---

## P3 —— 能力增强（按产品需要，独立排期）

### P3-1　暗色模式落地 ✅（2026-07-10 已落地）

- 已实现 `data-color-mode="light|dark"` 二级属性 + `body[arco-theme]` 联动；暗色 token 块见 `index.css` `:root[data-color-mode='dark']`（中性 surface + 各主题品牌提亮）。切换入口在壳层“外观模式”偏好区（5 语言 i18n）；首绘前内联脚本防闪烁，读取顺序为本地偏好 → 系统 `prefers-color-scheme`。对比度由 `scripts/check-contrast.mjs` 校验（正文/链接双模式 AA 通过）。实现文件：`core/theme/colorMode.ts`。

### P3-2　系统化无障碍（WCAG AA）✅（部分落地）

- ✅ 对比度自检脚本 `scripts/check-contrast.mjs`（`npm run check:contrast`，验证 §12 承诺，双模式 AA）；表格操作按钮已带 `aria-label`/`title`（见 `SystemRowActions`），导航 toggle 已加 `aria-label`。
- 剩余（可继续）：全站 `role=` 语义补齐、键盘 Tab 顺序与屏幕阅读器系统化抽查。

### P3-3　移动端抽屉式侧栏 + 断点 token 化 ✅（2026-07-10 已落地）

- ✅ `≤768px` 下 sider 变为 overlay drawer（header toggle 弹出 + 背景遮罩，点击菜单/遮罩关闭）；14 种发散断点已收敛到 canonical `768/1280` 两档。实现：`core/layout/index.tsx` + `index.css` 移动抽屉块。

### P3-4　可选增强 ✅（原语已落地）

- ✅ 轻量图表原语：`Sparkline`（无依赖 SVG，跟随主题 token）已加入共享层。
- ✅ 页面级 Skeleton：Arco Skeleton 已纳入 `arco/style.ts`，新增 `PageSkeleton` 原语（table/form 变体）。
- 剩余（可继续）：删除操作 Undo（Toast 内“撤销”）、权限继承关系图形化（Casbin policy 树/矩阵视图）。

---

## 执行建议（顺序与依赖）

```
P0-1 ─┐（统一 token 真相源，最高杠杆）
P0-2 ─┘
   │
   ▼
P1-2（语义色）──► P1-1（dashboard 收口，依赖语义色）
P1-3（字体）    P1-4 ─► P1-5（行操作收口）
   │
   ▼
P2-*（打磨，随 P1 顺手做）
   │
   ▼
P3-*（按产品排期，独立）
```

**建议先做 P0-1 + P0-2 + P1-1 + P1-2**：一个 sprint 内即可让“设计系统一致性”从 70 提到 82+，且全部是低/中成本、零重构、零视觉风险的收口动作。**不建议**在 token 真相源统一前动 P3（暗色等），否则会在错误的 token 基线上二次返工。

---

## 明确不需要改的（避免过度工程）

- Border token / focus ring 体系 —— 已达企业级。
- 图标系统 —— 单一库、线性统一，无需动。
- 页面状态族（九件套）—— 完整，勿动。
- 表单一致性（vertical + SubmitBar）—— 达标。
- 应用壳层功能面（页签/命令面板/密度/锁屏）—— 优秀。
- 登录页 —— 干净认证控制台，符合全部反模式约束。
- i18n 工程化 —— 优于对标产品，保持。
