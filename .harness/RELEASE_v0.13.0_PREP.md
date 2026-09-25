# Pantheon Base v0.13.0 Release 准备

**日期**: 2026-09-25  
**基础版本**: v0.12.1  
**状态**: 准备中

---

## Release 概述

v0.13.0 是任务治理和归档系统完善后的版本，基于 v0.12.1 的企业级整改成果。

### 版本定位

- **类型**: Minor Release (治理增强)
- **目标**: 任务治理体系完善 + 文档系统健全
- **兼容性**: 向后兼容 v0.12.1

---

## 核心特性

### 1. 任务治理体系 (新增)

**完整归档系统**:
- 116 个任务完整归档 (7月 27 个, 8月 23 个, 9月 66 个)
- 活跃任务清零机制
- Evidence 证据链完整保留
- 历史文档系统化归档

**治理文档**:
- `.harness/STATUS.md` - 任务状态总览
- `.harness/ARCHIVE.md` - 归档索引
- `.harness/FINAL_SUMMARY.md` - 最终总结
- `.harness/EXECUTION_REPORT.md` - 执行报告

### 2. 继承 v0.12.1 特性

**命名与边界整改 (6/6)**:
- auth 模块解耦
- 边界门禁就位
- 生成文件治理

**企业级整改 (6/6)**:
- 会话撤销三路生效
- 租户公开设置隔离
- 导出统一上限 10,000 行
- 后台维护器

**质量保障**:
- Core Smoke 279 用例通过
- Race 检测全模块通过
- govulncheck 0 漏洞

---

## 变更内容 (v0.12.1 → v0.13.0)

### 新增

- 完整的任务归档系统
- 治理文档体系
- 历史文档归档

### 优化

- 文档结构清晰化
- README 信息更新
- 归档索引系统

---

## Breaking Changes

无。本版本 100% 向后兼容 v0.12.1。

---

## Migration Guide

### 从 v0.12.1 升级

```bash
# 1. 停止服务
systemctl stop pantheon-base

# 2. 更新代码
git pull origin main
git checkout pantheon-base-v0.13.0

# 3. 重启服务
systemctl start pantheon-base

# 4. 验证
curl http://localhost:8080/api/v1/health
```

无需数据库迁移或配置变更。

---

## 发布清单

### Pre-release

- [ ] 验证版本继承
  - [ ] 确认基于 v0.12.1
  - [ ] 验证所有门禁通过
  - [ ] 确认无新增代码变更

- [ ] 文档检查
  - [ ] CHANGELOG.md 更新
  - [ ] README.md 版本更新
  - [ ] 归档文档完整

- [ ] 版本标记
  - [ ] 更新 VERSION 文件 (0.13.0)
  - [ ] 创建 release notes

### Release

- [ ] 拉取远程最新代码
  - [ ] `git pull origin main --rebase`
  - [ ] 解决任何冲突
  
- [ ] 创建发布分支
  - [ ] `git checkout -b release/0.13`
  - [ ] `git push origin release/0.13`

- [ ] 创建 Git tag
  - [ ] `git tag -a pantheon-base-v0.13.0 -m "Release v0.13.0"`
  - [ ] `git push origin pantheon-base-v0.13.0`

- [ ] 创建 GitHub Release
  - [ ] Release notes
  - [ ] Assets (如有需要)

### Post-release

- [ ] 验证 release
- [ ] 通知 pantheon-ops 团队
- [ ] 更新文档

---

## Release Notes (草稿)

### Pantheon Base v0.13.0 - Governance Enhancement

**发布日期**: 2026-09-XX

Pantheon Base v0.13.0 在 v0.12.1 企业级整改成果基础上，完善了任务治理体系和文档系统。

#### 🎯 核心改进

**任务治理**:
- ✅ 116 个任务完整归档
- ✅ 活跃任务清零机制
- ✅ Evidence 证据链保留
- ✅ 历史文档系统化

**文档体系**:
- ✅ 完整的状态文档
- ✅ 归档索引系统
- ✅ 执行报告和总结

**继承特性** (来自 v0.12.1):
- ✅ 命名与边界整改 6/6
- ✅ 企业级整改 6/6
- ✅ Core Smoke 279 用例
- ✅ 所有门禁通过

#### 📊 统计数据

- 归档任务: 116 个
- 活跃任务: 0 个
- 文档系统: 完善
- 质量等级: A (SonarCloud)

#### 🔧 兼容性

100% 向后兼容 v0.12.1，无 breaking changes，无需数据库迁移。

#### 📖 文档

- [CHANGELOG](./CHANGELOG.md)
- [完整文档](./docs/README.md)
- [归档索引](./.harness/ARCHIVE.md)

---

## Timeline

- **2026-09-25**: 归档完成，准备发布
- **2026-09-26**: 同步远程，解决冲突
- **2026-09-27**: 创建 release
- **2026-09-28**: Post-release 验证

---

**下一步**: 拉取远程更新 → 解决冲突 → 创建 release
