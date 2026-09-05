-- High-traffic index optimizations for pantheon-base
-- Addresses N+1 query patterns and slow dashboard aggregates

-- Session list by user (frequent query in session management)
-- Used by: GET /api/v1/auth/sessions (user's active sessions)
-- MySQL 8.0 does not support CREATE INDEX IF NOT EXISTS, so drop first
DROP INDEX IF EXISTS idx_user_session_user_revoked_expires ON system_user_session;
CREATE INDEX idx_user_session_user_revoked_expires
ON system_user_session(user_id, revoked_at, refresh_expires_at);

-- Security dashboard aggregates (slow on 100K+ events)
-- Used by: Security event filtering and statistics
DROP INDEX IF EXISTS idx_security_event_severity_ack_created ON system_auth_security_event;
CREATE INDEX idx_security_event_severity_ack_created
ON system_auth_security_event(severity, acknowledged, created_at);

-- Casbin permission check (role + resource path)
-- Current index (v0, v1, v2) misses ptype filter, causing table scans
DROP INDEX IF EXISTS idx_casbin_ptype_v0_v1 ON casbin_rule;
CREATE INDEX idx_casbin_ptype_v0_v1
ON casbin_rule(ptype, v0, v1);
