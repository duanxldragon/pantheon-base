# Summary — `2026-10-27-s3-oidc-envelope`

## Outcome

The six raw `c.JSON` responses in `backend/modules/auth/oidc/handler.go` are
**classified and kept**. Each now carries a one-line contract comment naming why
it must stay raw. The deliverable is the classification
(`docs/reviews/OIDC_RESPONSE_CONTRACT_2026-10-27.md` and
`classification.md`), not a behavioural diff.

Closed finding: **RC-026** (OIDC handler deviates from the common envelope).

## Classification at a glance

- #1–#3 are browser-facing login/callback responses. The only protocol element
  is the 302 redirect (RFC 6749 §4.1.1); protocol errors from the IdP arrive as
  redirect query params (§4.1.2.1). No IdP or SPA parses these JSON bodies.
- #4 is an interim business payload pending session integration (the handler's
  own TODO).
- #5–#6 are frontend-discovery business endpoints with no consumer yet.

## Measured change

`handler.go`: **+13 / −0** — comments only. No body, status, header or field
name changed. `go build ./...` and `go test ./modules/auth/...` are green
(6 ok).

## Dormancy fact

`grep` for the three handler constructors outside `modules/auth/oidc` returns 0
matches: the module is not mounted on any router and has no frontend consumer.
Keeping the raw shape therefore has zero live compatibility risk today, and the
classification defines exactly which responses must move when SSO is wired.

## Runtime gap

No IdP is configured and the handlers are unmounted, so the packet's login
round-trip cannot run. Recorded explicitly; owned by the future SSO packet.

## Follow-up boundary

- #1–#3: stay raw.
- #4: move to `common.Success` with session integration + SPA consumer.
- #5–#6: move to `common.Success` with their SPA consumer.
