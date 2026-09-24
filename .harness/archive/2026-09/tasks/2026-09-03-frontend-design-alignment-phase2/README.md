# 前端设计规范对齐 - 阶段二任务包

## 任务概览

**阶段**: Phase 2（P1 优先级）  
**预计工期**: 4.5 小时  
**任务数量**: 3 个  
**目标**: 补齐容器分类、响应式断点、密度策略

## 任务清单

### Task 5: 重构容器 Token（区分交互/展示）⏳
- **优先级**: P1
- **预计时间**: 2h
- **文件**: `task-5-container-token-refactor.md`
- **目标**: 
  - 区分交互容器（input/button/card）和展示容器（panel/section）
  - 新增 `--container-interactive-*` 和 `--container-display-*` token
  - 迁移现有 `--panel-*` 引用

### Task 6: 补充 1024px 平板断点 ⏳
- **优先级**: P1
- **预计时间**: 1.5h
- **文件**: `task-6-tablet-breakpoint.md`
- **目标**:
  - 新增 `@media (min-width: 1024px)` 断点
  - 补充平板布局适配规则
  - 更新响应式组件（SearchToolbar/侧边栏）

### Task 7: 完善全局密度策略 ⏳
- **优先级**: P1
- **预计时间**: 1h
- **文件**: `task-7-density-strategy.md`
- **目标**:
  - 定义 compact/default/comfortable 三档密度
  - 补充密度切换 token 和 CSS 变量
  - 提供密度切换 hook（可选）

## 执行顺序

建议按顺序执行：
1. Task 5 → Task 6 → Task 7
2. Task 5 是基础，影响 Task 6 和 Task 7
3. Task 6 和 Task 7 可以并行

## 验收标准

### Task 5
- [ ] 定义 8 个新 token（交互容器 4 个 + 展示容器 4 个）
- [ ] 迁移所有 `--panel-*` 引用
- [ ] 无样式回归

### Task 6
- [ ] 新增 1024px 断点
- [ ] 至少 3 个组件适配平板布局
- [ ] 移动/平板/桌面三档断点完整

### Task 7
- [ ] 定义 compact/default/comfortable 三档密度
- [ ] 至少覆盖间距/字号/行高
- [ ] 提供切换机制（CSS 变量或 data-density 属性）

## 参考资料

- 蓝鲸设计规范: 容器分类、响应式断点、密度策略
- 阶段一审查报告: `docs/reviews/frontend-design-review-blueking-2026-09-03.md`
- 当前设计规范: `DESIGN.md` §7.7 §7.8

## 回滚策略

每个 Task 独立提交，可单独回滚：
```bash
# 回滚单个 Task
git revert <task-commit-hash>

# 回滚整个阶段二
git revert <phase2-start>..<phase2-end>
```

---

**创建时间**: 2026-09-03  
**创建者**: Claude Opus 5  
**前置阶段**: Phase 1 ✅ 已完成
