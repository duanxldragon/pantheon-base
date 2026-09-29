-- Tenant Phase 1: Core Tables Tenant Isolation
-- Add tenant_id to 16 core tables for multi-tenant data isolation
-- Contract: TENANT_CONTRACT_V1 §3.1 - Shared Schema MVP
-- Behavior: tenant_id=0 (compat mode) preserves existing behavior

-- ============================================================================
-- Phase 1.1: Core Authentication Tables
-- ============================================================================

-- Add tenant_id to system_user
ALTER TABLE `system_user`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`;

-- Change unique constraint from username-only to (tenant_id, username)
ALTER TABLE `system_user`
  DROP INDEX `idx_system_user_username`,
  ADD UNIQUE INDEX `uk_system_user_tenant_username` (`tenant_id`, `username`);

-- Add tenant_id to system_role
ALTER TABLE `system_role`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`;

-- Change unique constraint from role_key-only to (tenant_id, role_key)
ALTER TABLE `system_role`
  DROP INDEX `idx_system_role_role_key`,
  ADD UNIQUE INDEX `uk_system_role_tenant_key` (`tenant_id`, `role_key`);

-- Add tenant_id to system_menu
ALTER TABLE `system_menu`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`;

-- Add composite index for tenant-scoped menu queries
ALTER TABLE `system_menu`
  ADD INDEX `idx_system_menu_tenant_parent` (`tenant_id`, `parent_id`);

-- Add tenant_id to system_permission (if exists)
SET @permission_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_permission'
);

SET @permission_add_col_stmt := IF(
  @permission_table_exists > 0,
  'ALTER TABLE `system_permission` ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`',
  'SELECT "system_permission table does not exist, skipping"'
);
PREPARE permission_add_col_stmt FROM @permission_add_col_stmt;
EXECUTE permission_add_col_stmt;
DEALLOCATE PREPARE permission_add_col_stmt;

-- ============================================================================
-- Phase 1.2: Organization Structure Tables
-- ============================================================================

-- Add tenant_id to system_dept
ALTER TABLE `system_dept`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`;

-- Change unique constraint from dept_code-only to (tenant_id, dept_code)
ALTER TABLE `system_dept`
  DROP INDEX `idx_system_dept_dept_code`,
  ADD UNIQUE INDEX `uk_system_dept_tenant_code` (`tenant_id`, `dept_code`);

-- Add tenant_id to system_post
ALTER TABLE `system_post`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`;

-- Change unique constraint from post_code-only to (tenant_id, post_code)
ALTER TABLE `system_post`
  DROP INDEX `idx_system_post_post_code`,
  ADD UNIQUE INDEX `uk_system_post_tenant_code` (`tenant_id`, `post_code`);

-- ============================================================================
-- Phase 1.3: Relationship Tables
-- ============================================================================

-- Add tenant_id to system_role_menu
ALTER TABLE `system_role_menu`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0;

-- Recreate primary key with tenant_id
ALTER TABLE `system_role_menu`
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (`tenant_id`, `role_id`, `menu_id`);

-- Add tenant_id to system_role_permission
ALTER TABLE `system_role_permission`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`;

-- Update unique index to include tenant_id
ALTER TABLE `system_role_permission`
  DROP INDEX `idx_role_permission_unique`,
  ADD UNIQUE INDEX `uk_role_permission_tenant` (`tenant_id`, `role_id`, `permission_key`);

-- Add tenant_id to system_user_role
ALTER TABLE `system_user_role`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0;

-- Recreate primary key with tenant_id
ALTER TABLE `system_user_role`
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (`tenant_id`, `user_id`, `role_id`),
  ADD INDEX `idx_system_user_role_tenant_user` (`tenant_id`, `user_id`);

-- Add tenant_id to system_user_dept (if exists)
SET @user_dept_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_user_dept'
);

SET @user_dept_add_col_stmt := IF(
  @user_dept_table_exists > 0,
  'ALTER TABLE `system_user_dept` ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0',
  'SELECT "system_user_dept table does not exist, skipping"'
);
PREPARE user_dept_add_col_stmt FROM @user_dept_add_col_stmt;
EXECUTE user_dept_add_col_stmt;
DEALLOCATE PREPARE user_dept_add_col_stmt;

-- ============================================================================
-- Phase 1.4: Configuration Tables
-- ============================================================================

-- Add tenant_id to system_setting
ALTER TABLE `system_setting`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`;

