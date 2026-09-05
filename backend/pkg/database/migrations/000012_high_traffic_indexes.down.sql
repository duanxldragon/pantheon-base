-- Rollback high-traffic indexes

DROP INDEX IF EXISTS idx_user_session_user_revoked_expires ON system_user_session;
DROP INDEX IF EXISTS idx_security_event_severity_ack_created ON system_auth_security_event;
DROP INDEX IF EXISTS idx_casbin_ptype_v0_v1 ON casbin_rule;
