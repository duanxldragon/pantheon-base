# Task Packet — 2026-09-22-production-redis-and-security-gates

## 目标

使生产启动依赖、依赖漏洞扫描和安全工作流具有明确的 fail-fast 与阻断语义，避免服务或 CI 在关键能力不可用时仍显示成功。

## 范围

In：`backend/cmd/server/main.go`、Redis 初始化/健康检查、`.github/workflows/security.yml`、必要的质量工作流和部署文档。

Out：不更换 Redis 客户端、不升级依赖版本本身，除非扫描发现必须修复的 CVE。

## 验收标准

- 生产环境缺少 Redis 地址、密码或连通性失败时启动失败，开发/测试兼容行为有明确开关。
- health/readiness 能反映 DB、Redis、migration 状态，而非仅 HTTP 进程存活。
- govulncheck/npm audit 的结果不会被 `continue-on-error` 和 `|| true` 静默吞掉；PR report-only 必须有明确例外和到期责任人。
- workflow security scan 的失败语义与分支策略一致，报告可下载。
- `govulncheck`、npm audit、race、MySQL/Redis smoke 在 CI 或运行手册中有可复现入口。

## 验证

```text
go test ./cmd/server ./internal/middleware ./pkg/database
go vet ./cmd/server ./internal/middleware ./pkg/database
go run golang.org/x/vuln/cmd/govulncheck@v1.3.0 ./...
npm audit --audit-level=high
```

## 依赖与证据

- blockedBy：session-revocation-closure
- blocks：生产发布声明和 SLA 基线
- evidenceDir：`.harness/evidence/2026-09-22-production-redis-and-security-gates`
- human gate：CI 阻断策略和生产 Redis 必需性需维护者确认。

