# Upgrade notes

Use the official pantheon-base-v0.19.0 bundle and repo.tar with their published SHA-256
files through the existing Foundation fetch/rebuild process. Do not copy files from Base main.
Use Go 1.26.11 or newer supported tooling for backend builds and keep the locked Node/frontend
installation process. No new database migration or required business provider is introduced.

Durable jobs may opt into JobAuthorizationReader; they must still use the auth-owned live
reader at dispatch/execution and must not persist its grant. The capability is optional and
does not alter the session lifecycle or enable multi-tenant durable jobs.

Business modules may declare owned runtime defaults and request trusted request-scoped reads.
Existing defaults are preserved; incompatible metadata, missing tenancy, unknown keys,
cancellation and mode drift fail. Keep existing server settings/mode ownership.

Rollback by rebuilding from the previous official Foundation assets and rerunning the
consumer checks. Production data/provider acceptance requires its separate authorized plan.
