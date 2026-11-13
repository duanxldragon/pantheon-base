# O4 Generator locale follow-up — local verified handoff

Completed the bounded Base-owned locale projection: exactly two entries added to each of `zh-CN`, `en-US`, `fr-FR`, `ja-JP`, and `ko-KR`. All existing editor/dashboard/locale source is preserved byte-for-byte after removing these ten inserted lines. No renderer, backend, generator source/tests, canonical docs/parent ledgers, tools, locks, publication or model changes were made.

Parent packet: `docs/harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps.task.md`; parent implementation: `resume-o4-generator-summary.md`; root finding: `resume-o4-generator-rendered-root-check.md`. Profile: L2, shared generator resource projection / i18n / ui-runtime. Implementer: bounded Generator executor. Review perspective: UX/QA through impeccable and mechanical resource checks; independent review and the final human gate remain root-owned. Minimum complexity: reuse surrounding flat resource entries and the owner's real ModuleWizard fixture runner. No DDL/index/security/permission/menu behavior changes.

## Exact resource projection

The real ModuleWizard calls `t('generator.wizard.templateVersion.v2', 'v2 · Tenant flat CRUD')` and `t('generator.wizard.dataScopeMode.tenant', 'Tenant')`. The default `translation` namespace uses the full flat `generator.wizard.*` keys. `initI18n` merges base, override and generated resource exports, then remote resources. No alternative prefix or fallback architecture was introduced.

| Locale | `generator.wizard.templateVersion.v2` | `generator.wizard.dataScopeMode.tenant` |
| ------ | ------------------------------------- | --------------------------------------- |
| zh-CN  | v2 · 租户平面 CRUD                    | 租户                                    |
| en-US  | v2 · Tenant flat CRUD                 | Tenant                                  |
| fr-FR  | v2 · CRUD à plat par locataire        | Locataire                               |
| ja-JP  | v2 · テナント向けフラット CRUD        | テナント                                |
| ko-KR  | v2 · 테넌트 단일 테이블 CRUD          | 테넌트                                  |

Exact source SHA256, including pre-existing edits and current line endings:

| Resource | SHA256                                                             |
| -------- | ------------------------------------------------------------------ |
| zh-CN.ts | `ec5209452d96f28f9274e8f6e22036f455e4aa922fb49269fa0064a9245ec3c3` |
| en-US.ts | `9f05f789bf5b45bedca91840583f53e8e33e57f829254f6285e63cb10386d714` |
| fr-FR.ts | `bab6d557a8548324dca7411354d7311c104408628f6d7ed60f2c1f8368878c75` |
| ja-JP.ts | `823be80faa337e51c66a1bc848c87dc33714af7d5a46098f662a06905970c180` |
| ko-KR.ts | `23061dac93219ebbd29cfc9aec2b2f0d714868c892f9e0e33e55cb2fc772ccef` |

## Fresh focused verification

All successful commands below exited 0. Root owns the final full-source builds/pairing; this lane ran focused resource diagnostics and compilation evidence.

From Base root:

```powershell
node .harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-generator-locales-v1/coverage.mjs
node --check .harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-generator-locales-v1/visual-v3.mjs
node .harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-generator-locales-v1/visual-v3.mjs
git diff --check -- frontend/src/i18n/resources/zh-CN.ts frontend/src/i18n/resources/en-US.ts frontend/src/i18n/resources/fr-FR.ts frontend/src/i18n/resources/ja-JP.ts frontend/src/i18n/resources/ko-KR.ts
node .harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/resume-o4-generator-locales-v1/finalize.mjs
```

From `frontend`:

```powershell
node node_modules/eslint/bin/eslint.js src/i18n/resources/zh-CN.ts src/i18n/resources/en-US.ts src/i18n/resources/fr-FR.ts src/i18n/resources/ja-JP.ts src/i18n/resources/ko-KR.ts
npm run check:i18n-hardcode
npm run check:i18n-generated-scope
```

