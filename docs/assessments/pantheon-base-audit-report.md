# Pantheon Base 设计与实现审查报告

> 审查日期：2026-05-22 | 审查范围：`pantheon-base/` 全量设计与实现

---

## 一、项目概况

Pantheon Base 是一个**模块化单体企业后台底座**，技术栈为 Go + Gin（后端） + React + TypeScript + Arco Design + Vite（前端）。

### 规模统计

| 维度 | 数量 |
|---|---|
| 后端 Go 文件 | 100+ |
| 后端模块域 | 8（auth / dashboard / platform / system:iam / system:org / system:config / system:audit / system:i18n / business） |
| 后端测试文件 | 30+ |
| 前端 TS/TSX 文件 | 80+ |
| 设计文档 | 40+ 份（双语，含 contracts / designs / acceptances / assessments / remediations 五层） |
| 合约文档 | 5 份（platform / auth / iam / org / config） |
| API 端点 | 100+（全部 `/api/v1/`） |

---

## 二、做得好的地方

### 2.1 分层合约体系成熟

五份合同文档（PLATFORM_CONTRACT、SYSTEM_AUTH_CONTRACT、SYSTEM_IAM_CONTRACT、SYSTEM_ORG_CONTRACT、SYSTEM_CONFIG_CONTRACT）定义了清晰的层边界、强约束、完成定义和验收标准。每份合同都有 frontmatter 元数据、关联设计/评估/整改/验收的追溯链，且双语维护。这是整个项目文档治理中最扎实的部分。

### 2.2 Auth 从 IAM 中成功物理拆分

DESIGN.md 中标记为"P0 已完成"的 auth 拆分已落地为 `backend/modules/auth/` 独立模块，包含：
- `auth_handler.go` + `auth_service.go` + `auth_dto.go`（标准垂直切片）
- `session_model.go` / `mfa_model.go` / `login_log_model.go` / `login_throttle_model.go` / `security_event_model.go`
- `totp.go` / `mfa_crypto.go`（真实 TOTP 实现）
- `auth_service_test.go` / `module_test.go` / `smoke_test.go` / `preferences_contract_test.go`（4 个测试文件）

### 2.3 后端垂直切片执行较彻底

`system/iam/user`、`system/iam/role`、`system/iam/menu`、`system/iam/permission`、`system/org/dept`、`system/org/post`、`system/config/dict`、`system/config/setting` 均遵循 `model / dto / service / handler` 自包含模式。未出现水平切分的大一统 service 目录。

### 2.4 测试覆盖有基础

30+ 测试文件覆盖了所有核心 service 层（user、role、menu、permission、dept、post、dict、setting、auth、dashboard、i18n、generator、dynamicmodule），以及 middleware（casbin、operation-log、secure-action、data-scope）和 pkg（common、database、contracts、upload）。

### 2.5 输入校验较全面

BACKEND.md §7 列出了每类实体的校验规则：用户名唯一/邮箱格式、角色 key 唯一、菜单路径唯一/父节点校验、部门层级校验/根节点保护、岗位编码唯一/部门归属、字典编码唯一/项值唯一、软删除唯一键归档复用、敏感配置加密等。覆盖面广且细节到位。

### 2.6 多语言基础设施完备

前端 i18next + 后端语言包 + 模块级 locales 自动聚合（`i18n:generate-module`）+ fallback 机制 + 运行时刷新，形成完整闭环。

### 2.7 设计文档体系庞大且结构清晰

docs/ 包含 contracts、designs、acceptances、assessments、remediations、archive 六层，每层有明确用途边界和索引规则（docs/README.md §1.1）。双语覆盖率接近 100%。

---

## 三、需要完善的问题

### P0 — 结构性问题

#### 1. 前端模块未跟随后端做子域物理拆分

后端已完成 `system/iam/{user,role,menu,permission}`、`system/org/{dept,post}`、`system/config/{dict,setting}` 的嵌套物理拆分，但前端仍是平铺结构：

```
frontend/src/modules/system/
  user/ role/ menu/ permission/    # 这些本应归入 iam/
  dept/ post/                       # 这些本应归入 org/
  dict/ setting/ i18n/              # 这些本应归入 config/
  audit/ generator/ dynamicmodule/ profile/
```

与后端结构对照：