-- Change unique constraint from setting_key-only to (tenant_id, setting_key)
ALTER TABLE `system_setting`
  DROP INDEX `idx_system_setting_setting_key`,
  ADD UNIQUE INDEX `uk_system_setting_tenant_key` (`tenant_id`, `setting_key`);

-- ============================================================================
-- Phase 1.5: Hierarchy Closure Tables (if exist)
-- ============================================================================

-- Add tenant_id to dept_ancestors (if exists)
SET @dept_ancestors_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_dept_ancestors'
);

SET @dept_ancestors_add_col_stmt := IF(
  @dept_ancestors_table_exists > 0,
  'ALTER TABLE `system_dept_ancestors` ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0',
  'SELECT "system_dept_ancestors table does not exist, skipping"'
);
PREPARE dept_ancestors_add_col_stmt FROM @dept_ancestors_add_col_stmt;
EXECUTE dept_ancestors_add_col_stmt;
DEALLOCATE PREPARE dept_ancestors_add_col_stmt;

-- Add tenant_id to dept_closures (if exists)
SET @dept_closures_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_dept_closures'
);

SET @dept_closures_add_col_stmt := IF(
  @dept_closures_table_exists > 0,
  'ALTER TABLE `system_dept_closures` ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0',
  'SELECT "system_dept_closures table does not exist, skipping"'
);
PREPARE dept_closures_add_col_stmt FROM @dept_closures_add_col_stmt;
EXECUTE dept_closures_add_col_stmt;
DEALLOCATE PREPARE dept_closures_add_col_stmt;

-- ============================================================================
-- Phase 1.6: Data Scope Tables
-- ============================================================================

-- Add tenant_id to system_role_data_scope
ALTER TABLE `system_role_data_scope`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`;

-- Add composite index for tenant-scoped queries
ALTER TABLE `system_role_data_scope`
  ADD INDEX `idx_role_data_scope_tenant_role` (`tenant_id`, `role_id`);

-- Add tenant_id to permission_role_data_scope_policy (if exists)
SET @data_scope_policy_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'permission_role_data_scope_policy'
);

SET @data_scope_policy_add_col_stmt := IF(
  @data_scope_policy_table_exists > 0,
  'ALTER TABLE `permission_role_data_scope_policy` ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`',
  'SELECT "permission_role_data_scope_policy table does not exist, skipping"'
);
PREPARE data_scope_policy_add_col_stmt FROM @data_scope_policy_add_col_stmt;
EXECUTE data_scope_policy_add_col_stmt;
DEALLOCATE PREPARE data_scope_policy_add_col_stmt;

-- ============================================================================
-- Phase 1.7: I18n Tables (if exist)
-- ============================================================================

-- Add tenant_id to i18n_locale (if exists)
SET @i18n_locale_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_i18n_locale'
);

SET @i18n_locale_add_col_stmt := IF(
  @i18n_locale_table_exists > 0,
  'ALTER TABLE `system_i18n_locale` ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`',
  'SELECT "system_i18n_locale table does not exist, skipping"'
);
PREPARE i18n_locale_add_col_stmt FROM @i18n_locale_add_col_stmt;
EXECUTE i18n_locale_add_col_stmt;
DEALLOCATE PREPARE i18n_locale_add_col_stmt;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify all tenant_id columns were added:
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE table_schema = DATABASE()
--   AND column_name = 'tenant_id'
-- ORDER BY table_name;
