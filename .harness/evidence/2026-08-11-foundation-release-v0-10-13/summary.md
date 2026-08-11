# Evidence Summary

Base commit `ac62d71581865d4649691095ae46216f07726681` makes `manifest.sharedPaths.frontend` an enforceable ownership contract for `App.tsx`, `main.tsx`, `vite-env.d.ts`, `api`, and `hooks`. The local archive for `pantheon-base-v0.10.13` has SHA-256 `1f35d01c1fc101b9170380be825bafbdd3c03b432bf1bea4719457beaf66d70a`.

Focused Base release tests passed (13/13). The local Ops consumer upgrade passed `check:inheritance`, all 81 release-consumer tests, and the frontend production build. Publication, the exact-commit GitHub Release Gate, and fresh Ops hosted analysis are pending; no immutable remote tag or GitHub Release exists yet.