| 后端 | 前端 | 对齐？ |
|---|---|---|
| `system/iam/user` | `system/user` | 否 |
| `system/iam/role` | `system/role` | 否 |
| `system/iam/menu` | `system/menu` | 否 |
| `system/iam/permission` | `system/permission` | 否 |
| `system/org/dept` | `system/dept` | 否 |
| `system/org/post` | `system/post` | 否 |
| `system/config/dict` | `system/dict` | 否 |
| `system/config/setting` | `system/setting` | 否 |

前端 `auth/` 和 `dashboard/` 已独立，但系统域仍未拆。AGENTS.md §2 要求"垂直切片、模块隔离"，前端当前平铺结构容易让 AI 和新开发者继续把 system 当作大杂烩。

#### 2. 遗留空目录 `backend/modules/system/menu/`

该目录为空（4 May 创建），显然是从旧结构迁移到 `system/iam/menu/` 后残留。AGENTS.md 明确禁止"把菜单、权限混回 system 大杂烩"，但残留的空 system/menu 会造成混淆——新开发者可能不确定应该改哪个。

#### 3. 4 月 29 日审计结论"实现领先于设计与验收"至今未完全闭合

PLATFORM_GAP_AUDIT_20260429.md 核心结论是"实现版图领先于设计与验收版图"。当时指出的问题包括 `system/config` 和 `business/cmdb/*` 扩张速度快于文档。时隔近一个月，需要确认：
- `generator` 和 `dynamicmodule` 的设计文档是否已追上实现？
- `business/cmdb/*` 是否有对应验收基线？

### P1 — 架构/一致性

#### 4. go.mod 在仓库根目录而非 backend/ 下

`go.mod` 在 `pantheon-base/go.mod`，module 名为 `pantheon-platform`，而所有 Go 代码在 `backend/` 子目录。这是一个历史遗留：早期 `go.mod` 在项目根，后来后端子目录化但 module path 未调整。这导致：
- import 路径形如 `pantheon-platform/backend/modules/auth`，语义冗余
- `go.mod` 与源码不在同一目录，不符合 Go 社区惯例
- CI/构建需要额外 `-C backend` 或 cd 操作

#### 5. auth_handler.go 跨边界 import 了 iam/user 包

```go
// backend/modules/auth/auth_handler.go:8
user "pantheon-platform/backend/modules/system/iam/user"
```

AGENTS.md 明确规定"业务模块禁止直接 import 底座模块的 Service 或 Repository"。虽然 auth 不是 business 模块，但 auth handler 从 iam/user import 模型定义，仍属于隐式耦合。应通过 `pkg/contracts` 或共享 DTO 解耦。

#### 6. 缺少仓库级构建/测试/lint 统一入口

仓库根 `package.json` 只包含 3 个 frontmatter 相关脚本。没有：
- `make build` / `make test` 统一入口
- `make lint`（Go + TS 同时执行）
- `docker-compose.yml` 存在但未在文档中标注版本/环境要求

开发者需要分别进入 `backend/` 和 `frontend/` 执行命令，且命令未在 AGENTS.md 中统一列出。

#### 7. 无 CI/CD 配置

仓库内未发现 `.github/workflows/`。对于一个声称"工具无关 Harness 协议"的项目，自身缺少 CI 门禁是一个信号缺口——harness 检查脚本没有在实际 CI 环境中被执行验证。

#### 8. AGENTS.md 阅读顺序有编号缺口

AGENTS.md 的阅读顺序从 1 跳到 44，但第 43 项缺失（40 → 41 → 42 → 44）。看起来 item 43 被删除但编号未重排。

### P2 — 功能与安全

#### 9. auth 模块缺少 handler 层测试

auth 模块有 `auth_service_test.go`、`module_test.go`、`smoke_test.go`、`preferences_contract_test.go`，但没有 `auth_handler_test.go`。Handler 层的 MFA 流程（login → challenge → verify → session）没有单元测试覆盖。这是安全关键路径。

#### 10. iam/user handler 缺少测试

`user_service_test.go` 存在，但没有 `user_handler_test.go`。Handler 层参数绑定、校验、响应组装未测试。

#### 11. 前端缺少组件级和页面级测试

`frontend/package.json` 中没有 Jest/Vitest 测试脚本。没有发现任何 `.test.ts` 或 `.spec.ts` 文件。前端 80+ TSX 文件，零测试覆盖。

#### 12. SSO/OIDC 设计仍为 Draft 状态

