# SonarCloud Open Issues 修复计划

## 概览
- **总计**: 16 个 OPEN issues
- **技术债**: 300 分钟
- **创建日期**: 2026-09-05
- **影响**: smoke-core 测试套件

## 问题分类

### 1. typescript:S2925 - 固定等待问题（14个，280min）

**规则说明**: 测试中不应使用固定时间等待，应该用可观察条件同步

**当前模式**:
```typescript
await page.waitForLoadState('networkidle');
```

**推荐修复**:
```typescript
// 替代方案 1: 等待特定元素可见
await expect(page.locator('.target-element')).toBeVisible({ timeout: 10000 });

// 替代方案 2: 等待 URL 变化
await page.waitForURL(/.*\/expected-path/);

// 替代方案 3: 等待网络空闲前先等待关键元素
await page.locator('.loading-indicator').waitFor({ state: 'hidden' });
```

**受影响位置**:

1. **business-generated-basic.spec.ts** (3处)
   - Line 28: 子菜单展开后
   - Line 56: 业务菜单展开后
   - Line 88: 业务菜单展开后

2. **platform-shell-critical.spec.ts** (2处)
   - Line 54: 折叠按钮点击后
   - Line 62: 展开按钮点击后

3. **system-dept-operations.spec.ts** (2处)
   - Line 79: 部门管理页加载后
   - Line 159: 删除部门后

4. **system-menu-permission.spec.ts** (2处)
   - Line 87: 菜单管理页加载后
   - Line 170: 删除菜单后

5. **system-role-authz.spec.ts** (2处)
   - Line 71: 角色管理页加载后
   - Line 155: 删除角色后

6. **system-user-crud.spec.ts** (3处)
   - Line 82: 用户管理页加载后
   - Line 123: 编辑用户后
   - Line 159: 删除用户后

### 2. typescript:S1607 - 跳过的测试（2个，20min）

**规则说明**: 被跳过的测试必须解释原因或移除

**位置**:
- `business-generated-basic.spec.ts` Line 77 - `test.skip('can fill and submit create form')`
- `business-generated-basic.spec.ts` Line 105 - `test.skip('generated module list has basic operations')`

**修复方案**:
```typescript
// 选项 1: 添加注释解释
test.skip('can fill and submit create form', async ({ page }) => {
  // TODO: 当前跳过因为需要真实的业务模块生成后才能测试表单字段
  // 等待 Code Generator v2 完成后启用此测试
});

// 选项 2: 移除 skip，实现测试
test('can fill and submit create form', async ({ page }) => {
  // 实现测试逻辑
});

// 选项 3: 如果永久不需要，直接删除整个测试
```

## 修复优先级

### P1 - 立即修复（S1607）
跳过的测试应该有明确说明或移除，影响测试套件可维护性。

### P2 - 计划修复（S2925）
`waitForLoadState('networkidle')` 虽然是 bad practice，但在当前 smoke 测试中：
- 实际运行稳定
- 覆盖了真实用户场景
- 14 处修改需要仔细验证每个断言点

**建议策略**:
1. 先修复 S1607（2个，简单）
2. S2925 作为技术债，在下次重构测试时统一优化
3. 或者在 `.sonarcloud.properties` 中针对 smoke-core 目录排除此规则

## 实施步骤

### Step 1: 修复 S1607（预计 30min）
```bash
cd frontend/tests/smoke-core
# 编辑 business-generated-basic.spec.ts
# 为两个 test.skip 添加 TODO 注释说明跳过原因
```

### Step 2: 评估 S2925 修复成本
- 每处需要：识别关键元素 + 改写等待条件 + 验证测试通过
- 14 处 × 20min = 280min ≈ 4.7 小时
- 需要完整回归测试

### Step 3: 临时豁免（可选）
如果 S2925 修复成本过高，可以添加：

```properties
# sonar-project.properties
sonar.issue.ignore.multicriteria=e1

# 豁免 smoke-core 中的 S2925
sonar.issue.ignore.multicriteria.e1.ruleKey=typescript:S2925
sonar.issue.ignore.multicriteria.e1.resourceKey=frontend/tests/smoke-core/**
```

## 决策点

**需要维护者决定**:
1. S1607: 为跳过的测试添加注释 vs 移除？
2. S2925: 立即全部修复 vs 技术债延后 vs SonarCloud 豁免？

## 验证清单

修复后运行：
```bash
cd frontend
pnpm playwright test tests/smoke-core --reporter=list
```

确保：
- [ ] 所有测试通过
- [ ] 测试运行时间没有显著增加
- [ ] 修复后重新扫描 SonarCloud 确认问题关闭
