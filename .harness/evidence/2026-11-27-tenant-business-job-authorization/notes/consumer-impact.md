# Consumer impact

The optional `JobAuthorizationReader` retains its existing API. Tenant-aware
consumers can now authorize nonzero-tenant jobs in multi mode. Existing compat
consumers continue using tenant 0. Ops T14 tracks the file distribution
integration and its separate runtime evidence.
