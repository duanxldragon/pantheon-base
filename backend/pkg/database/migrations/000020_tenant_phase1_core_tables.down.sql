-- Rollback: Tenant Phase 1 Core Tables Tenant Isolation
-- Remove tenant_id columns and restore original unique constraints

-- ============================================================================
-- Phase 1.7: I18n Tables (reverse order)
-- ============================================================================

SET @i18n_locale_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_i18n_locale'
);

SET @i18n_locale_drop_col_stmt := IF(
  @i18n_locale_table_exists > 0,
  'ALTER TABLE `system_i18n_locale` DROP COLUMN `tenant_id`',
  'SELECT "system_i18n_locale table does not exist, skipping"'
);
PREPARE i18n_locale_drop_col_stmt FROM @i18n_locale_drop_col_stmt;
EXECUTE i18n_locale_drop_col_stmt;
DEALLOCATE PREPARE i18n_locale_drop_col_stmt;

-- ============================================================================
-- Phase 1.6: Data Scope Tables
-- ============================================================================

SET @data_scope_policy_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'permission_role_data_scope_policy'
);

SET @data_scope_policy_drop_col_stmt := IF(
  @data_scope_policy_table_exists > 0,
  'ALTER TABLE `permission_role_data_scope_policy` DROP COLUMN `tenant_id`',
  'SELECT "permission_role_data_scope_policy table does not exist, skipping"'
);
PREPARE data_scope_policy_drop_col_stmt FROM @data_scope_policy_drop_col_stmt;
EXECUTE data_scope_policy_drop_col_stmt;
DEALLOCATE PREPARE data_scope_policy_drop_col_stmt;

ALTER TABLE `system_role_data_scope`
  DROP INDEX `idx_role_data_scope_tenant_role`,
  DROP COLUMN `tenant_id`;

-- ============================================================================
-- Phase 1.5: Hierarchy Closure Tables
-- ============================================================================

SET @dept_closures_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_dept_closures'
);

SET @dept_closures_drop_col_stmt := IF(
  @dept_closures_table_exists > 0,
  'ALTER TABLE `system_dept_closures` DROP COLUMN `tenant_id`',
  'SELECT "system_dept_closures table does not exist, skipping"'
);
PREPARE dept_closures_drop_col_stmt FROM @dept_closures_drop_col_stmt;
EXECUTE dept_closures_drop_col_stmt;
DEALLOCATE PREPARE dept_closures_drop_col_stmt;

SET @dept_ancestors_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_dept_ancestors'
);

SET @dept_ancestors_drop_col_stmt := IF(
  @dept_ancestors_table_exists > 0,
  'ALTER TABLE `system_dept_ancestors` DROP COLUMN `tenant_id`',
  'SELECT "system_dept_ancestors table does not exist, skipping"'
);
PREPARE dept_ancestors_drop_col_stmt FROM @dept_ancestors_drop_col_stmt;
EXECUTE dept_ancestors_drop_col_stmt;
DEALLOCATE PREPARE dept_ancestors_drop_col_stmt;

-- ============================================================================
-- Phase 1.4: Configuration Tables
-- ============================================================================

ALTER TABLE `system_setting`
  DROP INDEX `uk_system_setting_tenant_key`,
  ADD UNIQUE INDEX `idx_system_setting_setting_key` (`setting_key`),
  DROP COLUMN `tenant_id`;

-- ============================================================================
-- Phase 1.3: Relationship Tables
-- ============================================================================

SET @user_dept_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_user_dept'
);

SET @user_dept_drop_col_stmt := IF(
  @user_dept_table_exists > 0,
  'ALTER TABLE `system_user_dept` DROP COLUMN `tenant_id`',
  'SELECT "system_user_dept table does not exist, skipping"'
);
PREPARE user_dept_drop_col_stmt FROM @user_dept_drop_col_stmt;
EXECUTE user_dept_drop_col_stmt;
DEALLOCATE PREPARE user_dept_drop_col_stmt;

ALTER TABLE `system_user_role`
  DROP INDEX `idx_system_user_role_tenant_user`,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (`user_id`, `role_id`),
  DROP COLUMN `tenant_id`;

ALTER TABLE `system_role_permission`
  DROP INDEX `uk_role_permission_tenant`,
  ADD UNIQUE INDEX `idx_role_permission_unique` (`role_id`, `permission_key`),
  DROP COLUMN `tenant_id`;

ALTER TABLE `system_role_menu`
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (`role_id`, `menu_id`),
  DROP COLUMN `tenant_id`;

-- ============================================================================
-- Phase 1.2: Organization Structure Tables
-- ============================================================================

ALTER TABLE `system_post`
  DROP INDEX `uk_system_post_tenant_code`,
  ADD UNIQUE INDEX `idx_system_post_post_code` (`post_code`),
  DROP COLUMN `tenant_id`;

ALTER TABLE `system_dept`
  DROP INDEX `uk_system_dept_tenant_code`,
  ADD UNIQUE INDEX `idx_system_dept_dept_code` (`dept_code`),
  DROP COLUMN `tenant_id`;

-- ============================================================================
-- Phase 1.1: Core Authentication Tables
-- ============================================================================

SET @permission_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'system_permission'
);

SET @permission_drop_col_stmt := IF(
  @permission_table_exists > 0,
  'ALTER TABLE `system_permission` DROP COLUMN `tenant_id`',
  'SELECT "system_permission table does not exist, skipping"'
);
PREPARE permission_drop_col_stmt FROM @permission_drop_col_stmt;
EXECUTE permission_drop_col_stmt;
DEALLOCATE PREPARE permission_drop_col_stmt;

ALTER TABLE `system_menu`
  DROP INDEX `idx_system_menu_tenant_parent`,
  DROP COLUMN `tenant_id`;

ALTER TABLE `system_role`
  DROP INDEX `uk_system_role_tenant_key`,
  ADD UNIQUE INDEX `idx_system_role_role_key` (`role_key`),
  DROP COLUMN `tenant_id`;

ALTER TABLE `system_user`
  DROP INDEX `uk_system_user_tenant_username`,
  ADD UNIQUE INDEX `idx_system_user_username` (`username`),
  DROP COLUMN `tenant_id`;
