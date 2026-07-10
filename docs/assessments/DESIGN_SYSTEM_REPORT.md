# Pantheon Base 设计系统规范分析报告

> 配套阅读：`UI_REVIEW_REPORT.md`（评分与页面审查）、`UI_IMPROVEMENT_ROADMAP.md`（分级修复）。
> 本文聚焦 **Token 层**：Color / Typography / Spacing / Shadow / Radius / Border / Component / Layout / Motion / Z-index，并给出行业对标。

---

## 0. 核心判断

Pantheon Base **不是缺设计系统，而是有两套设计系统**：

- **文档系统**：`docs/designs/THEME_TOKENS_REFERENCE.md`（status: Active）——`--pantheon-<category>-<role>` 命名，含 light/dark 双模式、8 档间距、8 档字号、动效/z-index token，数值完整、对比度自检承诺齐全。**这是一份 A 级设计系统文档。**
- **实现系统**：`frontend/src/index.css`——`--brand-* / --panel-* / --shell-* / --text-* / --radius-*` 命名，单一 light 模式，4 品牌主题，**无间距/字号/动效/z-index token**。

两者**命名不同、数值不同、覆盖范围不同**。这是本报告要解决的中心矛盾。设计系统成熟度评分 **70/100** 几乎全部由此拉低——因为单看实现是 82，单看文档是 90，但“文档描述了一套不存在的系统”这一事实本身构成扣分。

---

## 1. Color（颜色）

### 1.1 实现现状

```
--brand-primary        4 主题切换（indigo #165dff / emerald #00a870 / violet #722ed1 / slate #334155）
--brand-primary-soft/-muted   透明度衍生
--text-primary/-secondary/-tertiary   #1f2329 / #4e5969 / #86909c
--panel-bg-solid/-muted/-border/-border-strong
--shell-sider-*        侧栏深色体系（10+ 变量）
--primary-1..10        RGB 分量阶（供 rgba 组合）
--danger-soft/-border  --status-success-soft/--status-warning-soft
```

### 1.2 问题

| 问题                                      | 证据                                                                                                          |    严重度    |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :----------: |
| 无实心语义色 `success/warning/error/info` | 只有 `*-soft` 软背景；Info 完全缺失                                                                           |      高      |
| 状态色三处分叉                            | 系统 `#00b42a/#ff7d00/#f53f3f`；dashboard `#16b755/#faad14/#f04b45`（Ant 系）；文档 `#00B42A/#FF7D00/#F53F3F` |      高      |
| dashboard 用裸 Arco token                 | `--color-text-1/-3`、`--color-fill-bg-1/-3/-4`、`--arcoblue-6`（违反 DESIGN.md §7.7）                         |      中      |
| 死颜色 token                              | `--login-glow`、`--login-metric-secondary/-tertiary`、`--app-grid-line` 定义但 `var()` 消费 0 次              |      低      |
| 主色文档≠实现                             | 文档 indigo `#4F46E5`，实现 `#165dff`                                                                         | 中（真相源） |

### 1.3 建议

```css
/* 补入 :root，全部指向 Arco 系，dashboard 改为消费 */
--color-success: #00b42a;
--color-success-bg: rgba(0, 180, 42, 0.12);
--color-warning: #ff7d00;
--color-warning-bg: rgba(255, 125, 0, 0.12);
--color-error: #f53f3f;
--color-error-bg: rgba(245, 63, 63, 0.12);
--color-info: #3491fa;
--color-info-bg: rgba(52, 145, 250, 0.12);
```

将 `--status-success-soft` 等旧名 alias 到新 token，避免破坏现有引用。**影响范围**：`dashboard.css`、`list-page.css:44,49`、`index.css:2237` + 未来新页面。

---

## 2. Typography（字体）

| 层级        | 文档定义                                                                         | 实现                                                                      |
| :---------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| Font Family | Source Sans 3（Google Fonts, index.html 引入）                                   | ❌ 未加载，用 `system-ui` 栈                                              |
| Scale       | `--pantheon-type-caption/body-sm/body/body-lg/heading-*/display`（8 档，含行高） | ❌ 无 token，裸值 15 种字号                                               |
| 字重        | 400/500/600（禁 700+）                                                           | ✅ 遵守                                                                   |
| 等宽        | JetBrains Mono（数据/代码，tabular-nums）                                        | ⚠️ 仅 `CodePreview.css` 局部；`body` 有 `font-feature-settings:'tnum'` ✅ |

**建议**：建立 `--font-size-* / --line-height-*` 阶梯并对齐文档；决定 Source Sans 3 是“真引入”还是“契约降级”。**影响范围**：全站 font-size 声明（渐进替换，非破坏性）。

