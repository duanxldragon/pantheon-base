# Independent architecture review

Reviewer: native architect history_closeout_architect. Verdict WATCH, design review only; no new implementation/runtime verification or approval.

Required safeguards:

- Declaration precedes system initialization (main.go system:189, business:195). Current legacy runner only warns on errors (contracts/module.go:163–172); business preparation failures must prevent serving in both startup modes. Setting.Migrate also calls Bootstrap. Reuse the required runner for only the new readiness stage.
- Existing global and effective override rows must match Module, ValueType, GroupKey, IsPublic=0 and IsEncrypted=0, and pass standard type validation. The public endpoint exposes any public unencrypted row; do not silently accept incompatible existing metadata or overwrite operator values.
- Deterministic transaction uses (tenant_id,setting_key) unique key insert-if-missing then re-read/validate. Concurrent startup and all-or-nothing rollback must be verified with real MySQL.
- FromGin reads a pointer; trust comes from the token→tenant-resolution→authorization middleware. Copy the snapshot, validate legal provenance/Mode/TenantID combinations, and reject authoritative mode drift instead of reinterpreting the old snapshot.
- Host is currently compat business and has shared mutable reader plus fallback behavior. Never inject request readers into a shared service by repeated SetConfigReader. Supplier isolation does not prove Host isolation or Host fail-closed operation. Official consumption is a separate task.

Keep a small mutex/map registry, scalar-descriptor copies and one system provider. No identity subsystem, validator plugin framework or database changes are warranted.

Acceptance: both startup modes; rollback; concurrent first start; metadata conflict; snapshot mutation; mode drift; missing context; cross-tenant isolation; required isolated MySQL flag. Official publication, Ops consumption and full release gates remain open.
