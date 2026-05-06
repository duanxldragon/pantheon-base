# Pantheon 前端评估报告

评估日期：2026-05-06
类型：Assessment
归属层：platform
状态：Active

## 总览

| 维度 | 评分 | 状态 |
| :--- | :--- | :--- |
| 设计 Token 合规 | 9/10 | ✅ 零 Arco 原始 token，全 Pantheon token |
| 组件封装 | 8/10 | ✅ 平台层封装完整，零原生泄漏 |
| 状态完整性 | 9/10 | ✅ 340 处 loading/error/empty 引用，覆盖 34 个文件 |
| 响应式 | 7/10 | ⚠️ 9 个 CSS 文件含 129 处媒体查询，非全量覆盖 |
| 可访问性 (A11y) | 3/10 | 🔴 仅 29 处 ARIA 标记，严重不足 |
| 性能 (Bundle) | 6/10 | ⚠️ 3MB 总包，locale 文件偏大 |
| 动效与微交互 | 3/10 | 🔴 仅 24 处动效，几乎无微交互 |
| 代码分割 | 5/10 | ⚠️ 组件注册表 + 4 处 React.lazy |
| 安全性 (XSS) | 10/10 | ✅ 零 dangerouslySetInnerHTML |
| 字体体系 | 9/10 | ✅ Source Sans 3 + JetBrains Mono |

**综合：6.3/10**

---

## 1. 设计 Token 合规 ✅ 9/10

### 通过项

- CSS 中零 Arco 原始 token（`--color-text-1`、`--color-border-2`、`--color-fill-1` 等）——全站统一 Pantheon token
- `DESIGN.md` 中定义的 spacing（4px 基准）、radius（4/6/8/12px）、shadow 体系在前端规则扫描中零违反
- 字体严格按 Source Sans 3（正文/UI）+ JetBrains Mono（代码）执行
- `radial-gradient` / `linear-gradient` / 非标准字重（650/620）零命中

### 缺陷

- `FRONTEND_UI_SPEC.md` 中定义的 token 值与 `index.css` 中的实际 token 在圆角尺寸上有不一致——design doc 定义 `--radius-sm: 6px` / `--radius-md: 8px`，但 CSS token 使用不同语义命名
- 未形成自动化 Token 一致性检查脚本（如 `check:pantheon-tokens`）

### 原始数据

```
Arco 原始 token 扫描: 0 命中
radial-gradient / linear-gradient: 0 命中
非标准字重 (650/620): 0 命中
Pantheon CSS 变量引用: 全站 CSS 统一使用自定义 token
```

---

## 2. 组件封装 ✅ 8/10

### 通过项

| 封装组件 | 用途 | 状态 |
| :--- | :--- | :--- |
| `AppModal` | 统一浮层（表单/确认） | ✅ |
| `AppDrawer` | 统一抽屉（详情/长表单） | ✅ |
| `SubmitBar` | 统一提交区 | ✅ |
| `FilterPanel` | 统一筛选区骨架 | ✅ |
| `FormSection` | 统一表单分区 | ✅ |
| `PageHeader` | 统一页头 | ✅ |
| `PageContainer` | 统一页面容器 | ✅ |
| `PageActions` | 统一操作区 | ✅ |
| `ListHeaderActions` | 统一列表操作按钮组 | ✅ |
| `TableBatchActionBar` | 统一批量操作栏 | ✅ |
| `ImportCsvButton` | 统一导入按钮 | ✅ |
| `PermissionAction` | 统一按钮权限控制 | ✅ |
| `GovernanceRail` | 统一治理辅助栏 | ✅ |
| `SideRail` | 统一右侧辅助栏 | ✅ |

- 业务页面零原生 `Modal` / `Drawer` 直接引入
- `Modal.confirm` 裸调用仅 `AppModalActions` 封装层内部使用（2 处）
- 旧右侧栏类名（`system-page-side`、`system-page-summary-card` 等）零命中
- `AppModalActions.ts` 提供统一 `confirm` / `success` / `error` 静态方法

### 缺陷

- `PermissionAction` 按钮权限组件与 `usePermission` hook 功能重叠，部分页面同时使用两者——应统一到一种方式
- `AppDrawer` 使用率远低于 `AppModal`，部分适合 Drawer 的详情页仍使用 Modal

