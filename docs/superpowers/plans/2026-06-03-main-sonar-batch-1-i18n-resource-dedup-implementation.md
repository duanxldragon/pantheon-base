# Main Sonar Batch 1 I18n Resource Dedup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Sonar duplication in `frontend/src/i18n/resources/**` without changing runtime fallback semantics or shrinking Sonar scope.

**Architecture:** Keep `zh-CN` as the only full built-in dictionary. Convert non-base locale files to derived resources that rebuild full maps from the `zh-CN` key order plus locale-specific values, then keep `overrides/` and `generated/` as the only extra ownership layers. Update script-side resource loaders so repo-local audits can evaluate imported helper modules and derived locale files exactly like the app runtime does.

**Tech Stack:** TypeScript locale resources, Node.js audit scripts, VM-based module loading, npm/node test runner

---

### Task 1: Lock script compatibility first

**Files:**
- Create: `tests/scripts/check-i18n-generated-scope.test.mjs`
- Modify: `frontend/scripts/check-i18n-generated-scope.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('loadResourceModule resolves default imports used by derived locale files', () => {
  const fixture = createFixture();
  writeFileSync(
    path.join(fixture.resourcesRoot, 'zh-CN.ts'),
    "const zhCNFallback = { a: '中文', b: '控制台' };\nexport default zhCNFallback;\n",
    'utf8',
  );
  writeFileSync(
    path.join(fixture.resourcesRoot, 'ja-JP.ts'),
    "import zhCNFallback from './zh-CN';\nconst jaJPFallback = { ...zhCNFallback, a: '日本語', b: 'ダッシュボード' };\nexport default jaJPFallback;\n",
    'utf8',
  );

  const resource = loadResourceModule(path.join(fixture.resourcesRoot, 'ja-JP.ts'));
  assert.deepEqual(resource, { a: '日本語', b: 'ダッシュボード' });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/scripts/check-i18n-generated-scope.test.mjs`
Expected: FAIL because `check-i18n-generated-scope.mjs` cannot currently evaluate imported locale modules.

- [ ] **Step 3: Write minimal implementation**

```js
function loadResourceModule(modulePath, cache = new Map()) {
  const resolvedPath = path.resolve(modulePath);
  if (cache.has(resolvedPath)) return cache.get(resolvedPath);

  const source = fs.readFileSync(resolvedPath, 'utf8');
  const importMatches = [...source.matchAll(/import\s+([A-Za-z0-9_$]+)\s+from\s+['"](.+?)['"];?/g)];
  const importedBindings = {};

  for (const [, localName, specifier] of importMatches) {
    importedBindings[localName] = loadResourceModule(
      path.resolve(path.dirname(resolvedPath), `${specifier}.ts`),
      cache,
    );
  }

  const sanitized = source
    .replace(/import\s+[A-Za-z0-9_$]+\s+from\s+['"].+?['"];?\s*/g, '')
    .replace(/export default\s+([A-Za-z0-9_$]+);?\s*$/m, 'module.exports = $1;');

  const context = { module: { exports: {} }, exports: {}, ...importedBindings };
  vm.runInNewContext(sanitized, context, { filename: resolvedPath });
  cache.set(resolvedPath, context.module.exports);
  return context.module.exports;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/scripts/check-i18n-generated-scope.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/scripts/check-i18n-generated-scope.test.mjs frontend/scripts/check-i18n-generated-scope.mjs
git commit -m "test(i18n): cover derived locale loader support"
```

### Task 2: Rebuild non-base locales from the base key order

**Files:**
- Create: `frontend/src/i18n/resources/locale-utils.ts`
- Modify: `frontend/src/i18n/resources/en-US.ts`
- Modify: `frontend/src/i18n/resources/fr-FR.ts`
- Modify: `frontend/src/i18n/resources/ja-JP.ts`
- Modify: `frontend/src/i18n/resources/ko-KR.ts`
- Modify: `frontend/src/i18n/resources/zh-CN.ts`

