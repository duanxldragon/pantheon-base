ALTER TABLE `system_auth_mfa_challenge`
  ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `user_id`,
  ADD INDEX `idx_system_auth_mfa_challenge_tenant_id` (`tenant_id`);