---

## 3. 状态完整性 ✅ 9/10

### 通过项

- 340 处 loading/error/empty 引用覆盖 34 个文件
- 六态组件齐备：`PageLoading` / `PageServerError` / `PageNetworkError` / `PageError` / `PageEmpty` / `PageForbidden`
- `AppTable` 统一表格 loading/empty 处理
- `RouteContentFallback` 提供路由级 loading 兜底
- 错误态区分为 `isNetworkRequestError` / `isServerRequestError` / `isTimeoutRequestError` 三种类型
- 导入导出有 `ImportCsvButton` 统一处理 loading + 结果反馈

### 缺陷

- `PageForbidden` 仅在路由守卫层使用（`RoutePermissionGuard`），按钮级无权限态未统一——部分页面直接隐藏按钮，部分显示 `disabled + tooltip`
- `PageEmpty` 未区分"首次使用空态"和"搜索无结果空态"
- 网络断连时无全局离线提示（当前依赖 axios 超时报错）

---

## 4. 响应式 ⚠️ 7/10

### 通过项

- 9 个 CSS 文件含 129 处 `@media` 查询
- `layout/index.css`：36 处断点适配——壳层响应式最完善
- `list-page.css`：42 处——列表页骨架覆盖最好，包括表格横向滚动、筛选区折叠
- 壳层双模式（竖版侧栏 + 横版顶栏）切换已实现
- 断点体系：xs < 576 / sm ≥ 576 / md ≥ 768 / lg ≥ 992 / xl ≥ 1200

### 缺陷

- 生成器页面（`ModuleWizard`、`CodePreview`）无响应式适配——在窄屏下布局错乱
- `PermissionWorkbenchTab` 的 overview 卡片在竖版侧栏 + 窄屏下需要横向滚动
- `I18nList` 的 rename/lifecycle 面板在 pad 下未优化
- 横版顶栏模式的部分子菜单在窄屏下未测试

### 原始数据

```
@media 查询分布:
  layout/index.css: 36
  list-page.css: 42
  Login.css: 8
  auth.css: 6
  dashboard.css: 5
  App.css: 6
  index.css: 22
  其他: 4
```

---

## 5. 可访问性 (A11y) 🔴 3/10

### 现状

- 仅 **29 处** `role` / `aria-` / `alt` / `tabIndex` 标记
- 覆盖 **10 个文件**（全项目 146 个 TSX 文件，覆盖率 6.8%）

### 分布

| 文件 | 标记数 | 内容 |
| :--- | :--- | :--- |
| `layout/index.tsx` | 14 | Tab role, 页签拖拽 aria |
| `Login.tsx` | 4 | 表单 role, tabIndex |
| `DeptOrgTab.tsx` | 2 | Org chart role="button", tabIndex |
| `DeptList.tsx` | 2 | 同上 |
| `FilterPanel.tsx` | 2 | role="search" |
| 其他 | 5 | |

### 缺失项

| 检查项 | 状态 |
| :--- | :--- |
| Icon-only 按钮 `aria-label` | ❌ 全部缺失 |
| 表单错误关联 `aria-describedby` | ❌ 全部缺失 |
| Modal/Drawer focus trap | ❌ 无实现 |
| Page `lang` 属性跟随语言切换 | ❌ 未验证 |
| Skip-to-content 链接 | ❌ 无 |
| 色彩对比度 ≥ 4.5:1 | ❌ 未测量 |
| 图片 `alt` 属性 | ⚠️ 仅 react.svg / vite.svg |
| focus 可见态 | ⚠️ 仅全局 `:focus-visible` 规则 |

### 建议

Desktop 企业后台用户群体的 A11y 要求相对较低，但作为企业级平台应达到基本标准：
1. 为所有 Icon-only 按钮添加 `aria-label`
2. 表单错误态关联 `aria-describedby`
3. 平台 `AppModal` / `AppDrawer` 统一实现 focus trap
4. 壳层添加 `skip-to-content` 链接

---

## 6. 性能 ⚠️ 6/10

### Bundle 分析