`docs/designs/SSO_OIDC_DESIGN.md` 在 docs/README.md 中被标注为"当前仍为 Draft，暂不作为主入口直接链接"。这在 DESIGN.md 路线图中属于 P2 演进能力是合理的，但 Draft 已存在一段时间，应明确计划升为 Active 的时间节点。

#### 13. 平台层缺少自动回归扫描

PLATFORM_CONTRACT.md §9.3 定义了固定扫描命令（rg 检查旧样式类名、裸 Modal/Drawer），但没有对应的自动化脚本将其集成到 pre-commit 或 CI。当前仅靠人工记忆执行。

#### 14. 没有数据库迁移版本管理

`database/system_init.sql` 是初始化脚本，但没有 migration 版本管理机制（如 golang-migrate）。随着系统演进，DDL 变更缺少可追溯的版本历史。

### P3 — 文档与体验

#### 15. docs/designs/ 目录膨胀

40+ 份设计文档平铺在 `docs/designs/` 下，虽然有 `designs/README.md` 做索引，但没有按层（platform / system/auth / system/iam / system/org / system/config / business）分子目录。新人打开目录会看到 80+ 文件（含 .en.md），信息密度过高。

#### 16. BACKEND.md §5 API 清单过于庞大

100+ API 端点集中列在一个文档中，没有按域拆分为子文档。每次新增端点都需要编辑这个超大文件，容易产生合并冲突。

#### 17. DESIGN.md 与 BACKEND.md 存在状态重复

DESIGN.md §8（当前实现状态判断）和 BACKEND.md §5（已实现系统接口）都在描述"已实现什么"。DESIGN.md 偏高层判断，BACKEND.md 偏接口清单，但边界模糊，更新一侧容易遗漏另一侧。

#### 18. 缺少 onboarding 快速启动指南

docs/README.md §2.1 给新人列了 12 步阅读清单，但没有一个"5 分钟快速了解项目"的浓缩入口。新人需要连读 12 份文档才能开始写第一行代码。

#### 19. 元数据索引项 44 在 AGENTS.md 和 DESIGN.md 都存在同样缺口

两份文件都有编号 44 的条目指向 `docs/assessments/SYSTEM_MODULE_AUDIT.md`，但都没有 43。这是复制同步导致的系统性偏差，暗示这两份索引是手工维护、未做一致性校验。

---

## 四、问题优先级汇总

| 优先级 | 数量 | 关键主题 |
|---|---|---|
| P0 | 3 | 前端子域未拆分、遗留空目录、实现-文档漂移未闭合 |
| P1 | 5 | go.mod 路径异常、auth 跨边界 import、缺 CI/CD、缺统一构建入口、AGENTS 编号缺口 |
| P2 | 5 | handler 层缺测试、前端零测试、SSO Draft 未定版、缺自动回归扫描、缺 DB migration |
| P3 | 5 | designs 目录膨胀、API 清单过大、状态双写、缺快速入门、索引一致性 |

## 五、与 4 月 29 日审计的对照

PLATFORM_GAP_AUDIT_20260429.md 的核心结论"实现版图领先于设计与验收版图"在一个月后仍然部分成立。对比：

| 4/29 发现 | 当前状态 |
|---|---|
| `system/config` 扩张快于文档 | 已改善：DICT_AND_SETTING_DESIGN、SYSTEM_CONFIG_EXTENDED_DESIGN、I18N_MODULE_DESIGN 均 Active |
| 文档与验收未跟上 | 部分改善：SYSTEM_CONFIG_GOVERNANCE_ACCEPTANCE 已建立 |
| `business/cmdb/*` 缺少验收 | 未证实：需确认 cmdb 验收基线 |
| 平台壳层双模式验收模板缺失 | 已修复：PLATFORM_SHELL_DUAL_MODE_ACCEPTANCE_TEMPLATE 已建立 |

---

## 六、建议整改优先级

1. **清理 `backend/modules/system/menu/` 空目录**（一行命令，立即消除歧义）
2. **前端 system 子域物理拆分**与后端对齐（工作量大但结构性收益高）
3. **补齐 auth handler 层测试**（安全关键路径，优先级最高）
4. **添加 CI/CD 工作流**（让 harness 检查脚本在真实 CI 中跑起来）
5. **修复 AGENTS.md/DESIGN.md 编号缺口**（一行改动）
