# Business runtime settings — Base-first implementation plan

Scope: L2, system/config owns storage/bootstrap/provider; pkg/contracts owns startup declarations and the public read port. Business owns only key meanings and consumer validation.

In: nonpublic, unencrypted business settings; exact-key namespace ownership; deterministic immutable startup declarations; insert-if-missing transaction preserving operator values; authenticated middleware tenant snapshots; authoritative per-read mode equality; explicit required startup failure; real MySQL and concurrency regressions.
Out: business resource tenant migration, encrypted secrets, dynamic registration/unregistration, new validators/dependencies, production/release/official Ops lock replacement, UI redesign, unrelated dirty changes.

Implementation posture: primary Codex acts as Base Generator for scoped high-risk code; independent Architect reviewed design, independent Code Reviewer reviews final changes/evidence. No self-approval.

Minimum viable approach: use existing system_setting unique key, standard validators, tenant strict ModeReader and Gin tenant context, contracts required runner. Do not expose SettingService/GetByKey or import system internals from business.

1. Declarations register before system initialization (compiled package init or explicit pre-system composition). Require module business.<name>, keys <name>.<suffix>, bounded metadata and standard types; reserve existing system prefixes. Atomic duplicate/collision rejection and copy slices of scalar descriptors. Seal at business bootstrap, reads unavailable until commit/provider installation.
2. System transaction inserts tenant0 defaults without updating existing values. Re-read and validate global metadata/type/public/encryption/group and existing value. Concurrent startups rely on unique key with insert-if-missing; any invalid row rolls back this batch.
3. Provider factory binds copied request tenant context from trusted middleware; per-read strict authoritative mode must equal the bound snapshot. Compat reads global; multi requires validated provenance/tenant combinations and reads own override/global only. Validate every visible effective row against its descriptor before returning. Do not decrypt or publish values. Cancellation/storage/mode/context failures return errors. Business Host fallback policy is a separate downstream concern.
4. Run dedicated required preparation before existing system runner in both autoMigrate and versioned modes when business declarations exist, returning/panicking at composition rather than warning-and-serving. Existing system modules keep their current runner. Provider installs only after successful bootstrap. Legacy repeated setting bootstrap remains idempotent.
5. Extend canonical SYSTEM_CONFIG_CONTRACT CN/EN with ownership/startup/consumer semantics and explicit release/Host integration gap. No schema change needed.
6. Verify registry lifecycle/duplicate/namespace/copy/race; real MySQL seed preservation/transaction rollback/concurrent startup; tenant override/fallback/metadata tamper/cancellation/unknown or changed mode; required-runner two-mode rejection. Review final diff independently.

Success: scoped tests and vet pass with required isolated MySQL and Windows CGO race; no secret/cross-module/global fallback on uncertain mode; required preparation error prevents startup. Official release/consumption and whole product full race remain open until performed.

Architect verdict WATCH: startup order, metadata integrity, mode drift and Host fallback are material acceptance conditions. Source: design-review.md. No code or runtime approval implied.

Context: AGENTS.md → SYSTEM_CONFIG_CONTRACT → TENANT_CONTRACT_V1 → focused CodeGraph → current code. Preserve unrelated work and historical evidence. No credentials in artifacts.
