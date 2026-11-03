# 摘要：入口文档的四类失真，逐条换成可反证的事实

## 一句话

审计在入口文档上确认的不是“写得乱”，而是四类**方向相反的失真**：把旧版本当当前版本、把没做的说成做了（配额强制）、把做了的说成没做（CONTRIBUTING / Issue 模板）、把历史快照当当前状态（门禁全绿）。本包只做一件事——把每句话改成读代码就能复核的表述，且不新增任何承诺。

## 原文 → 事实 → 新表述

| 编号 | 原文 | 代码/仓库事实 | 新表述 |
| --- | --- | --- | --- |
| AUD-003a | “当前 foundation release [`pantheon-base-v0.17.8`]” | `git show origin/main:VERSION` = `0.18.2`，`docs/release-notes/RELEASE_NOTES_v0.18.2.md` 已存在 | 删除版本行，改为“以仓库根 `VERSION` 为准 + 发布说明索引”；正文不再抄写任何 release 号 |
| AUD-003b | “配额强制” | `grep -rn "quota\|Quota" backend/modules/system/iam/user backend/modules/system/iam/role` = **0**；配额只在租户运营读面 `QuotaFor` 展示 | “配额度量与展示（超限不拒绝写入，合同 §2.4.1）”（该行由 W2 于同日整行改写，本包只核对） |
| AUD-003c | “尚未提供 `CONTRIBUTING` 或 Issue Templates” | `CONTRIBUTING.md`、`LICENSE`、`.github/ISSUE_TEMPLATE/{bug_report,feature_request,question}.md` 均在库内 | 完整列举已入库社区文件，并把真正缺的 `CODE_OF_CONDUCT.md` 标为**尚未提供** |
| AUD-004 | DESIGN “多租户：未来 / P2 / 不在租户模型未明确前提前实现”，全文无租户章 | 租户合同 V1 已冻结且已交付 compat / multi 双模；`/system/tenant/*` 8 条路由、`/system/tenant-ops/*` 5 条路由在册 | 新增 §3.4 租户章（模型、双模、上下文优先级、Casbin domain、已交付面、明确未做面，含“业务域为单租户语义”）；§3.3 改逐项现状表；§4.3 改“拆分已交付，本节记历史理由”；§9 第 10 条更正 |
| AUD-016 | `docs/README.md` 指导用 `database/system_init.sql` 建库、在仓库根 `go run ./backend/cmd/server` | `backend/go.mod` 才是 module 根；schema 权威来源是版本化迁移 + runtime seed | 改为 docker compose → 迁移 + runtime seed → `cd backend && go run ./cmd/server`，并显式写“不要再用 system_init.sql” |
| AUD-007 | `docs/designs/README.md` 缺 18 条索引、宣称“.en companion 全齐”、`updated_at` 停在 2026-06-27 | 62 份中文主文档、57 份有 `.en.md`（缺 5 份） | 补齐至 62 份全覆盖，如实声明“62 份中 57 份有 `.en.md`，缺 5 份并点名”，`updated_at` → 2026-10-31 |
| AUD-024 | README 引用 2026-10-03 门禁快照并称“0 个阻塞性失败” | 快照无法随代码复核，README 无 run 链接 | 改为“本文件不维护验证日期或通过状态，以 `main` 最近一次 required checks 的 run 为准”，并列出 workflow 里的实际 job |
| 追加 | “Go 1.26.6 修复 7 个 stdlib CVE” 写在无相对时间标记的成果段 | `backend/go.mod` 为 `go 1.26.10` | 该段标注为“2026-09-22 当轮记录，不是当前状态”，版本句改为“此后基线继续抬升，当前值看 `backend/go.mod`” |

## 关键判断

**1. 版本号必须只有一个可维护来源。**
失真的机制不是“忘了改”，而是“正文抄了一份没人复核的副本”。所以修法不是把 0.17.8 改成 0.18.2（那会在下次 release 后原样复发），而是删掉正文里的版本号，只留 `VERSION` + `docs/release-notes/README.md` 两个入口。

**2. 门禁状态不能写进 README。**
同一个道理：任何“最后验证日期 + 通过”都会在下一个 PR 后失真。README 只描述**门禁定义与位置**（`.github/workflows/ci.yml`、`release-gate.yml`），状态交给 Actions。顺带删掉了同一段里与代码不符的 “SonarCloud 已通过” 类承诺。

**3. 租户章的事实来源是合同，不是历史评审报告。**
DESIGN 增补时以 `TENANT_CONTRACT_V1` §1/§2/§3/§4/§6 为唯一依据，尤其守住 W2 的结论：**业务域在 V1 内是单租户语义**，不参与租户隔离。正文里写清了“给业务路由组加租户中间件不会产生隔离，只会让 multi 模式下所有业务请求变成 `TENANT_CONTEXT_MISSING`”，把上一轮的误修复方向堵死。

**4. 索引声明要能被 `ls` 反证。**
“.en companion 均已补齐”这类句子成本极低、失真率极高。改为点名缺哪 5 份之后，读者预期正确，且下一次新增设计文档时由 `check-doc-links` 兜住死链。

## 边界（本次没做什么）

- 没补那 5 份缺失的 `.en.md`：成本高于收益，改为如实声明。
- 没改写 `docs/history/**`、`docs/reviews/**` 的历史结论。
- 没动 8 份 `docs/TENANT_*.md` 的位置：已在 `docs/README.md` §4.5 登记为“非一线入口、结论可能被合同取代”，迁移处置留给 W4（`2026-10-31-audit-p2-doc-lifecycle-archive`）。
- `README.en.md` 未新增多租户能力条目：英文页此前对租户**完全沉默**（是漏写，不是错写），补写属于能力描述扩充，不在“改成可反证的事实”范围内，登记为后续项而非本包顺带改。
