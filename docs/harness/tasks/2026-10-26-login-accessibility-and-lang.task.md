---
title: 登录页第二轮微调与全站密码可见性、文档语言无障碍收口（F-07 / F-08 / F-09）
doc_type: Remediation
layer: app
depends_on_layers:
  - system/auth
  - system/iam
  - system/config
status: Active
linked_contracts:
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - DESIGN.md
  - docs/harness/VERIFICATION_EVIDENCE_SPEC.md
updated_at: 2026-10-26
---

# Task Packet: 2026-10-26-login-accessibility-and-lang

## Goal

登录页第二轮微调（样式）加上两个无障碍缺陷的彻底修复，范围只在前端：

1. 登录卡片垂直居中、主题与语言控件绝对定位到视口右上角、左侧文案改为统一的认证入口说明、
   工具按钮改为 Ghost（无边框 + hover 弱底），并保证 320px 到 3840px 十档视口无横向溢出。
2. F-07：Arco `Input.Password` 自带的可见性切换是一个 `tabIndex=0` 且无无障碍名称的 `<svg>`，
   屏幕阅读器读不出按钮用途，键盘用户点击后焦点被 Arco 输入框外层 `onClick` 抢回。
3. F-08：同一缺陷存在于全站 12 个 `Input.Password` 调用点（登录、锁屏、二次验证、安全中心、
   用户新增/重置密码、租户新增、系统设置加密项、生成器数据源）。逐个打补丁不可维护，必须收敛到
   一个共享组件并用静态门禁防回归。
4. F-09：`index.html` 的 `<html lang="en">` 是写死的，切换语言后该属性不变，屏幕阅读器仍按英文
   规则朗读中文/日文界面。

无后端、数据库、路由、权限码、菜单 seed、错误信封变更。

## Primary Layer

app

改动集中在 `frontend/src/components/patterns/forms/`（新共享组件）、`frontend/src/i18n/index.ts`、
`frontend/index.html` 以及各调用点文件；壳层与登录模块消费该组件。

## Dependency Layers

- `system/auth`：登录卡片、锁屏解锁、安全中心三个密码字段改用共享组件。
- `system/iam`：用户新增、重置密码（两处）、租户新增管理员密码改用共享组件。
- `system/config`：系统设置加密项、生成器数据源密码改用共享组件。
- `platform`：i18n 初始化与语言切换的 `document.documentElement.lang` 同步（前端侧）。

## Harness Profile

- Template: `admin-platform`
- Overlay: `pantheon-base`
- Quality Profile: `ui-accessibility`
- Portable Failure Class: `unnamed-control` / `focus-steal` / `document-attribute-drift`
- Owner Layer: `consumer-repository`
- Ratchet Decision: `sensor-added`
- Coverage Dimensions:
  - behaviour
  - architecture-fitness

## Contract Anchors

- `DESIGN.md` §7.9：视觉反模式禁止清单与机械门禁清单（本轮新增 `Input.Password` 直用禁令）。
- `docs/harness/VERIFICATION_EVIDENCE_SPEC.md`：证据必须对应实际执行的命令与真实输出。
- `docs/contracts/SYSTEM_AUTH_CONTRACT.md`：登录、二次验证与安全中心的既有行为边界（本轮不改语义）。

## Scope

### In

- 登录卡片垂直居中、右上角绝对定位工具行、左侧文案、Ghost 工具按钮、Tab/Enter 键盘流。
- 新增 `components/patterns/forms/PasswordInput.tsx` + `password-input.css`：
  `visibilityToggle={false}` + 受控 `visibility` + `suffix` 真实 `<button aria-label>`，
  `onClick` 调 `stopPropagation()` 以保住焦点。
- 把 12 个 `Input.Password` 调用点全部迁到共享组件，删除随之无用的 `Input` 绑定。
- 新增 `frontend/scripts/check-password-toggle.mjs` 棘轮门禁，接入 `prebuild`、
  `config/ui-quality-gate.json` 的 `enforcement.existingStaticChecks` 及其测试夹具。
- i18n：`syncDocumentLang` + 初始化调用 + `languageChanged` 订阅；`index.html` 预绘脚本按
  `pantheon_lang` 写入 `lang`，静态属性改为 `zh-CN`。
- 新增 `auth.password.show` / `auth.password.hide` 五语言词条。
- 单元测试（组件 5 例、document lang 3 例）与 Chromium 浏览器逐面验证。

### Out

- 忘记密码 / 自助重置密码（维护者已明确本轮放下，由管理员代为重置）。
- 后端、数据库 schema 与迁移、路由、权限码、菜单 seed、错误信封。
- 密码强度策略、锁定策略等安全语义。
- SonarCloud 规则变更、门禁阈值放宽或测试跳过。
- 提交、推送与开 PR（未获要求）。

## Expected Files

### Create

- `frontend/src/components/patterns/forms/PasswordInput.tsx`
- `frontend/src/components/patterns/forms/password-input.css`
- `frontend/scripts/check-password-toggle.mjs`
- `frontend/tests/unit/components/patterns/forms/PasswordInput.test.tsx`
- `frontend/tests/unit/i18n/document-lang.test.ts`
- `docs/harness/tasks/2026-10-26-login-accessibility-and-lang.task.md`
- `.harness/tasks/2026-10-26-login-accessibility-and-lang/manifest.json`
- `.harness/evidence/2026-10-26-login-accessibility-and-lang/{summary.md,review.md,commands.json}`

