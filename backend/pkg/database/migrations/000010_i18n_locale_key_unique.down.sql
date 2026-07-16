-- Deduplicated rows are not restorable; only drop the index when present.
SET @index_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'system_i18n'
    AND index_name = 'uidx_system_i18n_locale_key'
);
SET @ddl := IF(
  @index_exists > 0,
  'DROP INDEX uidx_system_i18n_locale_key ON system_i18n',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
