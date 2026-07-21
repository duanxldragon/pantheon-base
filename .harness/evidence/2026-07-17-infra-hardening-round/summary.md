# Verification summary: 2026-07-17-infra-hardening-round

## What landed

Infrastructure hardening on branch `feat/2026-07-16-search-toolbar` (11 commits, base 9e6f4c02 / ops 37f8dd5). Four mechanical CI gates plus SearchToolbar rollout and menu-tree filter fix.

### Four mechanical gates (ratchets, 0 findings at landing)

1. **check-encoding.mjs** (scripts/harness, quality.yml blocking)
   - Scans git-tracked text files for invalid UTF-8 byte sequences
   - Origin: #121 mojibake incident latent 3 weeks before discovery
   - Vendored from pantheon-harness `8010016`, wired blocking even on PRs
   - 0 findings across 1024 tracked files

2. **check-ui-contract.mjs** (frontend/scripts, prebuild chain)
   - Enforces DESIGN.md §7.6/7.7/7.9 forbidden patterns: no radial/linear gradients, standard font-weights only (400/500/600/700), no Inter font, no raw Arco tokens, no module hex colors (except neutral #fff/#000 in color-mix)
   - Escape hatch: `ui-contract-allow: <rule-id>` same-line comment
   - Lesson learned: regex negative lookahead after `\s*` defeated by backtracking (`\s*` matches zero → lookahead evaluates at wrong position); switched to capture value + code-side validation
   - 0 findings after fixing 96 false positives + adding NEUTRAL_HEX exemption
   - base `ea2f4779`, ops `1ed5321` (ops adds DRIFT_PENDING_SYNC exemption for 2 base-owned stale copies, removal condition documented)

3. **Playwright visual-regression** (frontend/tests/visual, separate project)
   - `playwright.visual.config.ts`: 1440x900, maxDiffPixelRatio 0.01, animations disabled
   - 3 baseline tests: login (pre-auth static), dashboard (masked stats), user-list (masked table body)
   - Win32 baselines committed (`-win32.png` suffix), generated live against running backend
   - 3/3 verify green, dashboard screenshot visually confirmed (magenta masks over volatile values)
   - Agent workflow documented in tests/visual/README.md: green-before → green-after → intentional change rebuilds baseline + attaches evidence, never blind-update
   - base `fea3676c`; CI enforcement requires linux baselines first

4. **check-structure-contract.mjs** (scripts/harness, quality.yml blocking)
   - Enforces REPOSITORY_LAYOUT.md §2 placement + naming: backend/frontend top-level whitelists, modules/ domain whitelists (auth/business/lowcode/platform/system +frontend generated), Go snake_case + backend-only, no tests in src/, components PascalCase, hooks use*, no tracked binaries
   - Complements check-boundaries (import rules): one manages WHERE files live, the other WHAT they reference
   - Only scans git-tracked files (local noise invisible), whitelists = base/ops union so script vendors unchanged
   - 11 tmpdir fixture tests; one rewritten to avoid Windows case-insensitive FS trap (camelCase test file merges with existing PascalCase → violation never materializes)
   - Calibration caught backend/.golangci.yml hidden-file omission; added to whitelist
   - 0 findings: base 1024 files, ops 768 files
   - base `9e6f4c02`, ops `37f8dd5`
   - REPOSITORY_LAYOUT.md updated with enforcer pointer: new dirs require doc update first, then whitelist sync

### SearchToolbar rollout + menu-tree filter fix

- Rolled out SearchToolbar to 9 additional list pages (dict/dept/menu/permission/post/role/i18n/security-event/session) plus generator and keyword APIs
- Menu tree text filter now keeps ancestor chain of matched nodes (commit `3b55b0a9`)
- Visual evidence: 26 screenshots in `.harness/evidence/2026-07-16-search-toolbar-pilot/` and `2026-07-17-search-toolbar-rollout/` (desktop + phone viewports, keyword-filtered states)

### Three-touchpoint maintainer contract

Documented in root agents.md, base/ops CLAUDE.md, and pantheon-harness workflow-routing.md (commit harness `4a1b484`, base `562bc18b`, ops `8418e45`). Maintainer intervenes at ① requirement clarification (batch questions once) ② gate-policy decisions ③ final acceptance; autonomous between touchpoints, gates replace verbal confirmation.

## Commands (see commands.json)

All gates self-check green:
- encoding: 0 findings / 1024 files
- UI-contract: 0 findings (after false-positive fix)
- structure: 0 findings / 1024 files, 11/11 fixture tests pass
- visual: 3/3 baselines verify green
- frontend build clean with gates in prebuild chain
- docs-governance blocking steps pass

## Residual

- Linux visual baselines must be generated in CI before test:visual can be enforced in quality.yml (win32-only committed for now)
- pantheon-ops vendoring tracked on separate branch feat/deploy-task-main-flow-closeout
- 12 uncommitted files in base working tree belong to another session's SearchToolbar UI iteration, intentionally excluded

## Boundary note

Gates are mechanical ratchets: they catch drift at 0 findings and prevent regression. Visual gate needs linux baselines before PR enforcement. The uncommitted SearchToolbar UI work is owned by a separate session and will land via its own PR.
