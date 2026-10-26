# 登录页无障碍收尾：F-08 全站密码切换 + F-09 `<html lang>` 跟随语言

日期：2026-10-26 · 仓库：pantheon-base · 分层：L2（触碰 i18n、共享组件、门禁规则）

## 背景

第二轮登录页微调收口时登记的两位编号缺陷：

- **F-08 · P2** — F-07 只修了登录页。`Input.Password` 在 `frontend/src` 共 12 处，其余 11 处仍渲染 Arco 自带的可聚焦 `svg` 眼形切换：`tabIndex: 0`、无 `aria-label`、且 Arco 没给任何补名称的入口（`node_modules/@arco-design/web-react/es/Input/password.js`）。屏幕阅读器读到一个没有名字的焦点点。
- **F-09 · P3** — `frontend/index.html:2` 硬编码 `lang="en"`，全仓没有任何同步代码，导致 `<html lang>` 与实际界面语言长期不一致（中文界面被念成英文发音规则）。

## 改动

### 共享组件

新增 `frontend/src/components/patterns/forms/PasswordInput.tsx` + `password-input.css`：`visibilityToggle={false}` 关掉 Arco 的 svg，用受控 `visibility` + `suffix` 塞一个真 `<button type="button" aria-label>`，图标沿用 Arco 约定（可见=`IconEye`，隐藏=`IconEyeInvisible`），并在 `onClick` 里 `stopPropagation()`。

`stopPropagation` 不是洁癖：`es/Input/input.js:153` 的外层 wrapper 在 `onClick` 里执行 `inputRef.current.focus()`，任何冒泡上来的点击都会把焦点抢回输入框，键盘用户按一次 Enter 之后就再也按不到第二个开关。这条契约由单元测试直接锁住。

i18n 新增 `auth.password.show` / `auth.password.hide`，五种语言齐全。

### 12 处替换

登录页 + codemod 扫过 8 个文件共 11 处：`SecondaryVerifyModal`、`AppLayout`（锁屏解锁框）、`SecurityCenter`（旧/新/确认 3 处）、`DatasourceManagerModal`、`SettingGroupForm`、`TenantList`、`ResetPasswordModal`（2 处）、`UserFormModal`。两处替换后 `Input` 绑定成为死引用，已删除。

`grep -rn "Input.Password" frontend/src/` 现在只剩组件自身两行。

### 语言同步

`src/i18n/index.ts` 新增 `syncDocumentLang()`：`initI18n` 末尾写一次，并在模块作用域订阅 `i18n.on('languageChanged', …)`——全仓只有 `switchI18nLanguage` 会调 `changeLanguage`，但这个订阅保证任何来源的切换都同步。值走 `normalizeLocale`，未知语言不会写进属性。
`index.html` 加了一段 pre-paint 脚本，在 bundle 之前按 `pantheon_lang` 定好 `lang`，静态默认值从 `en` 改成底座回退语言 `zh-CN`。

### 门禁（ratchet）

新增 `frontend/scripts/check-password-toggle.mjs`：`src/**/*.{ts,tsx}` 里出现 `Input.Password` 即红灯（豁免用行内 `password-toggle-allow: <原因>`）。已挂进 `frontend/package.json` 的 `prebuild` 链，登记进 `config/ui-quality-gate.json` 的 `enforcement.existingStaticChecks`，并同步了 `tests/scripts/check-ui-quality-gate.test.mjs` 的 fixture 复制清单（否则门禁自检会因文件缺失而红）。DESIGN.md §7.9 禁止清单补了一条并写明执行脚本。

## 验证

- `tsc -b` rc=0；`eslint src --max-warnings 0` rc=0。
- 新增 8 条单元测试，全部做过回退差分自证：删 `stopPropagation` 只让焦点那条变红（activeElement 变成 `<input>`）；删 `aria-label` 5 条全红；停掉 `documentElement.lang` 写入与 `languageChanged` 订阅，语言 3 条全红。
- 全量单测 34 文件 / 230 用例通过。
- prebuild 链 13 个检查逐个 rc=0（Git Bash 无 npm，逐脚本回放）；新 checker 对植入的违规样例返回 1 条 finding / rc=1，删除后回到 0。
- `node --test tests/scripts/check-ui-quality-gate.test.mjs` 3 通过。
- 治理：`check-task-packet.mjs`（全仓）、`check-structure-contract.mjs --strict`、`check-failure-registry.mjs --strict`、
  `check-ui-quality-gate.mjs`、`check-doc-frontmatter/links/inventory`、`check-sync-drift` 逐个 rc=0；
  `check-evidence.mjs --strict` 与 `check-review.mjs --strict` 各 rc=1，红灯全部落在历史目录，本轮两个 2026-10-26 目录单跑均 0 error / 0 warning（详见缺口 5）。
