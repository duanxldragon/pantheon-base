# Pantheon Base v0.13.0 Release 准备

**日期**: 2026-09-25  
**候选基线**: 当前 `main` 的企业级整改收口工作线（仓库无可消费的 v0.12.1 tag）
**状态**: 已完成 hosted release gate、正式 tag 和 GitHub Release 发布；Ops 消费同步单独跟进

---

## Release 概述

v0.13.0 是任务治理和归档系统完善后的候选版本，包含企业级整改收口成果。

### 版本定位

- **类型**: Minor Release (治理增强)
- **目标**: 任务治理体系完善 + 文档系统健全
- **兼容性**: 保持现有 foundation release 消费契约

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

### 2. 继承企业级整改特性

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

## 变更内容 (企业级整改收口 → v0.13.0)

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

无。本候选版本保持现有 API、数据库和配置兼容性。

---

## Migration Guide

### 从当前 foundation release 升级

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

- [x] 验证版本继承
  - [x] 以已通过 Release Gate 的提交 `c254e4c8c63f4409d49752eedb097291627d0b82` 固定 manifest
  - [x] 记录本地审计与归档 evidence
  - [x] 确认 release 已通过 hosted gate；Ops 同步仍单独跟踪

- [x] 文档检查
  - [x] CHANGELOG.md 更新
  - [x] release notes / upgrade notes / consumer impact 完整
  - [x] 归档文档与状态入口完整

- [x] 版本标记准备
  - [x] 创建 `releases/pantheon-base-v0.13.0/manifest.json`
  - [x] 创建 release notes、verification summary 和 consumer notes
  - [ ] 创建正式 Git tag（需 hosted checks 通过后由维护者执行）

### Release

- [ ] 合入 `main` 并确认工作树干净
  - [ ] 所有规划任务为 `completed`
  - [ ] 本地 required checks 全部通过
  - [ ] GitHub required checks 全部成功
  - [ ] 本地和远端仅保留 `main` 分支

- [ ] 创建 Git tag
  - [x] 创建并推送 `pantheon-base-v0.13.0` 不可变 tag
  - [x] 创建 GitHub Release 并上传 foundation bundle、repo snapshot 和 SHA-256 校验文件

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

Pantheon Base v0.13.0 在企业级整改收口成果基础上，完善了任务治理体系和文档系统。

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

**继承特性** (来自企业级整改收口):
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

保持现有 foundation release 消费契约，无 breaking changes，无需数据库迁移。

#### 📖 文档

- [CHANGELOG](../CHANGELOG.md)
- [完整文档](../docs/README.md)
- [归档索引](./ARCHIVE.md)

---

## Timeline

- **2026-09-25**: 归档完成，准备发布
- **2026-09-26**: 同步远程，解决冲突
- **待门禁通过**: 创建 release
- **发布后**: 验证资产并更新 Ops 消费锁

---

**剩余门禁**: 在干净的 `main` 上运行 hosted required checks，创建不可变 tag/GitHub Release，然后在干净的 `pantheon-ops` 工作树执行消费升级和业务 smoke。仓库内准备工作已完成。
