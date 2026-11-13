# Smoke Sanity trace diagnosis — final main ae2fa81d9903d63b4bec8f01d61082f48a999e2f

Scope: read-only diagnosis of Code Quality Gates run 43377206553, Smoke Sanity job 131728309093. No repository edits, branches, PRs, runtime service changes, or fixture cleanup performed. Root coordinator owns implementation/release selection.

## Result

High-confidence cause: test-helper API argument error plus a transient DOM detachment. This is a reproducible smoke-helper race, not an unknown empty-state message or an application/API failure. A rerun can pass under a different timing, but retains the identified defect. The root-selected correction is `evaluate(fn, undefined, { timeout: 2000 })` in the helper; it lets the existing `toPass` recover after the empty state detaches.

## Evidence

- `pantheon-base/frontend/tests/smoke/system/system-pages-helpers.ts:775` passes `{ timeout: 2000 }` as the SECOND argument to `Locator.evaluate`. The callback ignores its second argument.
- Installed `pantheon-base/node_modules/playwright-core/types/types.d.ts:14365`: `evaluate<R, Arg, E extends SVGElement | HTMLElement = SVGElement | HTMLElement>(pageFunction: PageFunctionOn<E, Arg, R>, arg?: Arg, options?: { timeout?: number, signal?: AbortSignal, exposeFunctions?: boolean }): Promise<R>`.
- Installed `pantheon-base/node_modules/playwright-core/lib/coreBundle.js:59868`: `async evaluate(pageFunction, arg2, options)`; line 59869 uses `options?.timeout`; `_withElement` lines 59823–59827 resolves that timeout and waits for selector state `attached`.
- Local inspected package is Playwright 1.64.1; hosted trace metadata explicitly identifies Playwright 1.65.0. The hosted traces prove the same unbounded wait behavior. No claim of matching local/hosted installed versions is made.
- `git blame` attributes helper lines 765–769 and 775–777 to commit `2338d108a`, release v0.18.7 remediation PR #505, 2026-11-12. Thus the defect predates final main's governance-only delta.
- Hosted source embedded in every trace (`src/1f24cf6c0e69f5e1502b51b09b60ed7cefa325bd.ts:775`) contains the same misplaced argument.
- Every failure has one `isVisible` returning true, followed by one `Evaluate`/Frame.waitForSelector(state=attached) without a result. `test.trace` subsequently reports `locator.evaluate: Test ended` and `waiting for locator('.arco-empty').first()`, with the stack at helper line 775. No `emptyText` value or `toBeTruthy` false result is recorded: the line 778 message assertion was never reached.
- All three recorded list requests return HTTP 200, payload code 200, ten items, and totals 31/32/41. Their network durations are 22.395/20.702/12.688 ms. Final error-context snapshots show populated log tables and pagination.
- Backend corroboration at `ci509/_temp/pantheon-backend.log:17064`, `:17321`, and `:17695`: failed login attempts and operation attempt list calls all 200, 17.42/18.26/7.02 ms. `:17892` records successful operation retry list 200, 8.67 ms. Targeted scan found no panic, connection refusal, deadlock, `[ERROR]`, or `[error]` markers.
- Literal scan of `frontend/tests` and `frontend/scripts` for evaluate calls with timeout objects found only this helper occurrence. This is a bounded similar-pattern scan, not a claim of comprehensive AST validation.

## Exact trace entries

| Artifact suffix  | Browser `1-trace.trace` entries                          | `test.trace` entries                       | Network entry                               |
| ---------------- | -------------------------------------------------------- | ------------------------------------------ | ------------------------------------------- |
| login-log        | 74 visibility start, 80 true, 89 evaluate waits attached | 54/55 test timeout; 63 evaluate test-ended | 297, 200/code200/10 items/31 total/22.395ms |
| login-log-retry1 | 75 visibility start, 80 true, 91 evaluate waits attached | 58/59 test timeout; 67 evaluate test-ended | 297, 200/code200/10 items/32 total/20.702ms |
| operation-log    | 73 visibility start, 76 true, 87 evaluate waits attached | 54/55 test timeout; 63 evaluate test-ended | 296, 200/code200/10 items/41 total/12.688ms |

The sanitized companion JSON retains exact selected event records, archive SHA-256 hashes, and summaries of list responses, without request headers, cookies, login responses, authorization credentials, or full response bodies.

Archive SHA-256:

- login-log: `dd449b9b8e38054d21fa097a78824e4d89e27f6917ff78635bfcb36f28835741`
- login-log-retry1: `463a93ad8b458fc3d2e9f160ef69c8b48708e904bd0560dcde93ff5f13e93632`
- operation-log: `6d157d3baaa39fa9604b69d83c69ba72b9fad4d801c1fb40caab861c2fb45f39`

## Minimal browser reproducer for executor

This controls the exact condition already captured on hosted CI: visible empty node, detach it, then call the helper's evaluate signature. It needs no backend or authenticated application.

```js
import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(5000); // upper bound instead of waiting indefinitely
await page.setContent('<div class="arco-empty">No records</div>');
const empty = page.locator(".arco-empty").first();
console.assert(await empty.isVisible());
await page.evaluate(() => document.querySelector(".arco-empty").remove());

const started = Date.now();
try {
  await empty.evaluate((el) => el.textContent ?? "", { timeout: 2000 });
} catch (error) {
  console.log("broken signature elapsed", Date.now() - started, error.message);
  // Expected: approximately 5000ms, not the intended 2000ms.
}

const correctedStarted = Date.now();
try {
  await empty.evaluate((el) => el.textContent ?? "", undefined, {
    timeout: 2000,
  });
} catch (error) {
  console.log(
    "correct signature elapsed",
    Date.now() - correctedStarted,
    error.message,
  );
  // Expected: approximately 2000ms; an outer toPass can then retry and see no empty.
}
await browser.close();
```

Executor should additionally call the actual corrected helper while forcing empty detachment exactly between its visibility probe and text read, and prove a permanent invalid empty still fails and a permanent valid empty still passes. This diagnosis lane did not run a new browser reproduction because root assigned that adversarial runtime proof to a separate implementation lane; hosted failures reproduce the relevant condition three times. Full Smoke SUCCESS on the same main is coordinator-provided context, not independently queried here.

## Unknowns and stop condition

The exact sub-millisecond empty detachment instant is not retained as a browser event. Its evidence is the true visibility result, the ensuing attached-element wait that never resolves, and populated final DOM. No broader application defect is inferred. Stop: root cause grounded, narrow correction selected by coordinator, sanitized evidence handed off; no source changes performed in this lane.
