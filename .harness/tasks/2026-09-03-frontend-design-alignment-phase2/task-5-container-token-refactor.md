# Task 5: 重构容器 Token（区分交互/展示）

## 任务目标

参考蓝鲸设计规范，将当前混合的 `--panel-*` token 拆分为：
- **交互容器**（Interactive Container）：输入框、按钮、可点击卡片
- **展示容器**（Display Container）：面板、区块、信息展示卡片

## 背景

当前 `--panel-bg-solid`、`--panel-border` 等 token 同时用于：
1. 可交互元素（输入框、选择器、可点击卡片）
2. 静态展示元素（信息面板、区块容器、统计卡片）

这导致交互态和静态态的视觉层次不清晰。蓝鲸的做法是：
- 交互容器有更明显的边框、hover/focus 态
- 展示容器使用更弱的分隔、更多的留白

## 实施方案

### 1. 新增 Token 定义

在 `frontend/src/index.css` 中新增：

```css
/* 交互容器 - 需要用户操作的元素 */
--container-interactive-bg: var(--panel-bg-solid);
--container-interactive-border: var(--panel-border);
--container-interactive-hover-bg: var(--brand-primary-bg-hover);
--container-interactive-focus-border: var(--brand-primary);

/* 展示容器 - 信息展示、分组容器 */
--container-display-bg: var(--panel-muted);
--container-display-border: rgba(0, 0, 0, 0.06);  /* 更弱的边框 */
--container-display-separator: rgba(0, 0, 0, 0.04);  /* 内部分隔线 */
--container-display-elevated: var(--panel-bg-solid);  /* 提升的展示容器 */
```

暗色模式：
```css
--container-display-border: rgba(255, 255, 255, 0.08);
--container-display-separator: rgba(255, 255, 255, 0.04);
```

### 2. 迁移策略

**保留现有 token**（向后兼容）：
- `--panel-bg-solid`
- `--panel-border`
- `--panel-muted`

**逐步迁移**：
1. 新组件使用新 token
2. 现有组件按优先级迁移：
   - P0: 输入控件、按钮
   - P1: 卡片、表单
   - P2: 页面容器

### 3. 迁移清单

#### 交互容器（应使用 `--container-interactive-*`）
- [ ] `.arco-input`
- [ ] `.arco-select`
- [ ] `.arco-picker`
- [ ] `.arco-card.clickable`
- [ ] `.search-toolbar`（已有自定义样式，评估后迁移）

#### 展示容器（应使用 `--container-display-*`）
- [ ] `.arco-card`（非交互）
- [ ] `.arco-descriptions`
- [ ] `.stats-card`（平台首页）
- [ ] `.profile-section`（个人中心）
- [ ] `.config-panel`（系统设置）

### 4. 验收标准

- [ ] 定义 8 个新 token（交互 4 个 + 展示 4 个）
- [ ] 暗色模式适配完整
- [ ] 至少迁移 5 个组件/场景
- [ ] 输入控件 focus 态更明显
- [ ] 展示容器边框更弱
- [ ] 无样式回归（视觉验收）

## 实施步骤

### Step 1: 定义 Token（15min）
在 `frontend/src/index.css` 中添加新 token

### Step 2: 迁移 Arco 控件覆盖（30min）
更新 `.arco-input`、`.arco-select` 等的边框和背景

### Step 3: 迁移业务组件（45min）
- 统计卡片（首页）
- Profile 区块（个人中心）
- Config 面板（系统设置）

### Step 4: 验证和调整（30min）
- 视觉验收 6 个关键页面
- 对比度检查
- 暗色模式验证

## 风险评估

**低风险**：
- 新 token 是现有 token 的语义封装
- 保留旧 token，渐进迁移
- 可逐个组件验证

**缓解措施**：
- 每迁移一个组件提交一次
- 视觉对比截图
- 如有问题可单独回滚

## 参考

- 蓝鲸设计规范：容器组件 - 交互态 vs 展示态
- Material Design：Surfaces and Interaction States
- Ant Design：组件层级和交互反馈

---

**预计时间**: 2h  
**优先级**: P1  
**前置条件**: 阶段一完成
