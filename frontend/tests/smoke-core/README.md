# Core Smoke Test Suite

> **目标**: 20分钟内覆盖最高价值的关键路径，用于 PR 合并后的快速反馈。

## 设计原则

- ✅ **关键路径优先**: 影响所有用户的核心功能
- ✅ **高风险操作**: 数据破坏性操作（删除、批量更新）
- ✅ **历史回归热点**: 过去频繁出问题的区域
- ❌ **边缘场景**: 留给完整回归测试
- ❌ **特性专项**: 特定功能的深度测试

## 核心套件组成

| 测试文件 | 覆盖范围 | 预估耗时 | 优先级 |
|---------|---------|---------|--------|
| `auth-login-logout.spec.ts` | 登录、登出、token刷新 | 2min | P0 |
| `platform-shell-critical.spec.ts` | Shell结构、菜单导航 | 2min | P0 |
| `system-user-crud.spec.ts` | 用户CRUD、批量操作 | 3min | P0 |
| `system-role-authz.spec.ts` | 角色授权基础场景 | 3min | P0 |
| `system-dept-operations.spec.ts` | 部门树操作 | 2min | P1 |
| `system-menu-permission.spec.ts` | 菜单权限联动 | 2min | P1 |
| `system-import-export.spec.ts` | 导入导出核心场景 | 3min | P1 |
| `business-generated-basic.spec.ts` | 生成模块基础CRUD | 3min | P1 |

**总计**: 8个文件，~20分钟

## 运行方式

```bash
# 本地运行（需要先启动后端）
cd frontend
npm run test:smoke:core

# 运行单个文件
npx playwright test tests/smoke-core/auth-login-logout.spec.ts

# 调试模式
npx playwright test tests/smoke-core/auth-login-logout.spec.ts --debug
```

## 与完整冒烟测试的关系

```
smoke-core/              → 20分钟，PR合并后运行
  ├── 8个核心场景
  └── 覆盖70%关键路径

smoke/ (完整套件)        → 120分钟，每日定时运行
  ├── 28个完整场景
  └── 覆盖100%功能+边缘场景
```

## 维护指南

### 何时添加新测试到核心套件？

满足以下**任一条件**：

1. 生产环境发生过 P0/P1 级别的回归
2. 影响所有用户的核心功能路径
3. 数据破坏性操作（删除、重置、批量修改）

### 何时从核心套件移除？

- 连续3个月无失败记录，且非关键路径
- 迁移到单元测试或集成测试更合适

### 保持套件轻量级

- 每个 spec 控制在 3-5 个 test case
- 避免复杂的数据准备
- 复用 fixtures 和 helpers
- 目标运行时间: 18-22分钟

## Troubleshooting

### 本地运行失败？

```bash
# 1. 确认后端已启动
curl http://127.0.0.1:8080/api/v1/health

# 2. 检查数据库连接
# backend/.env 中配置正确的数据库DSN

# 3. 清理测试数据
npm run test:smoke:core -- --grep @cleanup
```

### CI 中运行缓慢？

- 检查是否开启了并行执行 (`--workers=2`)
- 查看 MySQL/Redis 服务是否健康
- 检查 fixture 清理是否正常

## 相关文档

- [测试优化完整方案](../../docs/testing-strategy-optimization.md)
- [快速启动指南](../../docs/testing-quick-start.md)
- [完整冒烟测试](../smoke/README.md)
