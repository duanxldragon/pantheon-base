# v0.18.8 isolated Ops candidate build verification

Result: **PASS**. Existing official v0.18.7 consumption PR [#183](https://github.com/duanxldragon/pantheon-ops/pull/183) merged as fc3fa867630580f7bcf1d40082a77f6b2548ac56. Its tree is identical to the candidate Ops input 4404cfde5394557626967dc40669c30a0adba4e2.

Sealed candidate: candidate-43be57e28ef949b68b1d145fdd5fb0d82d03272950be37772a05b3fe10ae8ec4; 1176 Base input leaves. Descriptor SHA256 8e99ab6dd69fe675af508f06ebcb1faac4617b7845a8a91b2d1b42c72d0f5ee3; tar SHA256 5f2d1862cc1b6aa1f37720ee36e4aea0843bf611139a0440b01cb2b30f31b1bc. Final VERSION=0.18.8 was set in isolated source staging and a new candidate was produced with the standard producer; no sealed files or official lock were edited.

Assembly passed: 856/856 shared leaves identical; zero drift exemptions; 164 declared business files skipped; two derived migrations verified. Official v0.18.7 lock bytes remain identical. All 2113 selected assembled source leaves retained aggregate 9c5f0877b04ec392be60c01dacd941cf3161198393b81af544bb98ebad571c05 before/after builds. Four candidate adapter files retained their pinned hashes.

Validation:

- CGO_ENABLED=1, MinGW GCC 16.1.0, Go 1.26.5: go build -buildvcs=false -mod=readonly ./... → exit 0.
- Supported Node 24.22.3: npm ci → exit 0; lint → exit 0; type-check → exit 0; production build including all prebuild contracts → exit 0.
- Node zip SHA256 e612af99f626ab415ea225af6bce5c971feb448cb5cae250bb1c3fa50c5f7d9f reverified; node.exe and npm-cli.js match exact members from the verified archive.
- Base actual working tree on merged #502 source 1cc4d6fb320113865eac8226af4f6f499b74f455 plus explicitly recorded final-governance VERSION: all 1176 selected bytes match the sealed candidate; aggregate equals candidate identity digest.

Original Node 24.14 installation/command logs are retained. They exited zero but included Node engine warnings and are diagnostic only. Supported npm ci recreated node_modules and cleared the configured node_modules/.tmp TypeScript build-info cache before final verification.

Evidence: final-build-receipt.json; final-candidate-assembly-receipt.json; frontend-build-commands-supported.json; backend-build-commands.json; source-before-supported-build.json; source-after-supported-build.json; merged-main-working-version-byte-comparison.json.

Final release commit binding remains pending until governance lands on clean main. The existing compare-base-working-sources.mjs script can verify the actual release main commit without rebuilding if all inputs remain equal. This candidate receipt proves build compatibility; it does not replace independent source review, exact-main hosted gates, paired runtime acceptance or official four-asset verification. Existing external Vercel preview failure on Ops PR #183 remains separately disclosed.

## Provenance clarification — 2026-11-13

Go 1.26.5 above is the bootstrap executable version captured outside the module. Readonly checks in the exact assembled backend under the original native PATH and CGO_ENABLED=1 report effective Go 1.26.10 and GOTOOLCHAIN=auto, matching go.mod. See effective-go-toolchain-receipt.json, the two retained command logs and effective-go-toolchain-clarification.md. The original final-build-receipt.json and original summary.md.gz remain byte-identical; this clarification is appended, with no new build or sealed-source edit.

The retained source-before-build.json.gz records the 2113-leaf source aggregate 9c5f0877b04ec392be60c01dacd941cf3161198393b81af544bb98ebad571c05 at 05:13:53.345Z, before the backend build began at 05:14:09.0076081Z. The later source-before-supported-build receipt remains unchanged.

Final release binding must independently verify actual branch main, zero staged/unstaged/untracked files, local HEAD matching current remote main SHA and candidate inputs matching that actual commit. A comparison script's phase label alone does not prove these conditions; the coordinator retains the actual downstream delivery receipt separately.

The effective-go-toolchain-receipt.json convenience view is LF-normalized for Git. Its original CRLF bytes are retained in effective-go-toolchain-receipt.json.gz; retained-artifacts.json and the parent raw-json-artifacts.json bind the original raw SHA to decompression and identify the normalized view separately. The original LF final-build-receipt.json remains byte-identical.
