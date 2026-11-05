# OIDC 脚手架去留决策（AUD-005）

- **任务包**：`2026-10-31-audit-p2-oidc-scaffold-decision`
- **决策日期**：2026-10-31
- **决策人**：维护者（本会话授权"按计划推进"）
- **结论**：**方案 (a) 第一步——删除不可达实现，保留迁移与列**，列删除登记为延后事项

---

## 1. 决策前的事实（全部实测）

| 事实 | 读数 | 命令 |
|---|---|---|
| 包规模 | 4 文件 / 587 行（`config.go 77` / `handler.go 115` / `provider.go 92` / `service.go 303`） | `wc -l backend/modules/auth/oidc/*.go` |
| 包外引用 | **0** | `grep -rn "auth/oidc\|oidc\." backend --include=*.go \| grep -v "backend/modules/auth/oidc/" \| wc -l` |
| 路由注册 | **0**（`modules/auth/module.go` 未引用） | 同上，命中 0 即无注册点 |
| 前端引用 | 5 处，全部是 `login.sso_enabled` 功能开关的**文案**，不是 OIDC 实现 | `grep -rn -i "oidc" frontend/src` |
| 环境变量 | `.env.example` 未登记 `PANTHEON_OIDC_*`（注意：任务包写的 `backend/.env.example` **路径不存在**，真实路径是仓库根 `.env.example`） | `grep -n -i "oidc\|sso" .env.example` |
| 合同冲突 | `docs/contracts/SYSTEM_AUTH_CONTRACT.md:168`「未明确身份源前，不提前实现真实 SSO/OIDC/OAuth2/企业微信接入」 | 人工比对 |
| 迁移状态 | `000029_oidc_fields` 已入版本链，带 4 列 + 1 个租户级唯一键 + 1 个 `auth_type` 索引 | `cat backend/pkg/database/migrations/000029_oidc_fields.up.sql` |
| 列的实际消费者 | **0**（除 `migrate_test.go:30,105` 断言列/索引存在外，无任何读写） | `grep -rn "auth_type\|oidc_subject" backend --include=*.go` |

## 2. 既有决策材料（先读再决策）

- `docs/designs/SSO_OIDC_DESIGN.md`（799 行，`status: Draft`，`updated_at: 2026-09-08`）：完整设计，包含 CSRF/state/nonce、JIT 供应、风险与三阶段路线图。**是设计，不是批准。**
- `.harness/archive/2026-09/evidence/2026-09-08-p1-sso-oidc-design/completion.md` 原文：
  > "This task is **design-first**. Implementation (Phase 2, ~9 hours) is deferred for future execution after design approval."
- `.harness/archive/2026-09/tasks/2026-09-08-p1-sso-oidc-implementation/` **只有目录，无 task.md、无 completion.md**——没有"实现已批准并完成"的任何记录。
- `docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md` 与 `SYSTEM_AUTH_CONTRACT.md §7.3` 同向：身份源未定不实现。

**判定**：这 587 行是**在设计与合同都未批准的前提下**提前写出的实现，且未接任何路由、未登记任何环境变量、未进任何测试。它不是"预留能力"，是"未完成的施工面"。

## 3. 三方案对比与被否理由

| 方案 | 做法 | 代价 | 结论 |
|---|---|---|---|
| (a) 删除实现 | 删 `modules/auth/oidc/`；迁移与列保留；列删除另立延后事项 | 一次性删除 587 行；代码可从 git 历史恢复；零运行时风险（0 引用/0 路由） | **采纳** |
| (b) 移入 experimental | 移到 `internal/experimental/` 并声明不在支持范围 | 仍需维护"支持范围"的说明；合同冲突只被改名而非消除；587 行仍占维护面 | 否 |
| (c) 补齐 | 注册路由 + 补测试 + 补文档 + 改合同 | 安全面扩张（OAuth2 回调、state/nonce、JIT 供应、账号绑定策略），且**与"进入维护冻结"直接冲突**；需真实 IdP 才能验收 | 否 |

**为什么 (a) 优于 (b)**：本合同要解决的不是"代码放哪儿"，而是"合同说不要、代码却存在"。移到 experimental 后矛盾仍在，只是换了个目录名；删除让矛盾消失，且删除后 `go build`/`go vet` 立即证明零影响。(b) 唯一优势是"保留未来的实现草稿"，但草稿的价值已由 799 行设计文档承担，而且代码是在未经批准的设计上写的，保留它反而会诱导下一位维护者"接着写完"。

## 4. 为什么列删除不在本次执行

- `000029_oidc_fields` 是**已发布的历史迁移**，改写它会让已升级的库与迁移文件不一致（本项目明确禁止改写历史迁移，见 AUD-013 的处理约定）。
- drop 列**不可逆**，且需要先确认没有任何环境已启用 OIDC（当前无部署登记，但无法从仓库证明）。
- 四列可空、无消费者、`auth_type` 默认 `local`，**保留成本为零**；而它同时是"身份源定了之后直接复用 schema"的资产。
- 因此按合同 §8 的 contract-change 纪律：**先删代码观察一个 release，再单独提 drop 迁移**。延后事项已登记在 `SYSTEM_AUTH_CONTRACT.md §7.3` 的处置说明里。

## 5. 本次实际改动

| 文件 | 动作 |
|---|---|
| `backend/modules/auth/oidc/`（4 文件 587 行） | **删除**（删除前备份到 `/tmp/pantheon-oidc-backup-2026-10-31/oidc/`） |
| `docs/contracts/SYSTEM_AUTH_CONTRACT.md` §7.3 | 在原条款下追加"2026-10-31 处置"说明：删了什么、保留什么、什么延后 |
| `docs/contracts/SYSTEM_AUTH_CONTRACT.en.md` | 同步英文条款 |
| 两份合同的 `updated_at` | `2026-06-23` / `2026-04-30` → `2026-10-31` |
| `backend/pkg/database/migrations/000029_oidc_fields.{up,down}.sql` | **未改动**（历史迁移不可改写） |
| `docs/designs/SSO_OIDC_DESIGN.md` | **未改动**（保持 `Draft`，作为未来设计输入） |

## 6. 验证

```
cd backend && go build ./...        → exit 0
cd backend && go vet ./...          → exit 0（无输出）
cd backend && go test -short ./modules/auth/... ./pkg/contracts/...
  → modules/auth [no test files]
  → login / mfa / security / session  ok
  → pkg/contracts                     ok
grep -rn "auth/oidc\|oidc\." backend --include=*.go | wc -l → 0
```

## 7. 残留与后续

- **延后事项（不阻断冻结）**：`system_user` 的 4 个 OIDC 列与 `uk_system_user_tenant_oidc_subject` 唯一索引仍在。若身份源长期不定，可在某个 release 提一条 drop 迁移；若定了，则按 `SSO_OIDC_DESIGN.md` 重新实现并复用这些列。
- **不可逆点**：本次删除的代码只能从 git 历史恢复（本工作树删除前已提交的版本为 `ef00738`）。
- **未被本决策覆盖**：`login.sso_enabled` 功能开关仍存在于配置与前端文案中。合同 §7.3 允许该开关存在（"可以作为配置开关存在"），但**不得展示伪能力入口**——本次未改动，属 W3/W6 的检查面。