### Modify

- `frontend/src/modules/auth/login/components/Login.tsx` 与登录卡片样式
- `frontend/src/core/layout/AppLayout.tsx`
- `frontend/src/components/feedback/SecondaryVerifyModal.tsx`
- `frontend/src/modules/auth/security/components/SecurityCenter.tsx`
- `frontend/src/modules/system/iam/user/{UserFormModal.tsx,ResetPasswordModal.tsx}`
- `frontend/src/modules/system/iam/tenant/TenantList.tsx`
- `frontend/src/modules/system/config/setting/SettingGroupForm.tsx`
- `frontend/src/modules/lowcode/generator/pages/components/DatasourceManagerModal.tsx`
- `frontend/src/i18n/index.ts`、`frontend/index.html`
- `frontend/package.json`（`check:password-toggle` + `prebuild`）
- `config/ui-quality-gate.json`、`tests/scripts/check-ui-quality-gate.test.mjs`
- `DESIGN.md` §7.9

### Do Not Touch

- `backend/**`
- `backend/pkg/database/migrations/**`
- `.github/workflows/**`
- 已发布的 tag 与 foundation-release 资产
- `.env.test` 与任何凭据文件

## Implementation Notes

- Arco 的切换控件无法命名：`es/Input/password.js` 把 `IconEye/IconEyeInvisible` 直接渲染成
  `tabIndex: 0` 且 `aria-hidden: undefined` 的 `<svg>`，`Input.Password` 没有暴露命名入口，
  因此只能用 `visibilityToggle={false}` + 受控 `visibility` + `suffix` 自带按钮。
- Arco 输入框内层 `es/Input/input.js:153` 有 `onClick: () => inputRef.current.focus()`，
  任何冒泡到外层的点击都会把焦点抢回输入框，所以按钮必须 `stopPropagation()`；
  单测里对该行为做了回退差分（删掉该行只有焦点用例失败）。
- 图标方向沿用 Arco 约定：可见时 `IconEye`，隐藏时 `IconEyeInvisible`，避免视觉语义反转。
- `index.html` 的五语言列表与 `SUPPORTED_LOCALES` 重复；首帧之后 i18n 会重新断言，
  漂移只影响第一帧，为五个字符串引入构建期模板不划算。
- `disabled` 态用 `opacity: 0.5`：设计 Token 里没有 `--text-disabled`。
- 新门禁必须同步三处：`frontend/package.json`、`config/ui-quality-gate.json`、
  `tests/scripts/check-ui-quality-gate.test.mjs` 的夹具拷贝列表，否则 canonical policy 测试
  以 `ui_gate_enforcement_file_missing` 失败。

## Verification Plan

- `cd frontend && node node_modules/typescript/bin/tsc -b`
- `cd frontend && node node_modules/eslint/bin/eslint.js src --max-warnings 0`
- `cd frontend && node node_modules/vitest/vitest.mjs run`（含两份新单测，并对两份新测试各做一次
  回退差分：去掉被验证行为必须变红）
- `cd frontend && node ./scripts/check-password-toggle.mjs`，并植入临时违规文件证明其 rc=1
- `cd frontend &&` 逐个重放 `prebuild` 13 项静态检查（Git Bash 无 npm）
- `cd frontend && node scripts/audit-i18n-locales.mjs && node scripts/check-contrast.mjs`
- Chromium（Playwright，本机 `127.0.0.1:5173` + 后端 `:8080`）：登录页十档视口、五种语言下的
  `<html lang>`、以及逐个打开真实密码面断言「有名称按钮 / 零个无名称可聚焦 svg / Enter 后焦点保持」
- 治理检查：`check-task-packet`、`check-evidence --strict`、`check-review --strict`、
  `check-structure-contract --strict`、`check-ui-quality-gate`、`check-failure-registry --strict`
- 凭据检查：证据与探针输出不得出现数据库、Redis、JWT 凭据

## Linkage

- Task ID: `2026-10-26-login-accessibility-and-lang`
- Task Manifest: `.harness/tasks/2026-10-26-login-accessibility-and-lang/manifest.json`
- OpenSpec Change: none
- Superpowers Plan: none
- Plan References: `DESIGN.md`、`docs/harness/VERIFICATION_EVIDENCE_SPEC.md`
- Evidence Directory: `.harness/evidence/2026-10-26-login-accessibility-and-lang/`
- Review File: `.harness/evidence/2026-10-26-login-accessibility-and-lang/review.md`

## Evidence Required

- `tsc`、`eslint`、`vitest`（含两份新测试的计数与回退差分结果）真实输出。
- `check-password-toggle` 的 0 findings 输出与植入违规后的 rc=1 证明。
- `prebuild` 13 项静态检查逐项 rc=0。
- 五语言 `<html lang>` 的浏览器断言与登录页十档视口截图。
- 每个已迁移密码面的浏览器断言：字段数、命名按钮、无名称可聚焦 svg 计数、Enter 后焦点归属。
- 明确登记未能在浏览器打开的面与原因，而不是当作“没有问题”。
- 治理检查结果。
- 敏感信息扫描结果（探针只打印键名与长度，不打印值）。

## Human Gates

- 维护者最终视觉/功能验收（登录页样式与键盘流）。
- 若后续要提交，按 `repo-pr-gate` 决定是否需要额外证据（本轮触碰 i18n 与全站共享组件，属 L2）。

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
