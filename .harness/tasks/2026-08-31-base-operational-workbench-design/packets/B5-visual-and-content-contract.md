# B5 Visual Regression And Content Contract

- Priority: `P0-P1`
- Layer: `platform`
- Status: `implemented`
- Depends On: none
- Blocks: all Base/consumer UI completion claims

## Outcome

把当前单桌面、少页面的视觉基线扩展为可阻止移动端、状态、暗色和长文案回归的门禁，并固化高风险操作文案合同。

## In Scope

- visual matrix：页面 x 视口 x 状态 x 主题。
- 最小视口 `1440x900`、`390x844`，核心页覆盖 light/dark。
- loading、empty、error、forbidden；运行态追加 stale/partial failure。
- 文案 lint/review 规则：对象、动作、风险、结果、恢复方式。
- 键盘/焦点、200% 缩放、reduced motion 和长中英文的交互断言。

## Out Of Scope

- 不用截图替代功能、权限或运行态测试。
- 不追求所有页面全排列截图。
- 不因基线更新掩盖真实回归。

## Expected Files

- `config/ui-quality-gate.json`
- `scripts/harness/check-ui-quality-gate.mjs`
- `tests/scripts/check-ui-quality-gate.test.mjs`
- `package.json`
- `.github/workflows/quality.yml`
- `tests/scripts/quality-workflow.test.mjs`
- `frontend/playwright.visual.config.ts`
- `frontend/tests/visual/visual-baseline.spec.ts`
- `frontend/tests/visual/visual-baseline.spec.ts-snapshots/login-mobile-win32.png`
- `frontend/tests/visual/visual-baseline.spec.ts-snapshots/login-dark-win32.png`
- 后续 UI 实现按需扩展状态 fixture 和截图库存。

## Baseline Selection

- 页面：登录、Dashboard、标准列表、长表单、详情/步骤、日志/Diff fixture。
- 状态：default + 每类页面最危险的 2-4 个状态。
- 数据：固定、脱敏、时区和时间稳定；不依赖真实外部服务。
- 阈值：优先消除动画/时间/字体不稳定，不先扩大像素容差。

## Acceptance

1. 移动端导航、工具栏、表格/卡片、sticky footer 无遮挡。
2. error/forbidden 不能与 empty 混淆；stale/partial failure 有非颜色语义。
3. 长中英文、200% 缩放和暗色主题无截断、重叠或不可读对比度。
4. 每次基线变更带 before/after、原因和 reviewer 结论。
5. 高风险文案明确对象数量、范围、不可逆性和恢复动作。

## Evidence And Verification

- Playwright visual + interaction suite，记录浏览器、viewport、theme 和 fixture。
- axe/等效可访问性检查与键盘路径。
- screenshot inventory 和像素差报告。
- `npm run type-check`、visual command、docs/link checks、`git diff --check`。

## Gates

- 大面积基线变化、对比度例外、隐藏错误状态或移除移动端路径时停止。
- 最终视觉接受只能由维护者基于实际渲染证据完成。

## Implementation Result

- 三层门禁已经落地：机器可读政策、严格 CI 检查、现有 rendered evidence 检查与维护者 gate。
- visual suite 已增加 `desktop-light`、`mobile-light`、`desktop-dark` 项目，并保留既有桌面基线路径。
- 从 `2026-08-31` 起，UI task manifest 必须声明完整视觉计划或满足严格条件的治理豁免。
- 本 packet 没有修改生产 UI，因此没有生成截图；这不是未来 UI 实现的通用豁免。