| Chunk | 大小 | 评价 |
| :--- | :--- | :--- |
| `platform-builder` | 310KB | 🔴 生成器模块过大，应将 wizard 步骤拆分 |
| `arco-table` | 264KB | ⚠️ 第三方，可接受 |
| `ja-JP` | 161KB | ⚠️ 语言包偏大，建议按需加载 |
| `fr-FR` | 156KB | ⚠️ 同上 |
| `ko-KR` | 150KB | ⚠️ 同上 |
| `en-US` | 140KB | ⚠️ 基准语言包应降至 100KB 以下 |
| `zh-CN` | 132KB | ⚠️ 同上 |
| `arco-feedback` | 115KB | ✅ 第三方 |
| `arco-form-base` | 105KB | ✅ 第三方 |
| `app-vendor` | 89KB | ✅ |
| `arco-icons` | 87KB | ⚠️ 应按需引入 icon |
| 其余 chunks | < 56KB | ✅ |

**总 Bundle：3.0MB（69 个文件）**

### 懒加载现状

- 路由级：组件注册表中 19 个组件全部使用 `defineRegistryEntry` → `React.lazy` ✅
- 生成器模块：`platform-builder` 内所有 sub-component 未拆分，整个 generator 模块在访问 `/system/generator` 时全量加载
- 语言包：5 个 locale 全部打入，未按当前语言懒加载

### 关键指标

| 指标 | 当前值 | 目标 | 状态 |
| :--- | :--- | :--- | :--- |
| 构建时间 | 696ms | < 2s | ✅ |
| TypeScript 类型检查 | 通过 | 零 error | ✅ |
| Lighthouse Performance | 未测量 | ≥ 90 | ⚠️ 待测 |
| 首屏资源 | ~450KB (gzip 估算) | < 500KB | ✅ |

### 建议

1. 生成器按 wizard 步骤拆分为 3 个独立 chunk（Step1 / Step2 / Step3Preview）
2. 非当前 locale 语言包懒加载（仅加载 `zh-CN` / `en-US` 中的一个）
3. `arco-icons` 改为 tree-shaking 引入（当前疑似全量打包）

---

## 7. 动效与微交互 🔴 3/10

### 现状

- 24 处 `transition` / `animation` / `@keyframes` 引用，集中在 5 个 CSS 文件

### 分布

| 文件 | 动效数 | 类型 |
| :--- | :--- | :--- |
| `layout/index.css` | 17 | Sidebar collapse, tab hover, page transition |
| `index.css` | 3 | 全局 token 过渡 |
| `App.css` | 2 | 页面淡入 |
| `dashboard.css` | 1 | 卡片 hover |
| `list-page.css` | 1 | 行 hover |

### 缺失项

| 交互节点 | 当前 | 建议 |
| :--- | :--- | :--- |
| Modal 打开/关闭 | 无过渡 | `opacity + transform` fade-slide |
| Drawer 滑入/滑出 | 无过渡 | `transform: translateX` slide |
| Tab 切换 | 瞬间切换 | 内容区 fade 或 slide |
| 表格行 hover | 单色变化 | `background-color` transition |
| 按钮 hover/active | 无定制 | pressed 态 `scale(0.98)` |
| 筛选区折叠/展开 | 瞬间 | `max-height` transition |
| 页签关闭 | 瞬间 | fade + slide |
| 通知/Message 出现 | Arco 默认 | 可接受 |

### 建议

企业后台不需要花哨动效，但基本的：
1. Modal/Drawer fade + slide 过渡（`ease-out 200ms`）
2. 表格行 hover `transition: background-color 150ms`
3. Tab 内容区 `transition: opacity 150ms`
4. 按钮 press 反馈

应该作为平台封装层的默认行为统一实现。

---

## 8. 代码分割 ⚠️ 5/10

### 现状

- 路由级懒加载：组件注册表 19 个 key，全部通过 `React.lazy` 按需加载 ✅
- 手动 `React.lazy`：仅 4 处额外引用（`App.tsx` 中 3 处，`componentRegistry.ts` 中 1 处）
- Vendor chunk 分离：`react-vendor` + `app-vendor` + `arco-*` 6 个 vendor chunks ✅

### 问题

- `platform-builder`（310KB）包含整个生成器模块（wizard 3 步 + FieldEditor + CodePreview + 所有 logic），无论用户是否走完整个流程
- 语言包按 locale 分离（✅），但未按模块拆分——`zh-CN.ts` 2104 行全部在单文件中
- `arco-icons` 疑似全量引入（87KB），应 tree-shaking

