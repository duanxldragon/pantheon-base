# Important Budget Remediation Evidence

## Outcome

- Reduced frontend `!important` usage from 164 to 144.
- Lowered the enforced budget from 147 to 144.
- Removed 17 browser-verified redundant priorities and one unreferenced CSS block containing three additional priorities.
- Preserved all date-picker, dialog, drawer, table-padding, and navigation-state overrides that changed computed styles when tested.

## Validation

- `npm run check:important-budget`: passed at `144 / 144`.
- `npm run check:shell-visual-contract`: passed.
- `npm run check:contrast`: passed for light and dark semantic roles.
- Targeted Prettier, full lint, type-check, production build, and `git diff --check`: passed.
- Production build also passed menu, i18n, datetime, page-admission, smoke-base, and smoke-coverage prebuild gates.
- Focused Playwright: 7/7 scenarios passed across login, user, setting, permission, and menu surfaces.

## Visual Evidence

- Login: 1440x900 and 390x844 before/final screenshots.
- User management: 390x844 screenshot plus phone/tablet geometry assertions.
- System setting: 390x844 overview and group screenshots.
- Permission and menu: 1440x900 screenshots plus 1280-wide smoke runs.
- Browser runtime-error collectors reported no disallowed console or page errors.
- Login baseline-to-final pixel differences were 0.1074% desktop and 0.1552% mobile; visual inspection shows unchanged layout, typography, borders, and control sizes.
- `login-*-rejected-trial.png` records the intentionally rejected whole-file experiment that proved several Arco overrides remain load-bearing.

## Boundaries

- Changes remain in `pantheon-base` under platform and system/auth shared UI ownership.
- No business module, component behavior, route, API, permission, i18n, schema, or backend code changed.
- Downstream `base -> ops` synchronization is deferred to the next normal foundation release.

## Residual Risk

- The remaining 144 declarations require further incremental browser-verified migration; this batch does not claim they are all necessary.
- Hosted GitHub checks require a PR and remain a human/release gate.
- The setting anchor strip intentionally uses horizontal overflow on narrow screens; this pre-existing responsive behavior was exercised but not redesigned.
