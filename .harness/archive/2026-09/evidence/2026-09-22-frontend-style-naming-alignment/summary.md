# Summary — 2026-09-22-frontend-style-naming-alignment

## Scope

Wave 2 #6 of `.harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md`: converge
component-specific and shared stylesheet naming without changing UI behavior.

## Convention (frozen first)

`REPOSITORY_LAYOUT.md` §5.2 now defines three tiers:

1. **Component-specific**: `ComponentName.css` next to the component, filename == component name.
2. **Group/module-level shared**: named after its directory (`auth.css`) or under `shared/`
   (`system/components/shared/list-page.css`).
3. **Cross-module/global shared**: `frontend/src/assets/` or global `index.css`.

BEM class names do not change with the filename.

## Renames (4)

| From | To | Component |
| --- | --- | --- |
| `components/patterns/filters/time-range-filter.css` | `TimeRangeFilter.css` | `TimeRangeFilter.tsx` |
| `modules/platform/dashboard.css` | `Dashboard.css` | `Dashboard.tsx` |
| `modules/system/profile/profile.css` | `ProfileCenter.css` | `ProfileCenter.tsx` |
| `modules/system/user/user.css` | `UserList.css` | `UserList.tsx` |

4 imports updated. `dashboard.css → Dashboard.css` is case-only and used a two-step `mv`
via `.dashboard.tmp.css` to survive case-insensitive filesystems.

Kept (named after dir / explicit shared, per the convention): `operational.css`, `auth.css`,
`list-page.css`, `index.css`.

## Visual equivalence

CSS file contents are byte-identical; only filenames and import strings changed. BEM class
names (`.time-range-filter__*`) are untouched. No rendered screenshot is produced because the
compiled CSS and DOM class names are unchanged by construction.

## Verification (all green)

- `tsc --noEmit -p tsconfig.app.json`: exit 0.
- `vite build`: ✓ built in 1.03s.
- `eslint` on the 4 components: exit 0.
- Old-name grep in `frontend/src`: none.
- structure gate 0 findings; doc links 0 findings; frontmatter passed.

## Known gaps

- Cross-module shared stylesheet placement (`list-page.css`) remains as boundary baseline debt.
- Visual evidence omitted with a zero-content-change argument (recorded, not silent).

## Completion Status

complete