`coverage.mjs` checks 5 × 2 exact exported keys, one source occurrence each, and preservation of all prior source. Its TypeScript program uses parsed `frontend/tsconfig.app.json` compiler options with the five owned locale files and their imports, noEmit, no incremental output, and no ambient application types: **0 diagnostics**. The fixture separately uses Vite SSR to compile real locale exports, including runtime-fixes imports and applicable override/generated merges. All ten compiled projection values equal the exact expected resource values.

## Rendered evidence and fixture boundary

New ignored evidence directory: [resume-o4-generator-locales-v1](./resume-o4-generator-locales-v1/). Source/log/screenshot hashes and exact commands are in [manifest.json](./resume-o4-generator-locales-v1/manifest.json), with lookup details and API read paths in [visual-receipt-v3.json](./resume-o4-generator-locales-v1/visual-receipt-v3.json).

The new harness adapts the owner's `resume-o4-generator-visual.mjs`; original source, screenshots and receipts are retained. Real ModuleWizard and renderer source remained unchanged before/after the run (SHA256 `5d847baac42b7a6639ed3dd7e4fd99bf7fd0d42ac7f8b4d52eb24596fd115b48`). No new product UI was substituted.

The original fixture returned `data: []` for every API. The new isolated fixture returns the Vite-compiled actual locale projection for **GET `/api/v1/system/i18n/pack?locale=zh-CN`**. Browser automation normally suppresses this read; only the ignored fixture context overrides `navigator.webdriver` to exercise it. All requests are intercepted: external requests and non-GET actions abort and are recorded as violations. No private auth configuration, real login, backend credentials or write actions are used. This proves local rendering and resource resolution, **not actual server acceptance**.

Each case verifies `getResource('zh-CN', 'translation', key)` and `t(key, {defaultValue: '__MISSING_RESOURCE__', returnDetails: true})`: resource and result match the Chinese source; `usedLng=zh-CN`, `usedNS=translation`. Cases cover v2/tenant selection, tenant retained when DataScope is disabled, v1 reset/disabled control, Enter opening the actual listbox, Escape closing it, ArrowUp/Enter selecting custom, ArrowDown/Enter restoring tenant, and Tab advancing focus. **4/4 cases passed, 0 console/page/HTTP errors, 0 external/write violations, horizontal overflow 0**.

Impeccable completion review: inspected these final renders, with visible focus rings in both themes. The existing calm Arco form remains three columns on desktop and one column on mobile. Chinese labels are readable; no observed overlap/clipping. Recorded control rectangles also show no overlap and remain within viewport width.

| Viewport / theme | Selected screenshot                                                                             | Focus screenshot                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1440×900 light   | [desktop-light-selected-v3.png](./resume-o4-generator-locales-v1/desktop-light-selected-v3.png) | [desktop-light-focused-v3.png](./resume-o4-generator-locales-v1/desktop-light-focused-v3.png) |
| 1440×900 dark    | [desktop-dark-selected-v3.png](./resume-o4-generator-locales-v1/desktop-dark-selected-v3.png)   | [desktop-dark-focused-v3.png](./resume-o4-generator-locales-v1/desktop-dark-focused-v3.png)   |
| 390×844 light    | [mobile-light-selected-v3.png](./resume-o4-generator-locales-v1/mobile-light-selected-v3.png)   | [mobile-light-focused-v3.png](./resume-o4-generator-locales-v1/mobile-light-focused-v3.png)   |
| 390×844 dark     | [mobile-dark-selected-v3.png](./resume-o4-generator-locales-v1/mobile-dark-selected-v3.png)     | [mobile-dark-focused-v3.png](./resume-o4-generator-locales-v1/mobile-dark-focused-v3.png)     |

Local attempt history is retained: v1 rendered successfully with weaker keyboard assertions; v2's stricter fixture failed because an unscoped listbox locator matched two animated popups; v3 uses the combobox's actual `aria-controls` and passes all state transitions. That fixture correction changed only new ignored evidence. No root failures were overwritten.

## Closeout limits

This locale follow-up is locally complete. Other locales were compiled/coverage-checked, not visually reviewed. Untouched loading/error/forbidden/submitting, generation/registration/write paths are not exercised. Root owns full-source builds, independent CODE/ARCH review, candidate/consumer pairing, publication and all remote/human acceptance. No acceptance, parent ledger, release, consumer lock or approval status was changed.
