# Review — 2026-07-25-sonar-small-buckets

## Reviewer stance

Every fix was checked against "does the observable condition actually replace
what the fixed wait was standing in for":

1. **full-page-audit 1500ms → sider-visible + networkidle**: the test measures
   sider/header geometry; visibility of the measured element plus request
   quiescence is a strictly stronger signal than a timer. The second 1500ms
   wait was immediately followed by an existing networkidle wait — deleting it
   removes pure double-waiting.
2. **Dialog/select style reads (250ms/100ms) → getAnimations().finished**:
   the waits existed for Arco open/focus transitions; waiting for the
   element's own animations (subtree) is the direct condition. Residual risk:
   a transition that starts a frame after the assertion could be missed —
   accepted because the PR-required Smoke Sanity job runs these exact specs
   and will catch flakiness before merge.
3. **Negative assertions (logout message, runtime errors)**: a timer is the
   weakest form here; login-page networkidle (all logout-triggered requests
   settled) and a double-rAF event flush are the conditions the timers
   approximated. `toHaveCount(0)` remains the assertion.
4. **k6 randomness → (__VU+__ITER) rotation**: distribution across the three
   cases stays uniform; runs become reproducible. This changes the exact
   request interleaving of a manual stress tool, not product behavior.
5. **Dockerfile RUN merge**: both RUNs are adjacent user/dir setup in the
   final stage; merging only reduces layers. Package sort is content-neutral.
6. **index.html catch restructure**: the media-query fallback now applies even
   when storage throws — previously the color mode attribute was silently
   skipped. Strict improvement, verified against the pre-paint intent comment.

## Scope check

No product runtime source (frontend/src, backend Go) touched; the only
behavioral delta is the improved storage-failure fallback in the pre-paint
bootstrap script, documented above.
