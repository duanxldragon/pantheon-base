# 四主题视觉基线 — 维护者最终视觉验收（触点③）

- **状态**: ✅ 已通过（2026-09-24，维护者在触点③ 经会话给出结论：通过）
- **关联**: task `2026-09-24-fix-report-residual-closeout` · fix-report §四.4 · manifest `humanGates[4]`（final visual acceptance of four-theme baselines — maintainer touchpoint ③）
- **发出日期**: 2026-09-24

## 验收对象

4 张登录页主题基线快照，位于 `frontend/tests/visual/theme-baseline.spec.ts-snapshots/`：

| 文件 | 主题 | 预期 |
| --- | --- | --- |
| `login-theme-indigo-win32.png` | indigo（默认） | 靛蓝主色系 |
| `login-theme-emerald-win32.png` | emerald | 翠绿主色系 |
| `login-theme-violet-win32.png` | violet | 紫色主色系 |
| `login-theme-slate-win32.png` | slate | 石板灰蓝主色系 |

生成方式：`frontend/tests/visual/theme-baseline.spec.ts`，4 个 `@theme:*` 用例仅在
`desktop-light` 项目（1440×900, light, Chromium）各执行一次；启动前通过
localStorage `pantheon_theme` 注入主题并断言 `html[data-pantheon-theme]` 已生效，
中文 locale priming 后对 `.auth-login-page` 截图。比较阈值
`maxDiffPixelRatio: 0.01`、`animations: disabled`（`playwright.visual.config.ts`）。

## 验收方式（任选其一）

1. 打开联系表：`.harness/evidence/2026-09-24-fix-report-residual-closeout/artifacts/visual-acceptance.html`（本次已推送打开）；
2. 直接查看 snapshots 目录中的 4 张 PNG；
3. 复跑基线（vite 由 config 自管，无需后端）：
   `cd frontend && ./node_modules/.bin/playwright test -c playwright.visual.config.ts tests/visual/theme-baseline.spec.ts`
   → 预期 4 passed、0 mismatch（2026-09-24 已做过一次稳定性复跑：4 passed）。

## 通过标准

- [x] 四张图分别呈现 indigo / emerald / violet / slate 主题主色系，整体（按钮、链接、focus 态、卡片）无混色残留 —— 仍见默认主题色即为不通过
- [x] 登录卡片、背景与输入框 focus 边框随主题一致变化
- [x] 中文文案与布局在四主题间无非预期差异
- [x] 复跑 0 mismatch（基线确定性；2026-09-24 稳定性复跑 4 passed）

## 已知边界（记录于 evidence knownGaps，不阻塞验收）

- 快照带 `win32` 平台后缀；非 Windows 平台复跑需 `--update-snapshots` 重建本平台基线（与既有 login 基线同机制）。
- 覆盖面为登录页 × 4 主题；其余页面沿用既有 `visual-baseline.spec.ts`（login light/mobile/dark + dashboard + system-user-list）。
- 深色/移动端项目对该 spec 的 4 个用例不匹配（无 `@dark`/`@mobile` 标签），属设计内行为。

## 签核

| 项 | 值 |
| --- | --- |
| 验收人 | 维护者（经 Freebuff 会话在触点③ 给出结论） |
| 日期 | 2026-09-24 |
| 结论 | ☑ 通过　☐ 有条件通过　☐ 打回 |
| 备注 | 无异议，四条通过标准全数确认 |

> 结论一经给出即回填本表、更新 task manifest `humanGates` 与 `review.md`
> 的 Machine Readable 段（residualRisks 中对应条目同步销项）。