### 建议

1. 生成器改为动态导入：`Step1` / `Step2` / `Step3Preview` 独立 chunk
2. 语言包按模块命名空间拆分：`system-zh-CN` / `biz-zh-CN` 等
3. 验证 `arco-icons` 是否已 tree-shaking（当前 87KB 偏大）

---

## 9. 安全性 ✅ 10/10

### 通过项

| 检查项 | 结果 |
| :--- | :--- |
| `dangerouslySetInnerHTML` | 0 命中 |
| token 存储 | 已从 localStorage 迁移到 httpOnly cookie |
| CSRF 保护 | double-submit cookie 模式已启用 |
| 敏感数据泄露 | 审计日志脱敏，API 错误不暴露堆栈 |
| XSS 向量 | 用户输入均经 React 默认转义 |

### 补充

- 本次会话中完成的 P0-1 token 迁移（`8df9bbc`）大幅提升了认证安全等级
- CORS 配置已添加（`cors_middleware.go`）

---

## 10. 字体体系 ✅ 9/10

### 通过项

| 检查项 | 结果 |
| :--- | :--- |
| 主字体 | Source Sans 3（Google Fonts 加载） |
| 代码字体 | JetBrains Mono |
| 回退链 | `system-ui, -apple-system, 'Segoe UI', sans-serif` |
| 字重 | 400/500/600/700 标准化，零 650/620 |
| Inter 残留 | 0 命中 |

### 缺陷

- Source Sans 3 通过 Google Fonts CDN 加载，内网部署时可能加载失败——应提供本地 fallback 或自托管字体文件
- 等宽字体引用仅 1 处（代码展示组件），覆盖率不足

---

## 改进路线图

### P0（立即修复）

| 项目 | 工作量 | 建议 |
| :--- | :--- | :--- |
| A11y 基线 | 2d | 为所有 Icon-only 按钮补 `aria-label`，表单错误关联 `aria-describedby` |
| 语言包懒加载 | 0.5d | 非当前 locale 按需加载 |

### P1（本阶段）

| 项目 | 工作量 | 建议 |
| :--- | :--- | :--- |
| 生成器按需拆分 | 1d | Wizard 3 步独立 chunk |
| Token 一致性检查 | 0.5d | 添加 `check:pantheon-tokens` npm 脚本 |
| 动效基线 | 0.5d | 平台 Modal/Drawer/Tab 统一过渡 |

### P2（后续演进）

| 项目 | 工作量 | 建议 |
| :--- | :--- | :--- |
| Focus trap | 0.5d | AppModal/AppDrawer 封装层统一实现 |
| Skip-to-content | 0.25d | 壳层添加 |
| 字体自托管 | 0.5d | Source Sans 3 本地化 |
| RTL 逻辑属性 | 渐进 | 逐步迁移方向硬编码到逻辑属性 |
| A11y 色比验证 | 0.5d | 全站色彩对比度测量 |

---

## 原始检查命令

```bash
# Token 合规
rg --color-text-1\|--color-border-2\|--color-fill-1 frontend/src --no-filename | wc -l

# XSS 向量
rg dangerouslySetInnerHTML frontend/src

# A11y 标记
rg "role=|aria-|ariaLabel|tabIndex|alt=" frontend/src -c

# 动效
rg "transition|animation|@keyframes" frontend/src --glob="*.css" -c

# 响应式
rg "@media|max-width|min-width" frontend/src --glob="*.css" -c

# Bundle 分析
ls -la frontend/dist/assets/*.js | sort -k5 -rn
```

---

## 相关文档

- `DESIGN.md` — 总体设计
- `docs/designs/FRONTEND_UI_SPEC.md` — UI 详细规范
- `docs/designs/FRONTEND.md` — 前端架构
- `docs/designs/BACKOFFICE_STYLE_CONSTRAINTS.md` — 后台样式约束
- `docs/remediations/BACKOFFICE_UI_REMEDIATION_PLAN_20260423.md` — UI 整改计划
- `docs/acceptances/CODE_REVIEW_STANDARD.md` — 代码评审标准
- `docs/archive/PHASE_REVIEW_BASELINE_20260506.md` — 同期基线审查报告
