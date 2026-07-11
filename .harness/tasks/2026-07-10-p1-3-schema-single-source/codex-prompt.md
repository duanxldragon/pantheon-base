# P1-3 执行记录

> 注意：本任务原计划委派 Codex，但 Human Owner 于 2026-07-10 **显式授权 Claude 直接实现本次任务**（不走 Codex）。因此本文件保留为执行说明，而非 Codex prompt。

## 实际执行方式

Claude 作为被授权的直接实现者，在隔离 worktree（feat/p1-3-schema-single-source，off main）内完成 P1-3：

1. 核实 `system_init.sql` 现状（已 DEPRECATED，但 docker-compose 仍挂载）。
2. 核实应用启动自举完整（migrate + seed.go + i18n seed + admin/casbin）。
3. 移除 docker-compose 陈旧挂载，统一 schema 到 golang-migrate。
4. 更新 DATABASE.md、新增 database/README.md。

证据见 `.harness/evidence/2026-07-10-p1-3-schema-single-source/commands.md`。
