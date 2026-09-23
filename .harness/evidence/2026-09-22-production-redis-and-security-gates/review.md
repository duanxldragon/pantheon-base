# Review — 2026-09-22-production-redis-and-security-gates

## 结论

实现者视角：生产环境缺 Redis 或 Redis 连接失败时启动 fail-fast（`RequireRedis()`）；
`/api/v1/health` 的 dependencies 增加 `migrations`，DB 可达但迁移未完成时 readiness 降级为 503；
security.yml 的 report-only 分支补齐 owner 与 per-release 复审；runbook/deployment 写入可复现命令；
go.mod 从 1.26.5 升到 1.26.6 清掉 7 个可达 stdlib CVE。

评审视角：**修复了一个真正的静默降级缺口**。原来生产环境缺 `PANTHEON_REDIS_ADDR` 时会以无 Redis
状态启动，直到所有认证请求返回 401 才暴露；现在启动即失败。方向正确，收紧而非放宽。

## 对照验收标准

| 验收标准 | 证据 | 判定 |
| --- | --- | --- |
| 生产 Redis 缺失/失败 fail-fast | `TestRequireRedis_Semantics` PASS（生产恒需、dev 可选、显式开关、大小写、生产下显式 false 不降级）；`main.go` 缺 `PANTHEON_REDIS_ADDR` 时 `logging.Fatal` | 通过 |
| readiness 反映 DB/Redis/migration | `TestHealth_MigrationsOkAfterMigration` / `_MigrationsIncompleteDegradesReadiness` PASS；`/health` 新增 migrations 依赖 | 通过 |
| 安全扫描失败不被静默吞掉 | report-only 分支补 owner（repo maintainers）+ 每次 release 复审，失败在 step summary 与 artifacts 可见；push-to-main 仍强制阻断 | 通过 |
| 命令可在 CI/runbook 复现 | `docs/operations/RUNBOOK.md` 写入 govulncheck v1.3.0 / npm audit / race / 单测命令；`docs/DEPLOYMENT_GUIDE.md` 增 `PANTHEON_REDIS_REQUIRED` 与 health 三依赖验收 | 通过 |

## 评审关注点与处置

1. **fail-fast 是否会让部署更脆弱？** 是有意的取舍：生产没有 Redis 时认证与撤销黑名单本身就不可用，
   “能启动但全 401”比“启动失败并说明原因”更难排查。非生产仍可通过显式
   `PANTHEON_REDIS_REQUIRED=true` 选择严格模式，默认保持兼容。
2. **`os.Exit` 无法单测**：以 `RequireRedis()` 的行为测试 + 启动代码路径审查替代；这是任务包显式
   登记的 gap，不是遗漏。
3. **report-only 例外是否等于放行？** 不是。例外仍带 owner 与复审节奏，且结果在 step summary /
   artifacts 可见；只有 push-to-main 保持强制阻断这一点需维护者确认是否符合期望的阻断曲线。
4. **依赖升级**：只动了 go directive（1.26.5 → 1.26.6），未引入新依赖；复扫 0 reachable，
   并顺带修复了 `cmd/server` 可达的 stdlib 漏洞。

## 残余风险

- 例外策略的松紧（report-only 分支是否应升级为阻断）已由维护者于 2026-09-23 确认：push-to-main 保持强制，PR 侧 report-only 保留 owner + 每次 release 复审。
- `-race` 已在本地执行通过（项目内 `.tmp/mingw64` MinGW-w64 工具链）：database / platform / cmd/server / middleware 均无 data race。
- health 的 migrations 依赖只校验 `schema_migrations` 存在且非空，不校验与二进制期望版本是否一致；
  更严格的版本对齐属于后续 ratchet。
- govulncheck 依赖外网漏洞库；离线环境需要预热镜像（runbook 未展开）。

## Decision

approved with documented P2 follow-up

## Machine Readable

```json
{
  "taskId": "2026-09-22-production-redis-and-security-gates",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "cmd/server startup Redis requirement",
      "pkg/database Redis init and migration health",
      "modules/platform health readiness payload",
      "security workflow scan policy"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "Tightens failure behavior instead of adding capability: production now refuses to start without Redis and degrades readiness when migrations are incomplete. No new package edge; the report-only scan branches gained ownership metadata rather than being silenced."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-22-production-redis-and-security-gates/manifest.json",
    "evidence": ".harness/evidence/2026-09-22-production-redis-and-security-gates/commands.json",
    "reviewFile": ".harness/evidence/2026-09-22-production-redis-and-security-gates/review.md",
    "changeRef": "none",
    "planRefs": [".harness/ENTERPRISE_REMEDIATION_PLAN_2026-09-22.md"]
  }
}
```
