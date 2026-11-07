Implemented only [dynamic_module_service_test.go](/D:/workspace/go/pantheon-platform/pantheon-base/backend/modules/lowcode/dynamicmodule/dynamic_module_service_test.go:1056).

- `TestPurgeModuleAllowsBusinessStaticModuleWithoutTable`: binds `PANTHEON_WORKSPACE_ROOT` to the temporary workspace, preventing ambient checkout scanning. All existing assertions, including four observing rows, remain intact.
- `TestPurgeModulePreservesExternallyReferencedI18n`: reuses existing helpers to verify module source removal, a surviving external reference, two referenced translations remaining active with no lifecycle timestamp, and two unreferenced translations entering observing.

`gofmt` completed; formatting check is clean. Production behavior, authorization and database lifecycle semantics are unchanged.

Tests were deferred to root’s dedicated MySQL/Redis and consumer-overlay race verification. No commit, push or self-review performed.
