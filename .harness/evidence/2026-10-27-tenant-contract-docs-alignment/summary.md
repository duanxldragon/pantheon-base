# Summary — W5 `2026-10-27-tenant-contract-docs-alignment`（契约/API 文档/前端类型/设计文档对齐已交付面）

分支 `docs/tenant-contract-alignment-w5-2026-10-27`，栈叠在 W4 分支
（`74a04c50`，含 CI premise 修正 `1ccf53e4`）之上；前置 W1（PR #436 收口包）、
W2（#434）、W4（#442）均 completed/在合。类型 docs / P3 / small，零运行时改动
（`expectedFiles.doNotTouch: backend/**` 全程未碰）。

## 修了什么（TC-05 / TC-06 / TC-07 / TC-08，逐条与证据见 [doc-diff.md](doc-diff.md)）

1. **TENANT_API.md 响应信封**：create/update/delete/add-member 四个示例从裸行
   /裸 message 对齐到真实信封 `{"code":200,"data":...,"message":"success"}`
   （Create data=行，其余 data={}），与 `tenant_platform_handler.go` 的
   `common.Success` 载荷逐一对照。
2. **`/members/page` 别名段删除**：§7 改为唯一挂载成员列表路由的表述；独立
   alias 段整段移除，无悬空锚点（doc-links strict 0）。生产路由
   （system_modules.go:290-306）本就没有该路径，alias 只存在于未注册的
   legacy `tenant_routes.go`。
3. **`MemberUsageQuery.status` → `'active' | 'disabled'`**：与 UI 实发值
   （Select 只发这两值）和后端 binding（`oneof=active disabled`）三方对齐；
   旧 `'removed'` 是没有任何一端使用的幽灵值。纯类型改动，运行时不变。
4. **TenantMemberList.tsx 去掩盖 cast**：`MemberQueryState.status` 直接引用
   `MemberUsageQuery['status']`，loadData 的 `as MemberUsageQuery['status']`
   删除；role 保持原样（manifest 只点名 status 一处）。tsc 干净。
5. **MULTI_TENANT_DESIGN.md 视野横幅**：Status 行改写为「vision document —
   not a V1 commitment」，绑定范围指向合同 §1，显式「What is not in V1」
   四项（subdomains / custom domains / branding / public self-registration），
   Phase 2/3 声明为探索性背景；探索性正文全保留。
6. **合同 §2.2 owner 转移表述**：从「转移 owner 是显式 API 动作」（暗示存在
   端点）改写为「无单一端点，两步显式动作（加新 owner → 移除旧 owner，
   `ensureNotLastOwner` 兜底）」，双 owner 中间态声明为合法。
7. **合同追加式修订 V1.8**：§5 补登记 W2 已实现行为的两个错误码
   （`user.not_found` 404、`tenant.member_exists` 400）+ 墓碑先查注记；
   变更记录追加 V1.8 行，性质 = Clarification，显式不改变任何不变量与
   In/Out 边界。W1（V1.6）/ W4（V1.7）已在既往行登记，本行补齐 W2。

## 验证矩阵（manifest verificationPlan 全量）

| 命令 | 结果 |
|---|---|
| `rg -n "members/page" docs/api/TENANT_API.md backend/modules/system/system_modules.go backend/modules/system/iam/tenant/tenant_routes.go` | 仅「不存在」说明句 + 未挂载 legacy 文件，生产注册零命中 |
| `node scripts/harness/check-doc-links.mjs --root . --strict` | 0 findings |
| `node scripts/harness/check-doc-inventory.mjs --root . --strict` | 0 findings |
| `cd frontend && npx tsc -b` | OK |
| `cd frontend && npm run lint` | OK |
| `node scripts/harness/check-task-packet.mjs --root .` | 66 files / 0 errors |
| live 后端抓 create/update/delete 真实响应体 | **not-run** — 本会话无 live 后端；以 handler 源码 + 信封构造器（`common/http/response.go:31-37`）替代验证，落在 manifest not-run 条款内 |

## 显式 gap

1. **live 响应体未抓取**：runtimeEvidence 第 1 条按 not-run + 环境缺口登记；
   信封例证全部锚到 handler 源码与响应构造器（doc-diff.md 每行给出依据）。
2. **TENANT_API.md §2/§3 仍是裸行示例**（缺信封外壳，data 形状本身正确）：
   不在本包 in 清单，登记为后续小项（commands.json knownGaps 第 3 条）。
3. **维护者触点（记录待复核）**：合同修订注记 V1.8 的人闸按
   maintainer-delegated 记录——V1.8 为纯追加澄清（owner 转移措辞 + W2 错误码
   登记），PR 评审可否决。

## 后续

- W6/W7/W8（三者 manifest 均依赖 W5）解锁。
- §2/§3 信封补壳可并入 W6 或独立小包。
