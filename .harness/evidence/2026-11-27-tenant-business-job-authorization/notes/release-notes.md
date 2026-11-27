# Pantheon Base v0.19.1

The auth-owned durable-job reader supports multi-tenant execution. It refreshes
the persisted owner's current grant in the active resource tenant, including
membership, permission, policy and data scope. Compat continues to authorize
tenant 0 jobs.