---

## 3. Spacing（间距）

- ✅ 实践上符合 4/8pt 节奏，高频 4/8/12/16/24/32；壳层用专用变量（`--shell-page-gap` 等）+ compact 密度覆盖，**这套壳层节奏 token 是亮点**。
- ❌ 无通用 `--space-*` 阶梯（文档定义 2xs..3xl）；业务页仍手写裸 px。
- ⚠️ 非阶梯裸值：18/13/11/9/7/22/26/34px（多为壳层微调）。

**建议**：抽 `--space-2xs..3xl` 通用阶梯，业务页优先消费；壳层专用变量保留（它们是密度系统的基础）。**影响范围**：渐进，低风险。

---

## 4. Radius（圆角）

| Token                 | 值             | 一致性 |
| :-------------------- | :------------- | :----- |
| `--radius-xs/sm`      | 4/4px          | ✅     |
| `--radius-md`         | 6px（control） | ✅     |
| `--radius-lg/overlay` | 8px            | ✅     |
| `--radius-pill`       | 999px          | ✅     |

- ✅ 语义映射正确（action→button, control→input）。
- ❌ **60 处裸 px**，含越界值 `7px`(3)/`9px`(7)/`10px`(11)/`14px`(2)/`16px`(2)——阶梯里没有这些值（`core/layout/index.css:170,189,499,662,690,741,836,848,874,1023…`）。这是“3/5/7px 混用”反模式的真实存在形态。

**建议**：将越界值就近吸附到 4/6/8/12；补 `--radius-xl:12px`（文档有、实现无）。**影响范围**：`core/layout/index.css` 为主，视觉几乎无感。

---

## 5. Shadow（阴影）

- ✅ 三档 `--panel-shadow/-soft/-strong`，克制，无彩色大阴影主流。文档四档（xs/sm/md/lg），命名不同但语义可映射。
- ⚠️ 仅 18 处消费 token，~8 处一次性裸 `box-shadow`（含 dashboard Ant 琥珀阴影）。

**建议**：统一到 token；把裸值归并到最接近的档位。**影响范围**：小。

---

## 6. Border（边框）

- ✅ **本项无需修改**。`--panel-border/-border-strong` 统一，全局 focus-visible ring 规范（`index.css:225-245`），hover/focus 边框走 `color-mix`。达企业级。

---

## 7. Component（组件）

| 类别             | 状态                                                                                                                                       |
| :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| 封装层           | ✅ AppTable / AppModal / AppDrawer / FilterPanel / SubmitBar / FormSection / GovernanceSummaryBar / SystemRowActions / TableBatchActionBar |
| Modal 尺寸 token | ✅ `appModalSizeWidthMap`：sm560/md640/lg760/xl920/detail880                                                                               |
| 状态族           | ✅ 九件套（见 UI_REVIEW §2.2）                                                                                                             |
| 行操作           | ⚠️ 双写法（SystemRowActions vs 手写 Space）；无“更多”折叠                                                                                  |
| Skeleton         | ❌ 未纳入 arco/style.ts，页面级用 Spin                                                                                                     |
| PageHeader       | ⚠️ 导出但 0 引用（dead）                                                                                                                   |
| SideRailNote     | ⚠️ 旧右栏模式仍导出（§6.6.7 已标遗留）                                                                                                     |

---

## 8. Layout（布局）& 9. Motion（动效）& 10. Z-index

- **Layout**：✅ 单点装配、Fluid、密度系统；❌ 断点未 token（14 种裸值），移动抽屉未实现。
- **Motion**：✅ 时长收敛 0.16/0.18/0.2s；❌ 无 `--motion-duration-*`/easing token（文档定义 120/200/320ms + cubic-bezier）。
- **Z-index**：❌ 无 token（文档定义 base/sticky/dropdown/overlay/modal/notification 六档）；实现依赖 Arco 默认层级，跨浮层冲突时无统一裁决位。

---

## 11. 设计系统成熟度评估

| 子项             | 成熟度 | 锚点对比               |
| :--------------- | :----: | :--------------------- |
| Color token      |   中   | 有主题无语义色阶       |
| Typography token |   低   | 文档有、实现无         |
| Spacing token    |   中   | 壳层强、通用弱         |
| Radius token     |  中高  | 有阶梯但裸值越界       |
| Shadow token     |  中高  | 三档克制               |
| Border token     |   高   | 达标                   |
| Component 层     | **高** | 接近 Pro               |
| Motion token     |   低   | 数值一致但未 token     |
| Z-index token    |   低   | 缺位                   |
| **真相源单一性** | **低** | **双轨制，最大扣分项** |

---

