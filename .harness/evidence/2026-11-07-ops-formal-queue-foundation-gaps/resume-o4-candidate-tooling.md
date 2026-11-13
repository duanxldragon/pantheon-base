# O4 candidate tooling handoff

Status: Base producer/descriptor implemented and locally verified; Ops resolver/entry/tests blocked by filesystem authority. This is Generator evidence, not independent CODE/ARCH, candidate integration, supported-start, release or official-consumption approval.

Parent: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json`. Paired parent: `../pantheon-ops/.harness/tasks/2026-11-07-ops-planned-task-closeout/manifest.json`. Plan: `.harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/o4-tenant-implementation-plan.md`, SHA256 `9aaa0e53b43c040a4d04949693d3ef6ab4b086336fe953c3e04105400e4caaf7`. Exact tested tool hashes, exports, commands and unchanged protected-source/lock hashes are in `resume-o4-candidate-tooling.json`; final Base test output is in `resume-o4-candidate-base-tests.txt`.

## Implemented boundary

- `buildCandidateArtifact({root,baseCommit,sourcePaths,sharedPaths,evidenceIds,reviewIds,capabilities,outputRoot})` requires an explicit reviewed inventory. `baseCommit` must resolve to that genuine commit in the source repository; it is provenance only. Dirty and untracked declared source bytes are captured explicitly.
- Schema1 uses `kind:pantheon-base-candidate`, `consumerMode:candidate-staging`, grouped nonempty shared paths, complete sorted `{path,bytes,sha256}` inventory, review/evidence IDs, capability/export bindings and `candidate-<aggregateSha256>` identity. Aggregate is SHA256 of the exact UTF-8 JSON serialization of the sorted inventory. Detached descriptor SHA256 is over saved bytes; archive SHA256 is over a deterministic regular-file-only ustar archive. No stable release fields or git-archive claim are emitted.
- Capabilities are finite source-interface IDs: `business-tenant-v2`, `required-business-bootstrap-v1`, `audit-metadata-only-v1`, `permission-route-registration-v1`. The immutable `CAPABILITY_EXPORTS` mapping binds each to expected Go declarations and their file hashes. Missing declarations, comments/string-only declarations, unknown IDs and inconsistent descriptor declarations refuse. Presence checks do not prove behavior or constitute review; root must review these identifiers and mappings with concrete APIs before consumer use.
- Source capture checks real directories, regular files without hard links, per-file/count/aggregate bounds and normalized paths. Config directories are not recursively traversed: exact config files must be declared. Forbidden metadata, secrets, dependencies, uploads and caches encountered in a selected inventory refuse rather than silently changing inventory. Inventory authors must select only intended source/build/docs inputs, including required new APIs, tests and build configuration.
- Captured file bytes are packaged and reverified. File and directory stamps plus full inventory are compared before publication to reject writes, additions, removals and edit/revert races. A temporary sibling directory is cleaned on any failure; publication renames a fully validated pair to a new output directory. In-Base outputs must be below `.tmp/foundation-candidates/`; existing outputs, source overlaps and junction ancestors refuse.
- `readCandidateDescriptor(path,pinnedSha256)` and `verifyCandidateArchive(bytes,descriptor)` enforce exact schema, identity, hashes, file types, checksums, inventory and strict tar parsing. Native tar extraction is never used by the producer. Links, special/directory entries, PAX/GNU extensions, traversal/drive/UNC/Windows aliases, duplicate/case-fold/file-directory collisions and undeclared/tampered content refuse.
- `verifyCandidateExecutable({descriptorPath,expectedDescriptorSha256,buildReceiptPath,expectedBuildReceiptSha256,executablePath,expectedExecutableSha256})` validates a separate externally pinned `pantheon-candidate-build` receipt against descriptor identity, aggregate, capability set and actual executable digest/size. It never launches a binary or claims that source archive bytes identify an executable. This helper covers Base capability identity; the later Ops supported wrapper must separately bind assembled Ops source/schema capabilities and stopped-old-process runtime evidence.

## CLI syntax and example

```powershell
node scripts/foundation-release/build-candidate-artifact.mjs --help
node scripts/foundation-release/build-candidate-artifact.mjs --inventory .harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/reviewed-candidate-input.json --output .tmp/foundation-candidates/o4-reviewed-attempt
```

The second command is a usage example, not an executed product seal. Root supplies the reviewed input file, genuine provenance commit and complete source/build/docs inventory. Output must not exist. Input has the following shape; placeholders must be replaced. A small fixture is not a complete product build inventory.

```json
{
  "root": "D:/workspace/go/pantheon-platform/pantheon-base",
  "baseCommit": "<existing-40-hex-provenance-commit>",
  "sourcePaths": ["<reviewed-source-build-docs-file-or-directory>"],
  "sharedPaths": {
    "backend": ["<reviewed-backend-path>"],
    "frontend": ["<reviewed-frontend-path>"],
    "docs": ["<reviewed-docs-path>"]
  },
  "evidenceIds": ["<source-verification-evidence-id>"],
  "reviewIds": ["<independent-source-review-id>"],
  "capabilities": [
    "business-tenant-v2",
    "required-business-bootstrap-v1",
    "audit-metadata-only-v1",
    "permission-route-registration-v1"
  ]
}
```

Fresh executable fixture tests can be run with `node --test scripts/foundation-release/candidate-artifact.test.mjs`. They create disposable repositories with genuine provenance commits, declared dirty/untracked bytes and synthetic review/build references. All fixture outputs are removed. No current product seal was attempted while Base source owners are writing.

## Fresh verification

- `node --test scripts/foundation-release/candidate-artifact.test.mjs tests/scripts/foundation-release/*.test.mjs`: 71 passed, 0 failed/skipped, 4559.495ms. Candidate coverage includes 14 tests counting nested source-mutation cases; existing formal release tests remain intact.
- Ops `npm run test:business-overlay`: 62 passed, 0 failed/skipped, 13956.9738ms. Existing formal rebuild/drift tests still refuse local Base sources; declared generated migrations remain byte-checked against their business sources.
- `node --check` on all three new files: passed. `npm run check:docs-frontmatter`, `npm run check:task-packet-template` and scoped `git diff --check`: passed.
- Formal release producer, Ops stable resolver, exported assembler/shared-drift seam and real Ops `foundation-release.lock.json` hashes matched before/after. Exact lock SHA256 remains `95de1a87270e15c0d4c672418a5df906818a88652f8a3e6c480f1484ee9fa70c`.

## Remaining work and authority boundary

The session sandbox grants write authority only to `pantheon-base`. No attempt was made to bypass it. The three assigned Ops files (`foundation-candidate.mjs`, `rebuild-from-candidate.mjs`, `foundation-candidate.test.mjs`) and paired-parent evidence have not been created. The user was asked to add Ops as a writable workspace root. Existing exported `assembleConsumerTree` and `checkSharedDrift` are sufficient; no additive edit to either seam is requested.

The Ops resolver must verify the pinned detached descriptor/archive, extract regular declared entries into a fresh bounded sealed snapshot, and rehash immediately before/after assembly. The entry must protect `.tmp/foundation-candidates/<candidateId>/assembled`, freeze/rehash Ops declared inputs and manifest, invoke both existing seams, generate migration destinations only from the business overlay, and emit a staging-only receipt while preserving real lock bytes. Its hostile extraction, source-mutation, target-protection and lock-stability tests remain unimplemented.

Root retains canonical documents/manifests/ledgers; the observed parent Base manifest still needs J inventory/planRefs reconciliation. Root also owns independent concrete CODE/ARCH tool/API review and paired runtime before Ops consumer Generator. Those receipts, current-product builds, actual supported start/schema transitions, runtime, publication and final official immutable consumption are open. No backend/UI/SQL/lock/current baseline/dependency/commit/push/release modifications were made by this tooling lane.