- 浏览器（Playwright，本机 :5173 + :8080）：
  - 五种语言分别启动后 `document.documentElement.lang` 全部正确；`pantheon_lang=de-DE` 回退 `zh-CN`；登录页语言下拉从中文切到 English，无需刷新即变 `en-US` 并落库。
  - 登录页与用户管理的新增/重置密码弹窗：命名按钮 `显示密码`/`隐藏密码`，页面上 `svg[tabindex="0"]` 无名元素为 0，Enter 激活后焦点留在按钮上且可重复切换。
  - 登录页 10 视口视觉断言复跑全绿（组件替换没有改动卡片几何）。

### 逐面浏览器复验（补测）

先把探针的等待改对：`.tmp/f08-deeplink-diag.cjs` 证明 `/system/tenant`、`/system/setting`、`/system/generator`
深链在 0.5s / 1.5s / 2.5s / 6.5s 都保持 URL 且渲染出标题，之前的 FAIL 是探针在 React 首屏前查 DOM，不是应用重定向缺陷。
改成一等 `button` 出现再断言后，同一个会话内跑完整合流（`.tmp/f08-final-sweep.cjs`：22 项，19 PASS、3 显式 SKIP、0 FAIL），
其余面分别由 `.tmp/f08-sweep2.cjs`、`.tmp/f08-sweep3.cjs`、`.tmp/f08-rest.cjs`、`.tmp/f08-lock-only.cjs` 覆盖：

| 面 | 路径 / 打开方式 | 密码框 | 结果 |
|---|---|---|---|
| 登录卡片 | `/login` | 1 | 命名按钮 ×1、无名 svg 0、Enter 焦点保持 |
| 新增用户 | `/system/user` → 新增 | 1 | 同上 |
| 重置密码 | `/system/user` → 行内重置密码 | 2 | 命名按钮 ×2、同上 |
| 新增租户 | `/system/tenant` → 新增 | 1 | 同上 |
| 系统设置加密项 | `/system/setting/upload` | 2 | 命名按钮 ×2、同上；其余 7 个分组无加密项，记 SKIP 不记通过 |
| 生成器数据源 | `/system/generator` → 来源切「从数据库表导入」→ 数据源管理 | 1 | 同上（切换是 `Select` 不是 Radio，先前假设错了） |
| 安全中心 | `/auth/security` | 3 | 命名按钮 ×3、无名 svg 0、Enter 焦点保持 |
| 锁屏解锁 | `sessionStorage pantheon_shell_locked=1` + 刷新 | 1 | 同上 |

F-10 撤销：安全中心并非不可达。菜单行 `/system/security` 是 `component: ""` 的分组，真正入口是
`AppLayout.tsx` 的 `handleGoSecurity` 指向 `/auth/security`；先前用错了 URL 才得到「返回首页」。无缺陷、无代码改动。

## 未覆盖 / 显式缺口

1. `SecondaryVerifyModal` 的切换按钮本轮未在浏览器再断言。二次验证弹窗是在写请求之前由前端拉起的
   （`handleSaveDatasource` 先 `validate()` 再 `ensureOperationVerified()` 才 POST），而本地数据里能触发它的入口全是禁用态：
   会话页 `下线会话` 每行都属于当前 admin（自己不能下线自己），生成器数据源列表为空所以没有「测试连接」行。
   再往下只能靠真做一次破坏性写，本轮不允许。兜底：该文件已迁到共享组件、组件有 5 条带回退差分的单测、静态门禁禁止裸用；
   本轮早些时候也观测到该弹窗打开且含 1 个密码框。
2. 锁屏没有走「点头像 → 菜单项」这条交互路径：Chromium 里 Arco `Dropdown` 包 `Menu` 对合成 `.click()` 不展开
   （`aria-expanded` 保持 `false`）。改为用它自身的持久化开关（sessionStorage）复验同一个渲染面。
3. `index.html` 的语言清单与 `SUPPORTED_LOCALES` 重复一份；漏改只影响首帧，初始化订阅会纠正，未为此引入构建期模板。
4. 截图落在 `frontend/.tmp/login-shots/`，该目录被 gitignore，属本轮验收工件而非入库证据资产。
5. 仓库级治理链没有全绿，且不是本轮造成的：`node scripts/harness/check-evidence.mjs --strict` 退出码 1，来自 7 个早于 2026-10-26 的
   evidence 目录（缺 `knownGaps` / `linkage` / `runtimeSensitive` 字段）；`check-review.mjs --strict` 退出码 1，来自 24 个历史 `review.md`。
   这些文件在工作区里均未被本轮改动；本轮两个 2026-10-26 目录（`2026-10-26-tenant-plan-assignment` 也补上了 `linkage` 块）单独跑都是
   0 error / 0 warning。`check-evidence.mjs` 不带 `--strict` 时退出码 0，且 `.github/workflows/` 里搜不到该脚本（未接入 CI）。
   修历史红是另一件事，需要显式授权。
   **后续（同日）**：维护者授权后由 `.harness/evidence/2026-10-26-governance-evidence-schema-backfill/` 收口，
   31 条历史 strict 错误全部归零（两个 checker 均 rc=0 / 0 error），且只做结构回填；根因（两个 strict checker 未接入任何 workflow）
   登记为 `FR-016`，是否接入 CI 留给维护者决定。
6. 未 commit / push / 开 PR（无请求）。
