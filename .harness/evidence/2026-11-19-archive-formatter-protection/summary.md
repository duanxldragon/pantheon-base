# Evidence summary

The Base source fix uses the standard root `.prettierignore` to preserve all
historical task/evidence and preservation snapshots under `.harness/archive/`.
Two isolated regression tests passed without skips: explicit Prettier writes
preserve archived Markdown/JSON, and the normal lint-staged package configuration
preserves archive worktree/index bytes while still formatting active Markdown.
The same test first demonstrates the original defect without protection.

A separate Ops fixture retained the exact original SHA for all nine recovered
historical files. Current Ops originals and foundation lock remained unchanged.
This is a source/fixture validation, not formal release consumption. Ops still
uses v0.18.9 and remains unprotected by default until a formal Base upgrade.

Independent code review is COMMENT (0 findings), architecture CLEAR. Both lanes
returned source bindings. The reviewer additionally ran ordinary and adversarial
Git-environment regressions, each 2 PASS/0 SKIP; the real Git index stayed unchanged.
See [independent synthesis](./review.md); final scoped governance is recorded separately. Existing Ops
whole-repository governance debt, the two original EOF whitespace findings and
all ten business-package acceptances remain open. Product source did not change;
no product test or new UI/production evidence is claimed.

See [regression result](./formatter-regression.json), [commands](./commands.json),
[task plan](../../tasks/2026-11-19-archive-formatter-protection/plan.md) and the
[Ops nine-file fixture](../../../../pantheon-ops/.harness/evidence/2026-11-17-ops-history-audit/continuation-history-formatter-20261119-recovered-nine.json).

Final scoped [governance checks](./governance-final.json) passed; the initial missing
review linkage and task-layer field failure remain recorded. [Final source binding](./source-binding-final.json) confirms unchanged formatter/test/rules; the task
checklist and exact platform field have only metadata closeout changes.
