# Pantheon Base v0.12.0 Release 准备

**日期**: 2026-09-25  
**基础提交**: f5c9b896  
**状态**: 准备中

---

## Release 概述

v0.12.0 是企业级整改完成后的重要版本，包含两轮完整的架构和安全整改成果。

### 版本定位

- **类型**: Minor Release (功能增强 + 架构改进)
- **目标**: 企业级生产就绪增强
- **兼容性**: 向后兼容 v0.11.0

---

## 核心特性

### 1. 命名与边界整改 (6/6 完成)

**auth 模块解耦**:
- 新增 `pkg/contracts/authuser` 端口
- auth 模块独立，platform 不依赖 auth
- 契约化接口设计

**边界门禁**:
- `check-boundaries --strict` 就位
- `system/*` 子域隔离验证
- 生成文件治理 (`check-generated --strict`)

**文档结构**:
- docs/ 目录重组
- 历史文档归档
- 清晰的文档分层

### 2. 企业级整改 (6/6 完成)

**Wave 0 - 安全边界 (P0)**:
- 会话撤销三路生效 (DB + refresh 删除 + access 黑名单)
- 租户公开设置隔离 (`map[namespace]*resp`)
- 上传授权与导入资源治理

**Wave 1 - 生产规模 (P1)**:
- 统一导出上限 10,000 行
- 会话列表 SQL 分页 (ALL→ref, 260ms/op)
- 后台维护器 (`pkg/maintenance`)

**Wave 2 - 门禁 (P1/P2)**:
- 生产 Redis fail-fast
- Go 1.26.6 (修复 7 个 stdlib CVE)
- readiness 反映迁移状态
- govulncheck 集成

### 3. 质量提升

**测试覆盖**:
- Core Smoke 279 用例全部通过
- Race 检测全模块通过
- 所有门禁绿灯

**性能优化**:
- 导出统一上限保护
- SQL 查询索引优化
- 保留操作后台化

**安全增强**:
- CVE 修复 (Go 1.26.6)
- govulncheck 0 漏洞
- 会话撤销语义完整

---

## Breaking Changes

无。本版本 100% 向后兼容 v0.11.0。

---

## Migration Guide

### 从 v0.11.0 升级

```bash
# 1. 备份数据库
mysqldump pantheon_base > backup_v0.11.0.sql

# 2. 停止服务
systemctl stop pantheon-base

# 3. 更新代码
git pull origin main
git checkout pantheon-base-v0.12.0

# 4. 运行迁移
./backend/pantheon migrate up

# 5. 重启服务
systemctl start pantheon-base

# 6. 验证
curl http://localhost:8080/api/v1/health
```

### 配置变更

**新增环境变量**:
```bash
# 生产环境 Redis 必需性（默认：生产恒为 true）
PANTHEON_REDIS_REQUIRED=true

# 开发环境可选 Redis（允许降级）
PANTHEON_ENV=development
PANTHEON_REDIS_REQUIRED=false
```

**维护任务配置** (可选):
```yaml
# 后台维护器默认配置
maintenance:
  session_cleanup_interval: 1h
  login_log_retention: 90d
  operation_log_retention: 180d
  audit_log_retention: 365d
```

---

## 发布清单

### Pre-release

- [ ] 运行完整测试套件
  - [ ] `go test ./...`
  - [ ] `go test -race ./...`
  - [ ] `govulncheck ./...`
  - [ ] `npm test` (前端)
  - [ ] Full Smoke Suite

- [ ] 运行所有门禁
  - [ ] Quality Gates
  - [ ] Security Gates
  - [ ] SonarCloud
  - [ ] Release Gate

- [ ] 文档检查
  - [ ] CHANGELOG.md 更新
  - [ ] README.md 版本更新
  - [ ] Migration guide 完整
  - [ ] API 文档更新

- [ ] 版本标记
  - [ ] 更新 VERSION 文件
  - [ ] 更新 package.json 版本
  - [ ] 更新 Go module 版本

### Release

- [ ] 创建 release branch (`release/0.12`)
- [ ] 运行 release 构建
- [ ] 创建 Git tag (`pantheon-base-v0.12.0`)
- [ ] 推送 tag 到远程
- [ ] 创建 GitHub Release
  - [ ] Release notes
  - [ ] Assets (bundle, snapshot)
  - [ ] SHA-256 checksums

### Post-release

- [ ] 验证 release assets
- [ ] 测试 foundation bundle
- [ ] 通知 pantheon-ops 团队
- [ ] 更新文档网站
- [ ] 社交媒体公告

---

## Release Notes (草稿)

### Pantheon Base v0.12.0 - Enterprise Ready

**发布日期**: 2026-09-XX

我们很高兴地宣布 Pantheon Base v0.12.0 正式发布！这是一个重要的里程碑版本，完成了两轮完整的企业级整改，为生产环境部署做好了充分准备。

#### 🎯 核心改进

**架构优化**:
- ✅ auth 模块完全解耦，契约化接口设计
- ✅ 边界门禁就位，防止架构漂移
- ✅ 生成器统一治理

**安全增强**:
- ✅ 会话撤销三路生效机制
- ✅ 租户公开设置完全隔离
- ✅ Go 1.26.6 修复 7 个 stdlib CVE
- ✅ govulncheck 0 可达漏洞

**性能提升**:
- ✅ 统一导出上限 10,000 行
- ✅ 会话列表 SQL 分页优化
- ✅ 后台维护器统一调度

**质量保障**:
- ✅ Core Smoke 279 用例全部通过
- ✅ Race 检测全模块通过
- ✅ 所有质量和安全门禁通过

#### 📊 统计数据

- 整改任务: 12/12 完成
- 代码质量: A 级 (SonarCloud)
- 测试覆盖: Core Smoke 279 用例
- 安全扫描: 0 可达漏洞

#### 🔧 兼容性

100% 向后兼容 v0.11.0，无 breaking changes。

#### 📖 文档

- [Migration Guide](./docs/MIGRATION_v0.12.0.md)
- [CHANGELOG](./CHANGELOG.md)
- [完整文档](./docs/README.md)

#### 🙏 致谢

感谢所有贡献者和测试人员！

---

## Timeline

- **2026-09-25**: 归档完成，开始准备
- **2026-09-26**: 完成 pre-release 检查
- **2026-09-27**: 创建 release candidate
- **2026-09-28**: 测试 RC
- **2026-09-29**: 创建正式 release
- **2026-09-30**: Post-release 验证

---

**下一步**: 执行 Pre-release 清单
