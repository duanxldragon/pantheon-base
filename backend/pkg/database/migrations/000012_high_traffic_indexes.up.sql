-- High-traffic index optimizations for pantheon-base
-- Addresses N+1 query patterns and slow dashboard aggregates

-- Session list by user (frequent query in session management)
-- Used by: GET /api/v1/auth/sessions (user's active sessions)
CREATE INDEX idx_user_session_user_revoked_expires
ON system_user_session(user_id, revoked_at, refresh_expires_at);

-- Casbin permission check (role + resource path)
-- Current index (v0, v1, v2) misses ptype filter, causing table scans
CREATE INDEX idx_casbin_ptype_v0_v1
ON casbin_rule(ptype, v0, v1);

-- NOTE: Security event index (severity, acknowledged, created_at) deferred
-- because system_auth_security_event table in 000001 is missing those columns.
-- The model (security_model.go) defines them, indicating a schema drift.
-- This index should be added in a future migration after the columns are added.
