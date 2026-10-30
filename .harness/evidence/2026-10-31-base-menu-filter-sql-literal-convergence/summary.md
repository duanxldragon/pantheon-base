# Evidence Summary — 2026-10-31-base-menu-filter-sql-literal-convergence

## 一句话

ops 为满足自家 `check-gorm-sql-literal.mjs` 而把继承文件里的 GORM 菜单过滤条件常量化，
底座没有这条门禁、文件仍是列名拼接形式，于是 ops 的 `check:shared-drift` 报
`DRIFT_MODIFIED backend/modules/business/retired_modules.go` 并 FAIL。本包把这条安全收紧
回流到底座（Base-first），两侧该文件逐字节相同，drift 在源头消除，白名单一行未动。

## drift 是怎么产生的

1. ops PR #156（关闭 SonarCloud 漏洞/缺陷）为通过 ops 独有门禁
   `scripts/check-gorm-sql-literal.mjs`，把 `retired_modules.go` 的两处
   `query.Where/Or(column + " IN ?", values)` 改成整句子句常量。
2. 该文件是底座拥有、消费者逐字节继承的共享文件（在 sharedPaths 里），不在
   business-overlay 的 ops 自有文件集合内（161 个被跳过，不含它）。
3. 底座的同名文件没变——`git diff 93505225..base HEAD` 对该文件为空，即不是底座移动。
   于是比对结果从「相同」变成「消费者单方面修改」→ `DRIFT_MODIFIED` → FAIL。
   这条 FAIL 会在每周 `Base Compatibility Rebuild` 的
   「Check shared-file drift against base HEAD」一步同样出现（该步直接对 base HEAD 取
   `git show` 的字节哈希）。

## 三条可选出路，为什么选这一条

| 出路 | 效果 | 判断 |
|------|------|------|
| 在 ops 的 `.foundation/allowed-drift.json` 登记这条偏差 | 门禁立刻绿 | 语义是「这里允许与底座不同」。把一条 SQL 安全收紧登记成允许的偏差，等于给下一次真正的偏差提供先例；且这条白名单是共享配置，改动需要维护者明确指名授权（本次尝试被拦下，因此未改）。 |
| 回退 ops PR #156 的形式 | drift 消失 | 会让 ops 自己的 `check:gorm-sql-literal` 重新报 2 条违规，把已经关掉的安全面 reopen，方向错误。 |
| **把形式回流到底座（本包）** | drift 在源头消失，底座同时获得这条不变式 | 符合 workspace 规则「共享问题先在 pantheon-base 修，再经 foundation release 同步」。落地后两侧字节相同，消费者无需为吸收它再改一次，也不依赖新发布。 |

## 行为等价的论证（不是断言，是读数）

改动前后三个调用点构造的 SQL 文本逐条相同：

| 字段 | 改动前 | 改动后 |
|------|--------|--------|
| module | `column + " IN ?"`，column=`"module"` | 常量 `"module IN ?"` |
| path | 同上，column=`"path"` | 常量 `"path IN ?"` |
| component | 同上，column=`"component"` | 常量 `"component IN ?"` |

取值一律仍通过 `?` 绑定；`applyMenuFieldFilter` 是包内私有函数，全仓除本文件三个调用点
外无其它引用（`grep -rn applyMenuFieldFilter backend/` 只命中本文件），改签名不外溢。

## 关键读数（详见 commands.json）

- 收敛前 ops shared-drift：`FAIL … 1 modified`（唯一 DRIFT_MODIFIED 即本文件）
- 收敛前形式在 ops 检查器下：`retired_modules.go:172 Or()`、`:174 Where()`
  → **2 GORM SQL-literal violation(s)**
- 收敛后形式在同一检查器下：**0 条违规**（两行 `waived` 是检查器对既有 allow 标记行的正常声明）
- 收敛后 ops shared-drift：`OK … 812 shared files identical to base, 10 allowlisted drift,
  161 business-overlay files skipped`（白名单 10 条与收敛前完全同一批）
- 底座侧：`go vet ./...` 与 `go build ./...` 干净；`go test -count=1 ./...` **47 包 ok / 0 FAIL**；
  `gofmt -l` 空；提交 `c335e5b9` 为 `1 file changed, 17 insertions(+), 7 deletions(-)`

## 一个必须写下来的机制事实

`check-shared-drift.mjs` 取的是 `git -C <base> show HEAD:<path>`，不看工作树。所以在底座
只是 `cp` 而未提交时，消费者的读数仍是 FAIL——这解释了同一次收敛里的两个读数差，也说明
「字节相同」的判定发生在提交层。

## 未做的事（显式缺口）

- 本机 `-race` 跑不起来：`CGO_ENABLED=1 go test -race -count=1 ./...` 在多个包上以
  ThreadSanitizer 分配失败（error code 87）告终，是 Windows/cygwin 的 TSan 运行时限制，
  与被改代码无关。用无 `-race` 全量测试 + CI 的 race 作业覆盖，不假装跑过。
- 底座没有这条检查器：把 `check-gorm-sql-literal.mjs` 引入底座 CI 要动 `package.json` 与
  `.github/workflows/*`（高风险范围、需两位批准），留维护者决定。在那之前底座的这条
  不变式由评审与本 evidence 维持。
- 因此底座文件里那句「`scripts/check-gorm-sql-literal.mjs` 断言这一不变式」在本仓暂时是
  悬空引用。它是字节对齐的刻意代价，不是笔误。
- 不切 foundation release、不动 `VERSION`/`CHANGELOG`：发布不可逆，时点归维护者。
- weekly `Base Compatibility Rebuild` 最近两次 schedule（10-19、10-26）失败在
  `Compile rebuilt backend`，属收敛前 ops 树未对齐 v0.18.1 时期的问题；本包不声称该作业
  已转绿，下一次周一 08:57 的 schedule 读数需回读。
- 工作树中既有的 6 个未提交 i18n 文件不属于本包，未 stage、未背书。
