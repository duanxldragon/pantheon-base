# Review — 2026-10-26 登录页第二轮微调、全站密码可见性切换与 `<html lang>` 收口

Reviewed against the working tree (nothing is committed). The diff is frontend only: one new shared
component plus its stylesheet, one new static checker, two new unit-test files, twelve migrated
call sites, `src/i18n/index.ts`, `index.html`, `frontend/package.json`,
`config/ui-quality-gate.json` with its test fixture, and the `DESIGN.md` §7.9 forbidden-pattern list.
No backend file, migration, route, permission code, menu seed or workflow is touched.

## Scope audit

- `grep -rn "Input\\.Password" frontend/src --include=*.tsx` returns two lines, both inside
  `frontend/src/components/patterns/forms/PasswordInput.tsx`, the owner file. Twelve call sites in
  nine files now import the shared component.
- `frontend/scripts/check-password-toggle.mjs` walks `frontend/src`, allows only the owner file, and
  honours a `password-toggle-allow:` single-line hatch; it is wired into `prebuild` between
  `check:ui-contract` and `check:search-toolbar-contract`, into
  `config/ui-quality-gate.json → enforcement.existingStaticChecks`, and into the fixture copy list of
  `tests/scripts/check-ui-quality-gate.test.mjs`. Missing any one of the three breaks the build, the
  gate policy test, or the ratchet.
- Dead `Input` bindings left behind by the sweep were removed (`SecondaryVerifyModal.tsx`,
  `SecurityCenter.tsx`), so `tsc` and `eslint --max-warnings 0` stay clean.
- Out-of-scope items stayed out: no forgot-password flow (the maintainer deferred it to
  administrator resets), no password-policy semantics, no backend change.

## Claim audit

| Claim | Evidence |
|---|---|
| Arco's own toggle cannot be named | `node_modules/@arco-design/web-react/es/Input/password.js` renders `IconEye/IconEyeInvisible` with `tabIndex: 0` and `aria-hidden: undefined`; `Input.Password` exposes no label prop. The escape hatch is `visibilityToggle={false}` + controlled `visibility` + `suffix`. |
| Focus is stolen without `stopPropagation` | `es/Input/input.js:153` sets `onClick: () => inputRef.current.focus()` on the inner wrapper. Removing that line from the shared component fails exactly one unit test — the focus-retention case — and the same behaviour is asserted in Chromium on every audited surface. |
| Every migrated field now exposes a named button | Chromium pass at 1440x900: login (1), user create (1), reset password (2), tenant create (1), setting upload (2), generator datasource (1), security centre (3), screen lock (1) — named `显示密码`, zero unnamed focusable `svg`, Enter keeps focus and flips the label to `隐藏密码`. |
| No raw `Input.Password` can come back | `node ./scripts/check-password-toggle.mjs` reports 0 findings across 254 files; a planted `src/__toggle_probe.tsx` produced 1 finding and rc=1, then was deleted. |
| `<html lang>` follows the locale | 14 browser assertions green for zh-CN, en-US, ja-JP, ko-KR, fr-FR, plus an unknown stored value falling back to `zh-CN`, plus a live switch without reload. Three unit tests cover `syncDocumentLang` and the `languageChanged` subscription; disabling either fails all three. |
| Login page still holds its layout | `node .tmp/login-visual-probe.cjs` green across ten viewports after the component swap: card centred within 0.5px, tools corner-pinned on desktop and in-flow on phones, no horizontal overflow. |
| Deep links are not the earlier failure | `.tmp/f08-deeplink-diag.cjs` shows `/system/tenant`, `/system/setting`, `/system/generator` keeping their URL and heading at 0.5s/1.5s/2.5s/6.5s. The FAILs came from probing before React painted, so the sweep now waits for rendered buttons. |
| This round's governance artifacts validate, the repo chain does not | `check-task-packet.mjs` (repo-wide), `check-structure-contract.mjs --strict`, `check-failure-registry.mjs --strict`, `check-ui-quality-gate.mjs`, `check-doc-frontmatter/links/inventory.mjs` and `check-sync-drift.mjs` each exit 0. `check-evidence.mjs --strict` exits 1 from 7 pre-2026-10-26 evidence directories and `check-review.mjs --strict` exits 1 from 24 historical `review.md` files; `git status` shows none of them modified by this round, and each 2026-10-26 file re-checked in isolation returns 0 errors / 0 warnings. |

## Findings

