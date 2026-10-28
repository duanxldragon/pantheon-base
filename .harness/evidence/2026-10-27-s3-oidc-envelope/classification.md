# OIDC raw-response classification — one row per `c.JSON`

Task: `2026-10-27-s3-oidc-envelope`
File: `backend/modules/auth/oidc/handler.go` (line numbers as of this change)

The only true OIDC protocol element in the file is the 302 redirect at
`handler.go:38` (RFC 6749 §4.1.1 authorization-request redirect). It is not JSON
and was not touched. The six JSON responses classify as follows.

| # | Line | Handler / branch | Status | Shape | Protocol contract? | Decision |
|---|---|---|---|---|---|---|
| 1 | 31 | `InitiateOIDCLogin`, initiation error | 500 | `{"error"}` | No — app-owned browser-facing login entry; the protocol element is the redirect, not this body | Keep raw; comment names RFC 6749 §4.1.1 and states no IdP/SPA parses it |
| 2 | 52 | `HandleOIDCCallback`, missing `code`/`state` | 400 | `{"error"}` | No — `redirect_uri` is reached by the user's browser; IdP protocol errors arrive as redirect query params (RFC 6749 §4.1.2.1) | Keep raw; comment names §4.1.2.1 |
| 3 | 62 | `HandleOIDCCallback`, authentication failure | 401 | `{"error","details"}` | No — same browser-facing callback contract; the IdP never parses this response | Keep raw; comment ties it to the contract above |
| 4 | 73 | `HandleOIDCCallback`, success | 200 | `{success,user,is_new,message}` | No — interim business payload; session creation is still a TODO in the handler | Keep raw; comment marks the envelope move as part of session integration + consumer update |
| 5 | 100 | `GetOIDCConfig`, disabled | 200 | `{enabled:false}` | No — frontend-discovery business endpoint (currently consumer-less) | Keep raw; comment requires an envelope move to land with the SPA consumer |
| 6 | 107 | `GetOIDCConfig`, enabled | 200 | `{enabled,loginURL,provider,scopes}` | No — same discovery contract as #5 | Keep raw; comment ties it to #5 |

## Why no response was migrated

- The packet's default is keep (`implementationNotes`), and every response is
  either protocol-adjacent (browser-facing 1–3) or a business payload whose
  consumer does not exist yet (4–6).
- Changing any body is explicitly out of scope (`scope.out`), and an envelope
  change for an OIDC endpoint is a human gate; the recorded decision is keep.
- The module is dormant (no route registration, 0 external Go references), so
  keeping raw introduces no live compatibility risk.

## Boundary for the future SSO wave

When SSO is actually wired:

- #1–#3 stay browser-facing and raw.
- #4 must move to `common.Success` together with session integration and the
  frontend consumer.
- #5–#6 move to `common.Success` together with their SPA consumer.

That split is the deliverable of this investigation.
