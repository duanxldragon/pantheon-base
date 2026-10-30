# Evidence Summary — `2026-10-30-menu-contract-inline-const`

## What was broken

`frontend/scripts/check-menu-contract.mjs` cross-checks the frontend menu manifest, routes,
permission keys and i18n seeds against the backend Go seed files. Go seed entries may reference
package-level string constants instead of repeating a literal — the shape the SonarCloud `go:S1192`
de-duplication pushes you toward — so the parser builds a per-package constant table.

That table had one seam and the parser turned it into silence:

1. `goConstTable()` matched only `const ( name = "value" )` block entries. A single-line
   `const name = "value"` (with or without an explicit type) never entered the table, because the
   `const` keyword occupied the identifier capture group.
2. `extractField()` returned `''` for an identifier it could not resolve — byte-for-byte the same
   answer it gives for a field that is simply absent.
3. For menu seeds the retention test is `path || pagePerm || perms`. An unresolved `Path` therefore
   did not produce a wrong value; it produced a **seed that no longer exists**, silently removed
   from the checked set.

The consequence was measured, not argued. With a correct backend menu whose seed referenced an inline
constant, the HEAD sensor said:

```
❌ 后端缺少菜单 seed: /system/login-log (frontend/src/modules/auth/index.ts)
```

i.e. it told the reader the *backend* was missing a seed that was present and correct. The same
sensor, after the repair, resolves the reference and passes: `19 个菜单，23 条路由，102 个权限，
23 个组件键`.

This is exactly how `pantheon-ops` met the seam: during its S1192 wave it had to move a seed
constant back into a `const ( … )` block to get past this gate, and recorded the generic defect as
residual risk ⑥ with the disposition 「通用修复按 Base-first 回 base（任务 #38）」.

## What changed

- `collectGoConsts(source, table)` — collects both declaration shapes, tolerating an explicit type
  and a trailing line comment. It stays a *declaration* collector: `var x = "…"` and `k := "…"` are
  not constants and there are unit assertions pinning that, so the widened table costs no pollution.
- `constReference(block, fieldName)` — only a **bare** identifier counts as a constant reference.
  `item.Key`, `strings.ToLower(x)` and `menuKey(i)` are expressions no constant table can resolve;
  the lookahead `(?![\w.[(])` excludes them.
- `recordUnresolvedConstRefs(block, fieldNames, scope)` / `takeUnresolvedGoConstRefs()` — an
  unresolvable bare reference on a seed the parser actually keeps becomes a named finding:
  `后端 seed 引用了无法解析的常量: Path: probeUndeclaredConst (…login_menu.go)`, emitted **first**
  in the error list, because the resolution failure is the cause and the downstream
  `后端缺少菜单 seed` is the effect.
- The three seed loops register findings only for blocks they retain. The two i18n loops widen that
  to "locale/group matched" — otherwise the finding would be gated on `&& key`, i.e. the defect
  would decide whether it gets reported.
- Seams are exported and `main()` runs behind the `pathToFileURL` direct-execution guard, so
  `tests/scripts/check-menu-contract.test.mjs` (10 cases) can import them; the file is inside the
  `test:scripts` glob already wired into `ci.yml`, and `test:menu-contract` is added as an alias.

## Why the first iteration was wrong

The first version reported every unresolvable identifier and produced 4 findings from Go code that
merely *looks* like a seed block, e.g. `backend/modules/system/i18n/i18n_seed.go:94`
`result[i18nLocaleKey{Locale: item.Locale, Key: item.Key}]`. Both narrowing rules — bare identifier,
retained block — came from that measurement. A sensor fix that manufactures false findings is not a
fix, so the noise was made visible in `commands.json` rather than quietly iterated away.

## Readings

| Reading | Result |
| --- | --- |
| `node --test tests/scripts/check-menu-contract.test.mjs` | 10/10 pass |
| `npm run test:scripts` | 181 tests, 181 pass, 0 fail |
| `cd frontend && npm run check:menu-contract` (base tree, unchanged seeds) | exit 0 — 19 / 23 / 102 / 23 |
| inline-const seed × HEAD sensor | exit 1 — `后端缺少菜单 seed: /system/login-log` |
| inline-const seed × repaired sensor | exit 0 — same 19 / 23 / 102 / 23 |
| undeclared identifier seed × repaired sensor | exit 1 — `后端 seed 引用了无法解析的常量: Path: probeUndeclaredConst (…)` first, consequence second |
| control fixture cleanup | seed file restored, `git status` clean for it |
| governance matrix (task-packet, docs-frontmatter, harness-docs, inventory, encoding, structure, adoption, failure-registry, generated, generated-modules, ui-quality-gate, duplication, evidence, review) | 0 findings on this package's files |

Full command-by-command record: `commands.json` (16 entries).

## Inheritance position

The repair lives in the foundation source. `pantheon-ops` carries a byte-identical copy of this
sensor, and the only sanctioned route for the fix to reach it is a foundation release — so the
consumer keeps the pre-fix behaviour until one is cut. This package does not bump `VERSION`, does not
write `CHANGELOG.md` or release notes, and does not publish anything: a tag and its assets cannot be
recalled, which makes the release moment a maintainer decision, not an agent step.

`ops`' `const ( … )`-block workaround stays as-is and stays legal — both shapes are collected now,
so absorbing this fix requires no business-seed edit in the consumer.

## What did not change

No seed, menu manifest, route, permission key, i18n resource, backend file, workflow, gate rule,
`NOSONAR`/`//nolint`/`eslint-disable`, threshold or exclusion. Nothing was silenced to make a number
green: the gate went from "1 misattributed red" to "green" by resolving the reference, and from
"silent empty value" to "named finding" by adding the error, with both directions measured.

## Gaps

- Consumer absorption waits on a patch release (maintainer-gated timing).
- The sensor is still a source-regex parser, not a Go AST consumer: `iota`, `fmt.Sprintf`, and
  cross-package qualified constants remain unresolvable — but now fail loudly instead of silently.
- The pre-existing uncommitted i18n files in the working tree are outside this package and were not
  staged; `check:harness-adoption`'s two remaining findings belong to them.

## Post-merge

Merged into `main` as `03e13d48` (PR #471, squash, branch deleted) after 36/37 checks green with the two
expected skips. The repaired sensor reaches CI without any workflow change — `ci.yml` runs
`npm run test:scripts` (which globs `tests/scripts/check-menu-contract.test.mjs`) and `quality.yml` runs the
sensor itself. `Release Gate` is red on that commit for 6 pre-existing `githubactions:` findings in the
workflow YAML; see `review.md` → Post-merge record. Consumer absorption still waits on a patch foundation
release, which this package deliberately did not cut.

