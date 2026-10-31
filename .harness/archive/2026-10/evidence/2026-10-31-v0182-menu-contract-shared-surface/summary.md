# Summary — 2026-10-31-v0182-menu-contract-shared-surface

## 这个包在做什么

把 `pantheon-base/main` 自 v0.18.1（`93505225`）以来的 9 个已合并提交打成 patch release
`pantheon-base-v0.18.2`（`release/0.18`），并在打包前补上一个登记缺口。

## 为什么现在必须发

v0.18.1 之后的 9 个提交都是修复，其中两个落在消费面：

| 提交 | 内容 | 是否在 `sharedPaths` |
| --- | --- | --- |
| `03e13d48` (#471) | `frontend/scripts/check-menu-contract.mjs`：解析内联 Go 常量、收紧裸标识符匹配、未解析引用报错 | **否**（本包补登记） |
| `e17eaaa1` (#477) | `backend/modules/business/retired_modules.go`：菜单过滤整条子句常量 | 是（`backend/modules` 目录） |

`#473` / `#474` / `#478` 是工作流与治理修复，`#472` / `#475` / `#476` 是合并回读，都不进共享面。

## 登记缺口是这次发布的主因

`pantheon-ops` 的前端 `prebuild` 直接调用 `frontend/scripts/check-menu-contract.mjs`，而它的副本与
base v0.18.1 的同名文件**逐字节相同**（diff 为空），与 base main 只差 #471 那次提交。也就是说：

- 消费仓一直在跑修复前的解析器；
- 由于该文件不在 `sharedPaths`，`rebuild:from-base` 永远不会把它换掉；
- 结果是 #471 的修复对消费仓**永久不可达**，除非有人在 ops 里手抄 base 文件——而 workspace 规则明确禁止。

因此本包把它登记为共享路径（frontend 46 → 47，总计 52 → 53），并同时加入
`scripts/foundation-release/frontend-ownership.mjs` 的 `requiredFrontendEntries`：后者在构建 manifest 时
校验“磁盘上存在但未声明”的条目，从此这个文件如果被从清单里删掉，会在构建期失败，而不是静默通过。

## 版本判定

`docs/VERSION_MANAGEMENT_GUIDE.md` §2.4 把 bug fix 与兼容性补丁列为 patch。本次没有新增消费能力、
没有架构波次、没有 schema/路由/权限/菜单键/i18n 键变化，只有传感器与门禁的修复，加上一次不改变行为
的子句内聚改写。因此 `0.18.2`，不是 minor。

## 共享面形态变化的过渡读数

共享项从 52 增到 53 会改变 lock 形态，但消费仓脚本不用改：`rebuild-from-base.mjs` 与
`check-shared-drift.mjs` 都从 lock 里读清单。可预期的过渡读数是：重建前 `check:shared-drift` 把
`check-menu-contract.mjs`（以及尚未收敛的 `retired_modules.go`）读成 modified；重建后回到
0 modified。这不是回归，是共享面扩大的必经窗口，已写进 `notes/consumer-impact.md`。

## 本地读数

- `node frontend/scripts/check-menu-contract.mjs` → `✅ manifest / menu seed 一致性检查通过（19 个菜单，23 条路由，102 个权限，23 个组件键）`
- `npm run test:menu-contract` → 10/10
- `node --test tests/scripts/foundation-release/*.test.mjs` → 57/57（fixture 首次因缺新条目失败，补的是 fixture 不是断言）
- `check-task-packet` / `check-failure-registry` / `check-structure` / `check-encoding` / `check-doc-inventory` / `check-task-packet-template` 全 PASS

## 发布读数（2026-10-31 追加）

- **prep PR**：#479 合入 `main`，`a44ae4e012fff20430b1b7f91cb7a9296f3ea843`；该 commit 上
  `Release Gate Summary` 为 success（`publish-foundation-release.mjs` 的前置条件）。
- **cut 运行**：`Foundation Release Cut` run 41152136695，`workflow_dispatch`，conclusion success，
  headSha `a44ae4e0`。第一次 dispatch（41148458266）按设计失败在 “tag does not exist”，
  因为 workflow 的 token 只有 `contents: read`；补建 annotated tag 后重跑通过。
- **tag**：`pantheon-base-v0.18.2`，annotated tag object `2e32bd465678e7259604ac2a16f4c8cb0e53308e`，
  peeled commit `a44ae4e0`。
- **GitHub Release**：target `a44ae4e0`，`published_at` `2026-10-31T00:48:38Z`，发布者
  `github-actions[bot]`，四件资产：
  - `foundation-release-pantheon-base-v0.18.2.tgz` 30,051,238 B，sha256 `c01ebbc1…2fc356a`
  - `foundation-release-pantheon-base-v0.18.2.tgz.sha256` sha256 `a87717ff…7ab01d779a3`
  - `repo.tar` 47,923,200 B，sha256 `c1360fb1…c37ecfc5d51`
  - `repo.tar.sha256` sha256 `32e0f32d…e7222f0d6f1f`
  - 说明：`created_at`（00:09:21Z）等于 tagger 时间，`published_at`（00:48:38Z）是 Publish 步骤
    运行时刻；两者由不同的写入口产生，此处只记录观测值。
- **资产校验**：`check:release-assets --release-version pantheon-base-v0.18.2` →
  `[ok] release pantheon-base-v0.18.2 carries all 4 required assets`。
- **Foundation Release Verify**：run 41153048213，conclusion success。该次为手动
  `workflow_dispatch`：release 由 `GITHUB_TOKEN` 发布，GitHub 不再为该 token 派发
  `release: published` 下游事件，因此 verify 不会自动出现（v0.18.0/v0.18.1 的 verify 由维护者
  发布触发）。同一 workflow、同一 tag，读数等价。

## 消费仓读数

`pantheon-ops` 的 v0.18.2 消费记录在 `pantheon-ops` 的任务包
`2026-10-31-foundation-upgrade-base-v0-18-2`，不在本文件重复。

## 一个工作树口径说明

`check:docs-frontmatter` 与 harness-docs 系列按 checkout 根解析 `../../pantheon-harness`；在
`.tmp/rel-0182` 里这个相对路径不存在，因此这些检查以主 checkout 与托管 PR 运行为准，不拿工作树的
噪声当作读数。
