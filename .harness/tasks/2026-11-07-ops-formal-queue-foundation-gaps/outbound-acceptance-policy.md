# D2 test deployment outbound policy

Status: candidate deployment decision for the authorized test environment; runtime matrix and independent review pending. Scope is the Ops P0 acceptance host115.190.251.143. This does not authorize production URLs, private-network exceptions or changes to generic security behavior.

Owner: Base `backend/pkg/security/ssrf`, consumed through the official v0.18.6 foundation lock. Existing generic DNS-to-numeric-dial binding was released and independently reviewed in `.harness/evidence/2026-11-04-audit-p1-ssrf-dial-binding/summary.md`. Ops owns only its provider adapters and declared business policy choices.

## Enforced current behavior

- HTTP/HTTPS are the generic allowed schemes. StrictValidator supports HTTPS/domain allowlisting when explicitly selected; creating DefaultValidator does not consume a YAML/environment domain policy. An empty AllowedDomains means all public domains are eligible, despite the old constructor comment. Do not claim an environment-configured allowlist is active.
- Generic ports80/443/8080/9090/3000. Ops datasource adapters add3100/16686; K8s API adapters select443/6443/8443/16443. Uploaded kubeconfig proxies, local credential files/plugins and insecure TLS are rejected.
- Private, loopback, link-local, cloud metadata, unsafe/reserved/multicast and unspecified addresses are rejected. All DNS answers are checked before any dial; only validated numeric addresses reach the dialer. A later private DNS answer is rejected. Host/SNI retain the configured hostname.
- Redirects are disabled. K8s additionally pins every request to the configured scheme/host origin before transport so alternate public origins cannot receive kubeconfig credentials. Verified TLS remains enabled.
- Generic lookup/connect budget defaults to10s. K8s request budget is30s with request-context cancellation. Datasource requests use their bounded consumer timeout and request cancellation. Per-provider limits must be validated by runtime receipts; a generic default does not prove every consumer limit.

## Authorized test policy

Test-owned endpoints and credentials may be created only on115.190.251.143. Use the explicit public address, finite API permissions, labeled namespaces and bounded test resources. There are no approved private/CIDR exceptions. The runtime harness may use an SSH tunnel to reach installed real providers, but any test-only validator override must be disclosed and is not deployment-policy enforcement evidence.

The test fixture's standalone released-validator driver will select an explicit host allowlist without modifying product validators. Positive allow, scheme/port/domain deny, private-IP, redirect, timeout and credential-forwarding results are recorded separately from actual provider API/RBAC/DataScope/audit results. DNS-rebinding/family/lookup failure coverage must identify whether it is deterministic unit evidence or a live DNS replay; neither substitutes for the other.

Evidence records named scenario IDs, status, elapsed time and safe resource identities only. Do not store credentials, arbitrary query bodies, response bodies or unrestricted input URLs. Audit payload secrecy must be tested against the real product audit path; no clean standalone-driver log can certify it.

## Close conditions

The actual D2 acceptance matrix, consumer byte/overlay/build checks and findings-first review must pass. Audit/credential behavior, unsupported configuration wiring, untested provider limits and any inherited documentation mismatch remain explicit until repaired and reviewed. Formal Base changes, if required, must be issued and consumed through a new immutable release; do not patch Ops shared source.