- [ ] **Step 1: Write the failing test**

```js
test('derived locale helper rebuilds a full resource map from base keys and locale values', () => {
  const base = { a: '中文', b: '平台', c: '通知' };
  const resource = buildDerivedLocale(base, ['English', 'Platform', 'Notifications']);
  assert.deepEqual(resource, {
    a: 'English',
    b: 'Platform',
    c: 'Notifications',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/scripts/check-i18n-generated-scope.test.mjs`
Expected: FAIL because `buildDerivedLocale` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type FallbackResourceMap = Record<string, string>;

export function buildDerivedLocale(
  base: FallbackResourceMap,
  translatedValues: readonly string[],
): FallbackResourceMap {
  const keys = Object.keys(base);
  if (keys.length !== translatedValues.length) {
    throw new Error(`Locale values length mismatch: expected ${keys.length}, got ${translatedValues.length}`);
  }
  return Object.fromEntries(keys.map((key, index) => [key, translatedValues[index]]));
}
```

- [ ] **Step 4: Refactor locale files to use the helper**

```ts
import zhCNFallback from './zh-CN';
import { buildDerivedLocale } from './locale-utils';

const enUSFallback = buildDerivedLocale(zhCNFallback, [
  'Pantheon Base',
  'Empowering Enterprise Digitalization',
  'Pantheon Platform · Enterprise Admin Foundation',
]);

export default enUSFallback;
```

- [ ] **Step 5: Run targeted verification**

Run:
- `cd frontend && npm run build`
- `node frontend/scripts/audit-i18n-locales.mjs`

Expected:
- build PASS
- audit PASS with no missing or empty keys

- [ ] **Step 6: Commit**

```bash
git add frontend/src/i18n/resources/locale-utils.ts frontend/src/i18n/resources/en-US.ts frontend/src/i18n/resources/fr-FR.ts frontend/src/i18n/resources/ja-JP.ts frontend/src/i18n/resources/ko-KR.ts frontend/src/i18n/resources/zh-CN.ts
git commit -m "refactor(i18n): derive locale resources from base key order"
```

### Task 3: Close governance and evidence

**Files:**
- Modify: `frontend/scripts/audit-i18n-locales.mjs`
- Modify: `frontend/scripts/report-system-i18n-audit.mjs`
- Modify: `docs/designs/I18N_MODULE_DESIGN.md`
- Modify: `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/summary.md`
- Modify: `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/commands.json`
- Modify: `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/review.md`

- [ ] **Step 1: Update docs for the ownership split**

```md
- `zh-CN` is the only complete built-in fallback dictionary.
- other built-in locales are derived from the `zh-CN` key order and must preserve one-to-one key coverage.
- `resources/generated/*.ts` remains reserved for schema-generated keys only.
- `resources/overrides/*.ts` remains reserved for manual exceptions and late corrections.
```

- [ ] **Step 2: Run verification commands**

Run:
- `node frontend/scripts/check-i18n-generated-scope.mjs`
- `node frontend/scripts/report-system-i18n-audit.mjs`
- `npm run check:duplication -- --json`
- `node scripts/run-sonar-remediation.mjs --task 2026-06-03-main-sonar-remediation --group baseline --execute`

Expected:
- all commands PASS
- duplication output shows the locale cluster no longer dominating with repeated full-object literals

- [ ] **Step 3: Update evidence**

```md
## Commands
- capture before/after duplication snapshots for locale files
- record script outputs proving audits still pass

## Review
- explain why key ownership is now base-only plus derived values
- note any remaining Sonar debt outside locale resources
```

- [ ] **Step 4: Commit**

```bash
git add frontend/scripts/audit-i18n-locales.mjs frontend/scripts/report-system-i18n-audit.mjs docs/designs/I18N_MODULE_DESIGN.md .harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/summary.md .harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/commands.json .harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/review.md
git commit -m "docs(i18n): record locale ownership and batch-1 evidence"
```
