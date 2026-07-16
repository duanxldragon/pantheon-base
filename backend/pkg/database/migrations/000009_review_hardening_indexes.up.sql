-- Add missing indexes found by the review hardening pass.
--
-- NOTE: a UNIQUE index on system_i18n (locale, locale_key) was considered but
-- deliberately NOT added here: the table uses GORM soft deletes (deleted_at),
-- so a strict unique index would block re-creating a soft-deleted key, and a
-- (locale, locale_key, deleted_at) unique index is ineffective for active rows
-- because NULL values never collide in MySQL unique indexes. Enforcing i18n
-- uniqueness requires a deleted_at semantics decision first (see fix-report).

ALTER TABLE system_menu
    ADD INDEX idx_system_menu_parent_id (parent_id);

ALTER TABLE system_dept
    ADD INDEX idx_system_dept_parent_id (parent_id);

ALTER TABLE system_role_menu
    ADD INDEX idx_system_role_menu_menu (menu_id);
