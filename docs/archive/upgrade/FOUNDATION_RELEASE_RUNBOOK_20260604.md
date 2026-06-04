---
title: Foundation Release 执行 Runbook（2026-06-04）
doc_type: Design
layer: platform
status: Active
index_group: archive/upgrade
retention_reason: 作为底座 release metadata、bundle 生成与 consumer upgrade 的首版执行 SOP 保留
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-04
---

# Foundation Release 执行 Runbook（2026-06-04）

English version: [FOUNDATION_RELEASE_RUNBOOK_20260604.en.md](./FOUNDATION_RELEASE_RUNBOOK_20260604.en.md)

本文定义 `pantheon-base` 如何切出一个可供 `pantheon-ops` 消费的 foundation release，并说明 `pantheon-ops` 应如何消费它。

## 1. 发布侧产物

一次 foundation release 会生成两层产物：

1. `releases/<version>/`
2. `dist/foundation-releases/<version>/`

前者用于长期留档、review 和审计，后者用于脚本消费和本地升级演练。

## 2. 在 `pantheon-base` 切 release

最小命令：

```powershell
node scripts/foundation-release/cut-foundation-release.mjs `
  --release-version base-v0.8.0 `
  --release-line release/0.8 `
  --base-commit <40-char-commit> `
  --release-notes "shared foundation release" `
  --upgrade-notes "rerun inheritance checks in ops" `
  --consumer-impact "ops should review backend drift"
```

或使用 package script：

```powershell
npm run release:foundation:cut -- `
  --release-version base-v0.8.0 `
  --release-line release/0.8 `
  --base-commit <40-char-commit> `
  --release-notes "shared foundation release" `
  --upgrade-notes "rerun inheritance checks in ops" `
  --consumer-impact "ops should review backend drift"
```

## 3. 在 `pantheon-ops` 消费 release

规划模式：

```powershell
node scripts/foundation-release/consume-foundation-release.mjs `
  --manifest <bundle-root>\manifest.json `
  --bundle <bundle-root> `
  --check
```

应用模式：

```powershell
node scripts/foundation-release/consume-foundation-release.mjs `
  --manifest <bundle-root>\manifest.json `
  --bundle <bundle-root> `
  --apply-shared-backend `
  --update-inheritance-docs `
  --check
```

## 4. 升级后检查

消费侧至少复核：

1. `docs/PROJECT_INHERITANCE.md` 中的 release line / base version 是否更新
2. `npm run check:inheritance` 是否通过
3. `npm run check:base-sync:backend` 是否通过
4. 是否只修复真实业务 overlay 断点，而不是继续扩大共享漂移
