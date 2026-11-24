# Review — depguard 边界规则包路径与实际 module 路径对齐

## 结论

`approved with documented P2 follow-up`。B-02 的配置缺陷已在唯一来源（Base）闭合，并用「探针包在修复前 0 issues、修复后 1 issue」证明规则由空转变为生效；回归测试锁定路径一致性。剩余 gap 是发布链路，不是代码。

## Findings

1. **P1 fixed — deny 路径永远匹配不到 import。**
   原三条 `pkg` 使用 `pantheon-base/modules/...`，而 Go module 是 `github.com/duanxldragon/pantheon-base/backend`，depguard 按导入前缀匹配，规则因此长期空转且无任何可见失败。改为完整前缀后，探针包立刻被拦下。

2. **P1 fixed — 缺一致性守卫。**
   即使这次改对，未来 module 改名或配置复制仍可能再次退化。新增 `tests/scripts/golangci-depguard-paths.test.mjs`：从 `backend/go.mod` 读 module、从 `backend/.golangci.yml` 读 deny 列表，断言前缀一致且覆盖 system/auth/platform；由既有 glob 自动进入 CI。

3. **纠正报告一处表述。**
   报告称边界检查「可能空转」。实际 `scripts/harness/check-boundaries.mjs` 用 `/backend/modules/system/` 等正则，在 quality.yml 中以 `--strict` 运行且当前 0 findings，边界门禁本身有效；空转的只是 depguard 这层纵深防御。结论应表述为「防御层缺口」，不是「门禁全盲」。

4. **P2 accepted-gap — 下游仍是旧副本。**
   Ops 的 `backend/.golangci.yml` 是重建时从 release 资产复制的，本次修复只有经正式 foundation release 才会到达 Ops。按 Base-first 规则不在下游手改，避免 drift。

5. **P2 accepted-gap — 无独立评审、config schema 未校验。**
   本机离线，`golangci-lint config verify` 需拉取 JSON schema，未能执行；候选上也未跑独立代码/架构评审。

## 验证要点

- 探针前后对比：`0 issues` → `1 depguard issue`（同一文件、同一命令）。
- 现有 business 全树：无 depguard 命中，仅 2 条既有 revive 告警 —— 说明此前的空转规则没有掩盖真实越界。
- 测试 RED→GREEN 均记录在 `commands.json`。

## Machine Readable

```json
{
  "taskId": "2026-11-24-golangci-depguard-boundary-paths",
  "reviewer": "primary agent self-review (no independent review on this candidate)",
  "verdict": "approved with documented P2 follow-up",
  "decision": "approved with documented P2 follow-up",
  "scope": "backend/.golangci.yml depguard business-boundary deny paths and a regression guard test",
  "taskManifest": ".harness/tasks/2026-11-24-golangci-depguard-boundary-paths/manifest.json",
  "evidenceDir": ".harness/evidence/2026-11-24-golangci-depguard-boundary-paths",
  "summaryFile": ".harness/evidence/2026-11-24-golangci-depguard-boundary-paths/summary.md",
  "reviewFile": ".harness/evidence/2026-11-24-golangci-depguard-boundary-paths/review.md",
  "changeRef": "none",
  "findings": [
    {
      "id": "B02-R1",
      "severity": "P1",
      "status": "fixed",
      "summary": "depguard deny prefixes could never match real import paths",
      "verification": "probe package: 0 issues before, 1 depguard issue after"
    },
    {
      "id": "B02-R2",
      "severity": "P1",
      "status": "fixed",
      "summary": "no guard against future prefix drift",
      "verification": "tests/scripts/golangci-depguard-paths.test.mjs 2/2 pass; failed before the fix"
    },
    {
      "id": "B02-R3",
      "severity": "P2",
      "status": "fixed",
      "summary": "review report overstated the impact: check-boundaries.mjs is an active gate",
      "verification": "check-boundaries.mjs --strict 0 findings with /backend/modules/ regexes"
    },
    {
      "id": "B02-R4",
      "severity": "P2",
      "status": "accepted-gap",
      "summary": "Ops still carries the stale config until a foundation release is published and consumed"
    },
    {
      "id": "B02-R5",
      "severity": "P2",
      "status": "accepted-gap",
      "summary": "no independent review; golangci config verify unavailable offline"
    }
  ],
  "verification": {
    "guard_test": "node --test tests/scripts/golangci-depguard-paths.test.mjs -> 2/2 pass (2/2 failed before the fix)",
    "probe": "golangci-lint run ./modules/business/zz_depguard_probe/... -> 0 issues before, 1 depguard issue after",
    "business_tree": "golangci-lint run ./modules/business/... -> no depguard findings, 2 pre-existing revive findings"
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-24-golangci-depguard-boundary-paths/manifest.json",
    "taskPacket": "docs/harness/tasks/2026-11-24-golangci-depguard-boundary-paths.task.md",
    "evidence": ".harness/evidence/2026-11-24-golangci-depguard-boundary-paths/commands.json",
    "reviewFile": ".harness/evidence/2026-11-24-golangci-depguard-boundary-paths/review.md",
    "changeRef": "none",
    "planRefs": []
  },
  "humanGate": "foundation release publication and downstream consumption need maintainer authorization"
}
```
