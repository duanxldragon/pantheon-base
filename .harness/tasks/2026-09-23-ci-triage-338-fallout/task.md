---
status: completed
owner: platform
layer: system/auth
lastReviewed: 2026-09-23
---

# Task Packet — 2026-09-23-ci-triage-338-fallout

## 背景

PR #338 把 2026-09-22 两个整改轮次（170 文件）推上 CI 后，门禁暴露出三类本地看不见的缺陷；
合并之后 main 的 Release Gate 又因 SonarCloud 未清问题转红。本包记录这次 CI triage 的判据与修复。

## In / Out

**In**

- `dashboard.css → Dashboard.css`（git 层重命名）+ 引用它的 checker 与文档
- 新增行上的 9 条 golangci-lint 报告
- 阻断 Release Gate 的 5 条 SonarCloud smell
- 新增 case 守卫并接入 `prebuild` 门禁链
- 用渲染 SQL 测试钉住设备筛选谓词

**Out**

- 改变筛选语义（渲染 SQL 已证明逐字节相同）
- 保留策略 / API / 权限 / 菜单 / i18n
- 修 full-smoke 生成器套件的 flaky
- 修 `.golangci.yml` 的 v2 键漂移
- pantheon-ops 同步

## 判据（为什么这不是"改 CI 让门禁变绿"）

1. **路径大小写**：`dashboard.css` 与 import `./Dashboard.css` 在 Windows 上无法区分，Linux 构建
   报 `UNRESOLVED_IMPORT`。修的是仓库里的真实状态（重命名文件），不是放宽检查。
2. **9 条 lint**：全部落在本分支新增/修改的行上（`--new-from-rev` 口径），逐条按语义修：
   抽常量、去掉有溢出的转换、修正注释首词、删除确实无引用的死代码；未使用任何 `nolint` 抑制。
3. **5 条 Sonar smell**：由常量/复用既有常量消除，并用新增测试证明 SQL 未变。

## 验证

见 `commands.json`；关键结论：

- PR #338 CI：27 pass / 0 fail（修复前 Frontend Contract、Go Lint 双红）
- main push `6387115e`：CI、Code Quality Gates、Security Gates、Core Smoke、Full Smoke 全绿；
  Release Gate 仅因 SonarCloud 计数红 → 本包 #339 处理
- 新增守卫的负例：把 import 改回 `./dashboard.css` 时立即报 case mismatch（已复原）

## 未闭环 / follow-up

- Full Smoke Suite 在 main 上 flaky：同一提交 `2b1cba31` 08:17 通过、21:37 超时失败
- `.golangci.yml` 里三个 v2 拒收的键导致 `_test.go` 排除项静默失效（本轮 9 条中有 5 条本应被排除）
- 本地 `npm run <script>` 在本机 Cygwin 环境下会拉起 WSL bash，需直接调用 `node scripts/*.mjs`
