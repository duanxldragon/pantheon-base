# Review — 2026-10-31-v0182-menu-contract-shared-surface

## 评审立场

本包是发布包，不是功能包。评审要回答三个问题：发出的东西是不是 `main` 已经验证过的东西；共享面
变化是不是登记修复而不是扩大共享范围；发布级别与边界有没有被老实记录。

## 逐条 posture 读数

1. **产物来源** — `git log pantheon-base-v0.18.1..origin/main` 为 9 个提交，`git diff --name-status`
   在 `backend/`、`frontend/`、`pkg/` 下只有两个文件。本包没有重写任何产品源码；`frontend/src/**`
   不在 diff 里。
2. **共享面登记的依据** — `pantheon-ops/frontend/scripts/check-menu-contract.mjs` 与
   `git show pantheon-base-v0.18.1:frontend/scripts/check-menu-contract.mjs` 的 diff 为空，与
   `origin/main` 的副本只差 #471。消费仓 `frontend/package.json` 的 `prebuild` 直接执行该文件。
   结论：这是“消费仓已经在执行、但从未被声明共享”的文件，登记属于修复枚举而不是新增共享面。
3. **防回归** — `frontend-ownership.mjs` 的 `requiredFrontendEntries` 在构建 manifest 时校验“存在
   但未声明”的路径。把新条目加进去后，未来从 `sharedPaths` 删除会失败在构建期。该守卫没有新增传感器，
   只是把已有守卫的覆盖补齐。
4. **测试口径** — `cut-foundation-release.test.mjs` 的 fixture 首次运行报
   `shared path is missing: frontend/scripts/check-menu-contract.mjs`。处理方式是给 fixture 补上该文件
   并同步 `manifest.sharedPaths.frontend` 的期望，而不是放宽断言。57/57 通过。
5. **版本级别** — §2.4 patch：修复类变更，无新增消费能力、无架构波次、无 schema/路由/权限/菜单键/
   i18n 键变化。`0.18.2` / `release/0.18`。
6. **共享面形态变化** — 52 → 53 写进了发布说明、升级说明与消费面影响三份文本；消费仓脚本不改，
   因为 `rebuild-from-base.mjs` 与 `check-shared-drift.mjs` 都从 lock 读清单。过渡读数（重建前 2 个
   modified、重建后 0）在 `notes/consumer-impact.md` 里写明，不当作意外。
7. **边界** — diff 不含 `.github/workflows/**`、门禁阈值、必需检查集合、`package.json`、
   `sonar-project.properties`、`.foundation/**`。`frontend/scripts/**` 只出现在清单文本里，
   文件内容本身未改。
8. **遗留风险** — 发布与消费读数尚未产生，`commands.json` 与 summary 都显式标注“后续追加”，
   不把未发生的事写成已完成。
9. **工作树口径** — `check:docs-frontmatter` / harness-docs 按 checkout 根解析
   `../../pantheon-harness`，在 `.tmp/rel-0182` 下不可达；这两个检查以主 checkout 与托管 PR 为准。
   不影响本次变更的判定，但读者需要知道读数来源。
10. **归档时序** — 本包按 `.harness/ARCHIVE.md` 留在 live 树，发布与消费读数落定后再用 `git mv`
    归档；manifest 的 linkage 路径不改写。

## 结论

发布内容就是 `main` 已验证的内容，加一处有字节证据支持的共享面登记修复。建议批准；发布后的门禁与
消费读数按承诺追加，若其中任一读数不成立，本评审结论随之失效。

## Machine Readable

```json
{
  "taskId": "2026-10-31-v0182-menu-contract-shared-surface",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "scripts/foundation-release/build-release-manifest.mjs",
      "scripts/foundation-release/frontend-ownership.mjs",
      "docs/release-notes/RELEASE_NOTES_v0.18.2.md",
      ".harness/STATUS.md",
      "VERSION",
      "CHANGELOG.md"
    ],
    "checks": ["cycle", "hub"],
    "findings": [],
    "notes": "No product source is touched. The only executable change is the shared-path enumeration and its manifest-build guard; the release texts and the .harness section describe it. The follow-up is the post-merge publication and consumer reading, which cannot exist before the prep PR merges."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-31-v0182-menu-contract-shared-surface/manifest.json",
    "evidence": ".harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/commands.json",
    "reviewFile": ".harness/evidence/2026-10-31-v0182-menu-contract-shared-surface/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/VERSION_MANAGEMENT_GUIDE.md",
      "docs/designs/FOUNDATION_RELEASE_MODEL.md"
    ]
  }
}
```
