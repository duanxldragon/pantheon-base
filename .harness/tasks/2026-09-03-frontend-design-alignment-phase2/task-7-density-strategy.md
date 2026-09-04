# Task 7: 完善全局密度策略

## 任务目标

建立 compact / default / comfortable 三档密度策略，支持后台系统在不同使用场景下的密度切换，对齐蓝鲸设计规范。

## 背景

当前 pantheon-base 只有单一密度：
- 间距固定（12px/16px/24px）
- 行高固定（1.5）
- 表格行高固定

蓝鲸设计规范提供三档密度：
- **Compact**（紧凑）：数据密集型页面（表格、列表、监控）
- **Default**（默认）：常规后台页面（当前实现）
- **Comfortable**（舒适）：低频操作、阅读型页面（文档、设置）

## 实施方案

### 1. 密度 Token 定义

在 `frontend/src/index.css` 中补充：

```css
/* 密度策略 - 默认档 */
:root {
  --density: default;
  
  /* 间距 */
  --density-padding-xs: 4px;
  --density-padding-sm: 8px;
  --density-padding-md: 12px;
  --density-padding-lg: 16px;
  --density-padding-xl: 24px;
  
  /* 行高 */
  --density-line-height-tight: 1.4;
  --density-line-height-normal: 1.5;
  --density-line-height-relaxed: 1.75;
  
  /* 表格行高 */
  --density-table-row-height: 48px;
  
  /* 表单控件高度 */
  --density-control-height: 32px;
}

/* 紧凑模式 */
[data-density="compact"] {
  --density-padding-xs: 2px;
  --density-padding-sm: 6px;
  --density-padding-md: 8px;
  --density-padding-lg: 12px;
  --density-padding-xl: 16px;
  
  --density-line-height-tight: 1.3;
  --density-line-height-normal: 1.4;
  --density-line-height-relaxed: 1.5;
  
  --density-table-row-height: 40px;
  --density-control-height: 28px;
}

/* 舒适模式 */
[data-density="comfortable"] {
  --density-padding-xs: 6px;
  --density-padding-sm: 10px;
  --density-padding-md: 16px;
  --density-padding-lg: 20px;
  --density-padding-xl: 32px;
  
  --density-line-height-tight: 1.5;
  --density-line-height-normal: 1.75;
  --density-line-height-relaxed: 2.0;
  
  --density-table-row-height: 56px;
  --density-control-height: 36px;
}
```

### 2. 应用密度 Token

#### 受影响的组件

**P0（必须适配）**：
- [ ] `.arco-table` 行高
- [ ] `.arco-input` / `.arco-select` 控件高度
- [ ] `.arco-card` 内边距
- [ ] `.search-toolbar` 间距

**P1（建议适配）**：
- [ ] `.arco-form-item` 间距
- [ ] `.arco-modal-body` 内边距
- [ ] `.breadcrumb` 项间距
- [ ] `.stats-card` 内边距

#### 示例：表格行高

```css
.arco-table-tr {
  height: var(--density-table-row-height);
}

.arco-table-cell {
  padding: var(--density-padding-sm) var(--density-padding-md);
}
```

#### 示例：表单控件

```css
.arco-input,
.arco-select-view {
  height: var(--density-control-height);
  padding: var(--density-padding-sm);
}
```

### 3. 密度切换机制

#### 方案 A：全局切换（推荐）

在 `<html>` 或 `<body>` 上设置 `data-density` 属性：

```typescript
// src/shared/hooks/useDensity.ts
export function useDensity() {
  const setDensity = (density: 'compact' | 'default' | 'comfortable') => {
    document.documentElement.setAttribute('data-density', density);
    localStorage.setItem('pantheon-density', density);
  };

  useEffect(() => {
    const saved = localStorage.getItem('pantheon-density');
    if (saved) {
      document.documentElement.setAttribute('data-density', saved);
    }
  }, []);

  return { setDensity };
}
```

#### 方案 B：页面级切换（可选）

在特定页面容器上设置：

```tsx
<div className="table-page" data-density="compact">
  {/* 表格内容 */}
</div>
```

### 4. UI 控件（可选，不在本阶段实施）

在系统设置或用户偏好中添加密度选择器：

```tsx
<Radio.Group value={density} onChange={setDensity}>
  <Radio value="compact">紧凑</Radio>
  <Radio value="default">默认</Radio>
  <Radio value="comfortable">舒适</Radio>
</Radio.Group>
```

### 5. 实施步骤

#### Step 1: 定义密度 Token（15min）
在 `:root` 和 `[data-density]` 中定义完整 token

#### Step 2: 适配表格组件（15min）
- 表格行高
- 单元格内边距

#### Step 3: 适配表单控件（15min）
- Input/Select 高度
- Form Item 间距

#### Step 4: 适配卡片和容器（10min）
- Card 内边距
- SearchToolbar 间距

#### Step 5: 提供切换 Hook（5min）
- 创建 `useDensity` hook
- 读写 localStorage

### 6. 验收标准

- [ ] 定义三档密度 token（compact/default/comfortable）
- [ ] 至少 4 个组件适配密度变量
- [ ] `useDensity` hook 可工作
- [ ] localStorage 持久化密度偏好
- [ ] 表格在 compact 模式下更紧凑
- [ ] 表单在 comfortable 模式下更宽松

### 7. 测试场景

**Compact 模式**：
- 用户列表（100+ 行数据）
- 操作日志（密集文本）
- 监控仪表盘

**Default 模式**：
- 角色管理
- 部门管理
- 常规 CRUD 页面

**Comfortable 模式**：
- 系统设置（表单页）
- 个人中心（阅读型）
- 文档页面

## 风险评估

**低风险**：
- 默认密度不变，向下兼容
- 用户主动切换才生效
- 只影响间距和行高，不改变布局结构

**缓解措施**：
- 渐进式适配，优先表格和表单
- 充分测试三档密度的边界值
- 提供"重置为默认"选项

## 参考

- 蓝鲸设计规范：密度策略（紧凑/默认/舒适）
- Ant Design：Size 属性（small/middle/large）
- Material Design：Density

---

**预计时间**: 1h  
**优先级**: P1  
**前置条件**: Task 5 完成（容器 token 与密度相关）
