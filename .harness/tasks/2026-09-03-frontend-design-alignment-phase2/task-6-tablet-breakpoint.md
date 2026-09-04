# Task 6: 补充 1024px 平板断点

## 任务目标

补充 1024px 平板断点，完善 768px → 1024px → 1280px 三档响应式体系，对齐蓝鲸设计规范的四档断点标准。

## 背景

当前 pantheon-base 只有两个断点：
- `768px` (移动端/窄屏)
- `1280px` (桌面端)

蓝鲸设计规范使用四档断点：
- `768px` - 平板竖屏
- `1024px` - 平板横屏 / 小桌面 ⬅️ **缺失**
- `1280px` - 标准桌面
- `1440px` - 大桌面

缺失 1024px 导致：
- iPad 横屏（1024×768）直接跳到桌面布局，过于宽松
- SearchToolbar 在平板上展开不够优雅
- 侧边栏在中等屏幕上过宽或过窄

## 实施方案

### 1. 断点定义

在 `frontend/src/index.css` 中补充：

```css
/* 响应式断点 */
:root {
  --breakpoint-mobile: 0;
  --breakpoint-tablet: 768px;    /* 现有 */
  --breakpoint-tablet-lg: 1024px; /* 新增 - 平板横屏 */
  --breakpoint-desktop: 1280px;  /* 现有 */
  --breakpoint-desktop-lg: 1440px; /* 可选 - 大桌面 */
}
```

### 2. 受影响的组件

#### 优先级 P0（必须适配）

1. **侧边栏宽度**
   ```css
   /* 移动端：折叠 */
   @media (max-width: 767px) {
     .layout-sider { width: 0; }
   }
   
   /* 平板竖屏：窄侧边栏 */
   @media (min-width: 768px) and (max-width: 1023px) {
     .layout-sider { width: 180px; }
   }
   
   /* 平板横屏/小桌面：中等宽度 */
   @media (min-width: 1024px) and (max-width: 1279px) {
     .layout-sider { width: 220px; }
   }
   
   /* 桌面：标准宽度 */
   @media (min-width: 1280px) {
     .layout-sider { width: 240px; }
   }
   ```

2. **SearchToolbar 筛选弹层**
   ```css
   /* 当前：≤768px 收起到弹层 */
   /* 调整：≤1024px 收起到弹层 */
   @media (max-width: 1023px) {
     .search-toolbar__inline-filters { display: none; }
     .search-toolbar__filter-trigger { display: flex; }
   }
   ```

3. **表格列宽**
   ```css
   /* 平板横屏：隐藏次要列 */
   @media (max-width: 1023px) {
     .table-column-secondary { display: none; }
   }
   ```

#### 优先级 P1（建议适配）

4. **面包屑截断**
   ```css
   @media (max-width: 1023px) {
     .breadcrumb { max-width: 300px; }
   }
   ```

5. **对话框宽度**
   ```css
   @media (min-width: 1024px) {
     .arco-modal { max-width: 640px; }
   }
   ```

### 3. 实施步骤

#### Step 1: 定义断点 Token（10min）
在 `:root` 中添加 `--breakpoint-tablet-lg: 1024px`

#### Step 2: 适配侧边栏（20min）
- 读取 Layout 组件样式
- 添加 1024px 断点的侧边栏宽度规则
- 测试折叠/展开交互

#### Step 3: 适配 SearchToolbar（20min）
- 修改筛选项收起阈值 768px → 1024px
- 测试平板横屏下的筛选体验

#### Step 4: 适配表格和其他组件（30min）
- 表格次要列隐藏
- 面包屑截断
- 对话框宽度

#### Step 5: 验证（20min）
- Chrome DevTools 模拟 iPad 横屏（1024×768）
- 验证关键页面布局
- 截图对比

### 4. 验收标准

- [ ] 定义 `--breakpoint-tablet-lg: 1024px`
- [ ] 侧边栏在 1024px-1279px 区间有独立宽度
- [ ] SearchToolbar 在 ≤1024px 时收起行内筛选
- [ ] 至少 3 个页面在 iPad 横屏下布局合理
- [ ] 无移动端/桌面端回归

### 5. 测试设备

- iPad (1024×768, 横屏)
- iPad Pro 11" (1194×834)
- Surface Pro (1280×800, 接近临界值)

### 6. 关键页面验收

- [ ] 系统管理 - 用户列表（侧边栏 + SearchToolbar + 表格）
- [ ] 系统管理 - 角色管理（表单宽度）
- [ ] 平台首页（统计卡片网格）
- [ ] 登录页（居中宽度）

## 风险评估

**中等风险**：
- 可能影响现有 768px/1280px 断点的布局
- SearchToolbar 阈值变化可能影响用户习惯

**缓解措施**：
- 渐进式调整，每个组件独立提交
- 保留现有断点逻辑，只新增中间档
- 充分测试三档断点的边界值

## 参考

- 蓝鲸设计规范：响应式断点 768/1024/1280/1440
- Ant Design：响应式网格和断点
- Material Design：Layout breakpoints

---

**预计时间**: 1.5h  
**优先级**: P1  
**前置条件**: Task 5 完成（容器 token 影响布局）
