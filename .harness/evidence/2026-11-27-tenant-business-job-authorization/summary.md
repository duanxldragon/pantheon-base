# Multi-tenant durable job authorization

Base candidate branch `feat/tenant-business-job-authorization` starts at
`cc2fe7370a98c2862e2610d79880012971cf57f5`. It extends the optional durable
job reader without changing the Go interface. A multi job needs a live owner,
active membership and roles in the persisted resource tenant. A compat job
continues to use tenant 0.

The focused Windows CGO race phase used isolated schemas on the development
machine's MySQL. The regression produced 32 passes and five failing results
before the implementation, followed by 37 passes and zero skips with it.
Both phases cleaned up their schemas. The developer schema was version 41 and
clean before and after. Full race used dedicated local Redis instances. It passed 2,289 tests and skipped the optional real S3 provider test. The isolated schemas were cleaned up and the developer schema remained clean at version 41.

The remaining candidate gates are PR checks and exact-commit Full
Smoke and Release Gate. Tag and asset identity must be verified before the
Ops T14 rebuild consumes this version.