## 12. 行业对标分析（交互 / 信息层级 / 组件一致性 / 可维护性）

> 按要求选取 4 个成熟中后台作参照，**只对比方法论，不要求照搬视觉**。结合 Pantheon Base“AI 友好、业务解耦、多语言、模块化单体底座”的定位给建议。

### 对标矩阵

| 维度              | Ant Design Pro                   | Arco Design Pro       | Vue Vben Admin          | React Admin           | **Pantheon Base 现状**                             |
| :---------------- | :------------------------------- | :-------------------- | :---------------------- | :-------------------- | :------------------------------------------------- |
| **Token 真相源**  | ConfigProvider theme，文档即实现 | Design Token + 主题包 | CSS var + unocss preset | 主题 via MUI/RA theme | ⚠️ **文档与实现双轨**                              |
| **暗色模式**      | ✅ 内置                          | ✅ 内置               | ✅ 内置                 | ✅ 内置               | ❌ 文档有实现无                                    |
| **页面状态族**    | Result 家族                      | Result 家族           | 内置                    | 内置 empty/error      | ✅ **九件套，最完整之一**                          |
| **表格抽象**      | ProTable（王牌）                 | 表格 + 列配置         | 封装 useTable           | `<Datagrid>` 声明式   | ✅ AppTable+列宽语义+跨页选择，接近 ProTable 精神  |
| **信息架构/导航** | 路由化菜单 + 页签                | 菜单 + 面包屑         | 多标签 + 菜单收藏       | resource 驱动         | ✅ 多页签(固定/拖拽/命令面板)，与 Vben 同档        |
| **权限模型**      | access.ts                        | 权限指令              | 角色/按钮权限           | RBAC/authProvider     | ✅ Casbin+菜单+按钮权限+权限工作台，**域覆盖最深** |
| **i18n 校验**     | 手动                             | 手动                  | 手动                    | 手动                  | ✅ **CI 化零硬编码，优于四者**                     |
| **响应式**        | 完整（栅格+抽屉）                | 完整                  | 完整                    | 完整                  | ⚠️ 桌面强、移动抽屉缺                              |
| **AI 生成友好**   | 一般                             | 一般                  | 一般                    | 一般                  | ✅ **DESIGN.md+checker，独有优势**                 |

### 逐维度改进建议（结合定位）

**1. 交互设计**

- 学 **Ant Pro ProTable**：把“筛选区折叠、列设置、密度切换、导出”做成 AppTable 一等能力（密度已有，列设置/导出可补）。
- 学 **Vben 页签**：Pantheon 已对齐，无需改。
- 缺口：操作列“更多”折叠（四者都有），应补（P1）。

**2. 信息层级**

- 学 **Arco Pro / Ant Pro 的“工作台”节奏**：首屏 KPI ≤4 已遵守；可补一个**可选**轻量图表原语（不引重型 echarts，用 SVG sparkline 即可），补足“Dashboard 成熟度”。
- 权限继承关系：学 **React Admin 的关系可视化**思路，给 Casbin policy 加一个树/矩阵视图（P3）。

**3. 组件一致性**

- 四者都有“单一 token 真相源”。Pantheon 的**第一优先级**就是把 `THEME_TOKENS_REFERENCE.md` 和 `index.css` 合一——**这一步做完，一致性直接跨入 Pro 档**。
- 收口行操作双写法、dashboard 调色板越界。

**4. 可维护性**

- Pantheon 的 **checker 驱动 + i18n CI** 已经**优于**四个对标项（它们多靠 code review 兜底）。建议**扩大 checker 覆盖**（把 dashboard.css 纳入 shell-visual-contract，加 token 越界检查），把这项独有优势做深。
- 降 `!important`（147 处）与深选择器：四个 Pro 都靠“组件库 ConfigProvider 定制”而非 `!important` 覆盖，Pantheon 可逐步用 Arco 的 CSS 变量定制入口替换部分强制覆盖。

### 对标结论

Pantheon Base 在 **状态族完整度、i18n 工程化、权限域深度、AI 生成约束** 四项上**已达到甚至超过对标产品**；短板集中在 **token 真相源统一、暗色、移动响应式** 三项——而这三项恰好是对标产品的“标配基础设施”，不是它们的“高级特性”。**补齐基础设施、保住独有优势**，是最高性价比路线。

---

## 13. 结论

设计系统的**组件层与工程约束层已是优秀水平**，**token 层的问题不是“缺”而是“散 + 双轨”**。最高杠杆动作只有一个：**统一 token 真相源**（文档与 `index.css` 合并为一套可校验的变量），并让 checker 守住它。做完这一步，其余（语义色、字号阶梯、圆角吸附、暗色）都能顺势补齐。
