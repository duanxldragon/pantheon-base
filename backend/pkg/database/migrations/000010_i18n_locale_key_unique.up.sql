-- Enforce i18n resource uniqueness on (locale, key) for upgraded legacy databases.
-- Fresh installs already get this index from database/system_init.sql, and the i18n
-- module Bootstrap creates it at runtime; this migration makes the guarantee part of
-- the versioned schema so upgrades no longer depend on application startup order.
--
-- Step 1: deduplicate — keep the newest row (highest id) per (locale, key),
-- matching the "latest write wins" semantics of the runtime normalizer.
DELETE older FROM system_i18n older
JOIN system_i18n newer
  ON older.locale = newer.locale
 AND older.`key` = newer.`key`
 AND older.id < newer.id;

-- Step 2: add the unique index only when absent (runtime Bootstrap may have
-- created it already on databases that ran an older binary).
SET @index_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'system_i18n'
    AND index_name = 'uidx_system_i18n_locale_key'
);
SET @ddl := IF(
  @index_exists = 0,
  'CREATE UNIQUE INDEX uidx_system_i18n_locale_key ON system_i18n (locale, `key`)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
