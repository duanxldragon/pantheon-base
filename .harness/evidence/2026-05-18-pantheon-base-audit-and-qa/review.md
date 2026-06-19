# Review: 2026-05-18-pantheon-base-audit-and-qa

## Machine Readable

```json
{
  "taskId": "2026-05-18-pantheon-base-audit-and-qa",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "shared list page -> form action handler -> smoke/visual contract"
    ],
    "checks": [
      "hub",
      "call-depth"
    ],
    "findings": [],
    "notes": "Historical review was upgraded with machine-readable linkage without changing the original findings."
  },
  "linkage": {
    "evidence": ".harness/evidence/2026-05-18-pantheon-base-audit-and-qa/commands.json",
    "reviewFile": ".harness/evidence/2026-05-18-pantheon-base-audit-and-qa/review.md",
    "changeRef": "none",
    "planRefs": [],
    "taskManifest": ".harness/tasks/2026-05-18-pantheon-base-audit-and-qa/manifest.json"
  }
}
```

## Findings

1. `frontend/tests/smoke/system/system-workspace-task-depth.ts`
   用户详情 smoke 原先把详情页角色展示硬编码为 `roleKey`，与当前页面按 `roleNames` 优先展示的实现不一致，已修正为优先断言 `roleNames`。

2. `frontend/src/modules/system/*`
   多个系统页表单提交在 Arco 校验外继续 `throw error`，会把已提示过的请求失败再次抛成未处理 Promise rejection，污染 Vite dev console。已在主要系统页提交流程中改为本地收口。

3. `frontend/tests/smoke/platform/shell-visual-contract.spec.ts`
   shell visual contract 中有几条断言依赖了过于脆弱的内部 DOM 包装推断，导致 `/system/role` filter rhythm 与 `/system/i18n` focus-ring 验证漂移。已把采样改成与当前共享壳层结构一致的直接 CSS/可见性断言，相关用例现已通过。

4. `frontend/src/modules/auth/*` 与 `frontend/src/modules/system/audit/OperationLogList.tsx`
   治理/审计页的清理、撤销、批量删除动作在失败路径下仍会把请求错误继续冒泡到 dev console。已补充本地收口，剩余噪音主要收敛为浏览器 `ResizeObserver` 开发期警告。

## Assumptions

- 本次验收以当前本机 MySQL/Redis 与 Playwright 本地 smoke 环境为准。
- `module-governance-host-real` 的 skip 视为环境/专项流未执行，不计入失败。

## Status

- Functional acceptance: passed
- Build and test baseline: passed
- Governance and API smoke: passed / host-real skip only
- Visual contract acceptance: passed
- Overall: complete

## Recommended Next Step

- 如果要继续降噪，下一步最值的是单独处理开发态 `ResizeObserver loop completed with undelivered notifications`，但它当前不阻塞功能验收和 smoke 通过。