- **F-10 retracted (was P3).** `SecurityCenter` was reported unreachable because `/system/security`
  deep-links to the shell not-found view. That menu row is a navigation group with
  `component: ""`; the real entry is `/auth/security`, reached by `handleGoSecurity` in
  `frontend/src/core/layout/AppLayout.tsx`. The security centre renders three migrated password
  fields and all three assert green. No defect, no code change, and the earlier evidence statement
  is corrected here rather than left standing.
- **G-01 documented gap (P3, not a defect).** `SecondaryVerifyModal`'s toggle was not re-audited in
  this pass. Its prompt is raised client-side before a write (`handleSaveDatasource` calls
  `ensureOperationVerified()` after `validate()` and before the POST), and every trigger available in
  the local data set is disabled — all `下线会话` rows belong to the signed-in admin, and the
  generator datasource list is empty so no connection-test row exists. Forcing it open would have
  meant performing a real destructive write, which this round must not do. Mitigation already in
  place: the file is migrated, the shared component has five unit tests with a rollback differential,
  and the static gate forbids the raw control. The modal was observed open with one password field
  earlier in the round.
- **Environment limits (no code change).** The Arco `Dropdown` wrapping the user `Menu` does not open
  for a synthetic `.click()` in Chromium (`aria-expanded` stays `false`), so the locked shell view was
  reached through its own persistence switch (`sessionStorage pantheon_shell_locked=1` + reload) —
  the same rendered surface. The lang probe hangs in `browser.close()` after printing all assertions.
  Neither is a product defect.
- **Pre-existing debt, untouched.** `npm run format:check` still warns on files this round did not
  touch; only added/modified files were normalised.
- **G-02 documented gap (P3, not a defect of this round).** The repo-wide governance chain is not
  green: `check-evidence.mjs --strict` exits 1 from 7 evidence directories older than 2026-10-26
  (missing `knownGaps`, `linkage`, `runtimeSensitive`/`runtimeGap`) and `check-review.mjs --strict`
  exits 1 from 24 historical `review.md` files. Repairing them would rewrite other rounds' evidence,
  which is a separate explicitly-approved cleanup; recorded in `commands.json` as two `failed`
  commands plus a knownGap rather than silently dropped from the chain. The one historical-style
  defect this round did own — the missing `linkage` block in
  `.harness/evidence/2026-10-26-tenant-plan-assignment/commands.json` — was filled in and now passes.
  **Closed later the same day** by `.harness/evidence/2026-10-26-governance-evidence-schema-backfill/`,
  which backfilled all 31 errors structurally (no historical `commands[].status`, verdict or gap
  judgement rewritten) and registered the root cause — neither strict checker is referenced by any
  workflow — as `FR-016`.
  Neither checker is wired into `.github/workflows/`, and without `--strict`
  `check-evidence.mjs` exits 0.

## Verdict

Approved for the maintainer's visual/functional acceptance, with G-01 carried as a documented gap.
Nothing is committed; commit, push and PR wait for an explicit request.

## Machine Readable

```json
{
  "taskId": "2026-10-26-login-accessibility-and-lang",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "frontend/src/components/patterns/forms",
      "frontend/src/core/layout",
      "frontend/src/modules/auth/login",
      "frontend/src/modules/auth/security",
      "frontend/src/modules/system/iam",
      "frontend/src/modules/system/config/setting",
      "frontend/src/modules/lowcode/generator",
      "frontend/src/i18n"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "G-01 (P3, documented gap): SecondaryVerifyModal's toggle was not re-audited in the browser pass; every non-destructive trigger is disabled in the local data set.",
      "F-10 retracted: SecurityCenter is reachable at /auth/security and its three migrated fields assert green."
    ],
    "notes": "The change collapses twelve duplicated password controls into one leaf component under components/patterns/forms, which loses an import edge to Arco per consumer and gains one shared edge; no cycle is possible because the component imports nothing from the consuming modules. It is not a new hub: consumers keep their own module boundaries and the only added coupling is the i18n key pair auth.password.show / auth.password.hide. The sensitive-flow question is password disclosure: the toggle only flips the input type client-side, never logs or persists the value, and no credential is printed by any probe (they print key names and lengths only), so the confidentiality properties of the surrounding authentication flows are unchanged."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-26-login-accessibility-and-lang/manifest.json",
    "evidence": ".harness/evidence/2026-10-26-login-accessibility-and-lang/commands.json",
    "reviewFile": ".harness/evidence/2026-10-26-login-accessibility-and-lang/review.md",
    "changeRef": "none",
    "planRefs": [
      "DESIGN.md",
      "docs/harness/VERIFICATION_EVIDENCE_SPEC.md"
    ]
  }
}
```
