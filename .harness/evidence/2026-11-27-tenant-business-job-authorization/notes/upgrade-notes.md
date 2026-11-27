# Upgrade notes

Fetch the verified Foundation bundle, repo.tar and both SHA256 files and rebuild
with the consumer's declared business overlay. This release adds no database migration.

Capture job ownership from trusted request context when admitting a task. Read
the owner and resource tenant from the durable record and use the registered
action when refreshing authorization at dispatch and worker execution. Recheck
the current source and stable targets against the tenant and the returned scope
before provider I/O. A rollback rebuilds from the previous official Foundation
assets and restores the previous consumer implementation.
