-- High-traffic index optimizations for pantheon-base
-- Addresses N+1 query patterns and slow dashboard aggregates

-- Session list by user (frequent query in session management)
-- Used by: GET /api/v1/auth/sessions (user's active sessions)
-- Use procedure to conditionally create index (works across all MySQL 8.0.x)
DELIMITER $$
CREATE PROCEDURE create_index_if_not_exists_user_session()
BEGIN
    DECLARE CONTINUE HANDLER FOR 1061 BEGIN END;
    CREATE INDEX idx_user_session_user_revoked_expires
    ON system_user_session(user_id, revoked_at, refresh_expires_at);
END$$
DELIMITER ;
CALL create_index_if_not_exists_user_session();
DROP PROCEDURE create_index_if_not_exists_user_session;

-- Security dashboard aggregates (slow on 100K+ events)
-- Used by: Security event filtering and statistics
DELIMITER $$
CREATE PROCEDURE create_index_if_not_exists_security_event()
BEGIN
    DECLARE CONTINUE HANDLER FOR 1061 BEGIN END;
    CREATE INDEX idx_security_event_severity_ack_created
    ON system_auth_security_event(severity, acknowledged, created_at);
END$$
DELIMITER ;
CALL create_index_if_not_exists_security_event();
DROP PROCEDURE create_index_if_not_exists_security_event;

-- Casbin permission check (role + resource path)
-- Current index (v0, v1, v2) misses ptype filter, causing table scans
DELIMITER $$
CREATE PROCEDURE create_index_if_not_exists_casbin()
BEGIN
    DECLARE CONTINUE HANDLER FOR 1061 BEGIN END;
    CREATE INDEX idx_casbin_ptype_v0_v1
    ON casbin_rule(ptype, v0, v1);
END$$
DELIMITER ;
CALL create_index_if_not_exists_casbin();
DROP PROCEDURE create_index_if_not_exists_casbin;
