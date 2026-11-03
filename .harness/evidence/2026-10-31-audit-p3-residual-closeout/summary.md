# Summary — 2026-10-31-audit-p3-residual-closeout

programme 收口时留开三条 P3：AUD-021、AUD-025、AUD-028。本包把三条各自做完。

判据统一为：**改完之后，同样的门禁能挡住这类回退，且这条判据被负向验证过。**
“代码变了”不算收口，“测试变绿”也不算——四条锁各自都有一次人为制造的红。

---

## AUD-021：退役的 FilterPanel 还能被碰到

### 审计看到的现象与真正的原因不是一回事

审计写的是“`templates/listTemplate.ts:36` 仍 import `FilterPanel`”，并给了两条处置：
切 `SearchToolbar`，或保留并写明设计意图。按字面做，就是删一行 import。

但删之前先问了一句“这行为什么还在”，答案把问题整个换掉了：

- `frontend/src/modules/lowcode/templates/` 自 **#120**（`fix(frontend): resolve lowcode module
  TypeScript and build errors`）起就被 `tsconfig.app.json:31` **exclude**——也就是说，当初它是因为
  **编译不过**才被移出构建的，不是因为有过渡计划。
- 全仓对它**零 import**。目录内部 `index.ts` 只 import 同目录的 `detailTemplate_clean.txt?raw`，
  闭成一个孤岛。它既进不了 `tsc -b`，也进不了 `vite build`。
- 但 `check-search-toolbar-contract.mjs` 用 `EXEMPT_SEGMENTS` 把这个目录**整目录豁免**了，
  理由写在注释里：「组件保留给 lowcode 模板过渡」。

三件事叠起来的后果：一个不参与构建、没人引用的目录，靠一句“过渡期”换到了门禁的永久放行，
于是里面的退役组件永远不会被清掉；而审计读代码时看到它，只能读成“生成页仍在使用 FilterPanel”。

**所以只删 import 是错的修法**——豁免还在，下一次照样能加回去，而且加回去不会有任何读数变化。

### 改法

1. 删掉 `listTemplate.ts:36`、`index.ts:139` 的死 import（各一行，diff 里就是这两行）。
2. **删掉 `EXEMPT_SEGMENTS` 以及引用它的 filter 条件**，模板目录回到普通被检对象。
   被检文件从 102 → 106（多出的 4 个正是 `templates/*.ts`）。
3. 补两条锁，因为两者守的不是同一件事：
   - `check-search-toolbar-contract` 第 10 条：**模板目录不再是豁免区**（守仓库源码）。
   - `generator-quality-contract` 第 14 条：**生成器产物用 `SearchToolbar`、不含 `FilterPanel`**（守产物）。
     缺任何一条都会留缝：只守产物，模板被改脏没人管；只守源码，生成器把组件拼进产物没人管。

### 读数

| 方向 | 读数 |
| --- | --- |
| 门禁负向（塞回 FilterPanel） | `1 finding(s)` / `no-filter-panel` / exit 1 |
| 门禁正向 | `0 finding(s) across 106 module file(s)` |
| 第 10 条负向（恢复豁免） | `not ok 10`，`# fail 1` |
| 第 10 条正向 | `# pass 10` |
| 第 14 条负向（拼进生成器） | `not ok 14`，`# fail 1` |
| 第 14 条正向 | `# pass 14` |

### 没做的那一半，以及为什么

`templates/` 目录本身**没有删**，尽管它是 1,894 行 / 5 文件、不参与构建、零 import 的死代码。
理由是范围：删 1,894 行和删一行 import 不是一个量级的决定，前者需要单独确认（尤其要确认下游
有没有同名副本被引用）。已核对 `pantheon-ops`：只有 `.foundation/releases/*/bundle/shared-frontend/`
历史快照里有同名文件，活动代码不引用，所以将来删是安全的——但那是另一个决定，登记为 `AUD-021b`。

顺带修掉一处文案漂移：`check-search-toolbar-contract.mjs` 的文档指针与错误文案原本都写
`DESIGN.md §7.2`，而仓库里已没有这个文件（现为 `docs/frontend/DESIGN_ENGINEERING_GUIDE.md §8.1`
与 `UI_PATTERN_LIBRARY.md`）。既然本来就要改这个脚本，就一并改正——留一个“去找一个不存在的
文档”的指针，正是这次审计要治的那类漂移。它原本被登记为残留 `AUD-021c`，修掉之后不再计入残留。

---

## AUD-025：`Active` 没有复核时效

### 为什么这件事值得做

`Active` 的含义是“当前正式生效”，所以它同时是一句**关于现在**的断言。断言会过期。
在此之前，一份 2026-04 的 `Active` 文档和一份昨天的 `Active` 文档在元数据上完全等价，
下一位读者没有任何办法区分。

### 规则

写进 `DOCUMENT_METADATA_AND_STATUS` §6.5（中英双版）：

- `updated_at` 超过 **90 天**未更新 → **复核逾期**。
- 逾期**不等于失效**，也不自动降级；它表示“不能仅凭 `status: Active` 就相信它”。
  处置二选一：复核后重写 `updated_at`，或降为 `Draft` / `Superseded`。
- 复核不是改日期。只把 `updated_at` 推到今天、内容一字未读，比逾期更糟——它把“没人看过”
  伪装成“刚看过”。

### 为什么故意不做成 error

这是本包唯一一个“看起来该拦却没拦”的决定，所以理由要写清楚：

当前 144 份逾期。如果做成 error，唯一可行的过门方式是**批量改 `updated_at`**——
而这恰好摧毁这条规则想保护的东西（真实复核）。门禁一旦可以被机械满足，它就不再度量任何东西。
所以判据是**可见**，不是**变绿**：输出份数、提供 `--report-overdue` 明细、把规则写进契约，
让“有没有人真的读过”这件事在评审时被看见。

### 读数与口径更正

| 项 | 值 |
| --- | --- |
| 逾期份数 | **144** |
| 其中 `.en.md` 镜像 | 71（中文正文 73） |
| 最老 | 198 天（`docs/designs/BACKEND.md` / `.en.md`，`updated_at` 2026-04-17） |
| 门禁结果 | 通过，exit 0 |

审计报告 §11 写的是“102 份 Active 文档 >60 天未更新”。本包实测是 90 天窗口下的 144 份，
两者口径不同（窗口不同、统计对象可能也不同），**本次未复现审计口径**。
已在 §6.5 里写明以实测为准，避免下一位维护者把差异读成回归。

### 锁

`tests/docs/frontmatter-check.test.mjs` 第 14 条：fixture 造两份 `Active`（200 天 / 5 天），
断言 `ok === true` 且 `activeReviewOverdue` 只含 200 天那份。负向：把
`activeReviewOverdue.length === 0` 加进 `ok` 判定 → 立刻 `not ok 14`。

> 这条锁在写的过程中先红了一次，原因值得记：fixture 用了 `doc_type: Design`，
> 而 `Design` 在 `DOC_TYPES_REQUIRING_CONTRACTS` 里，于是两份文档因为**缺 `linked_contracts`**
> 而变红——和 90 天窗口毫无关系。如果不看 `errors` 直接放宽断言，这条锁会变成一条
> “永远绿、永远证明不了什么”的假锁。修法是给 fixture 补一份可解析的 Contract 文档。

---

## AUD-028：一个什么都没约束的 timeout

`main.go` 原来是：

```go
_, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
tp, err := telemetry.InitTracer("pantheon-base", otlpEndpoint)
```

`InitTracer` **不收 context**。所以这个 `WithTimeout` 约束不到任何东西：
`ctx` 被 `_` 丢掉，`cancel` 只在函数返回时触发——它给了一个“这里有时限”的错觉，
实际一行代码都没被它限住。

改法是删掉它，并**在原地写清楚为什么不设**：

```go
// No init timeout here: telemetry.InitTracer does not take a context, so a
// `_, cancel := context.WithTimeout(...)` would bound nothing — the value is
// discarded and cancel only fires when this function returns. The timeout
// that matters is on shutdown (below), where tp.Shutdown does accept a ctx.
tp, err := telemetry.InitTracer("pantheon-base", otlpEndpoint)
```

注释解释的是“为什么这里不需要”，不是“我删了什么”。否则下一位维护者会好心加回来。
`context` 包仍被 shutdown 段（`:81` / `:194` / `:219`）使用，import 未动。

这是删除类改动，没有行为可红，因此没有负向读数；以 `go build` / `go vet` / `gofmt -l` 三清代替。

---

## 三条合起来说明的一件事

三条 P3 各自看都很小，但都指向同一个模式：**“登记为 gap”和“处置掉”之间隔着一次判断**。

- AUD-021 的 gap 不是那行 import，是那行 import 赖以存在的豁免；
- AUD-025 的 gap 不是“缺一条规则”，是“缺一种让人看见的方式”；
- AUD-028 的 gap 不是少一个 `cancel`，是多了一个看起来在做事、其实什么都没做的语句。

三处都不是靠“把测试改绿”能收口的，所以每条都留了一次人为制造的红。
