ALTER TABLE `system_auth_mfa_challenge`
  DROP INDEX `idx_system_auth_mfa_challenge_tenant_id`,
  DROP COLUMN `tenant_id`;
