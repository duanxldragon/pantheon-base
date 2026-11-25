# Pantheon Base v0.19.0

This compatible minor release adds two optional shared capabilities for business consumers.

- Auth-owned durable-job authorization evaluates the current owner, role, registered action,
  policy and data scope without retaining a session or cached grant; unsupported tenancy and
  uncertain reads deny opaquely.
- Business-owned setting declarations bootstrap private defaults without overwriting operator
  values. Request-scoped readers retain trusted tenant context, validate metadata and recheck
  authoritative tenant mode before and after the database read.
- Business route authorization preserves the static/parameter distinction delivered in main.
- Normalize Foundation release tags/titles and preserve historical release identities.
- Protect archive bytes during formatting, repair depguard module prefixes and consume the
  reviewed Harness method snapshot.
- Adopt Go 1.26.11 for the existing net/http security patch. Clear hosted static-analysis findings
  by consolidating Go parameter declarations, removing redundant optional TypeScript undefined
  types and constructing the unchanged IPv6 SSRF rejection ranges with typed addresses.

Release eligibility requires independent review, candidate-bound CI and Full Smoke, zero
unresolved gated Sonar findings, and all four verified immutable Foundation assets. Existing
S3-provider, maintenance-freeze, production and downstream product-acceptance gaps remain explicit.
