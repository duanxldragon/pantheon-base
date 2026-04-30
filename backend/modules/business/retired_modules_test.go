package business

import (
	"testing"

	"pantheon-platform/backend/pkg/testmysql"

	"gorm.io/gorm"
)

func TestCleanupRetiredBusinessModules_PreservesManagedGeneratedModules(t *testing.T) {
	db := openRetiredModuleTestDB(t)
	mustCreateRetiredModuleGovernanceTables(t, db)
	mustCreateRetiredModuleBusinessTable(t, db, "biz_cmdb_host")

	mustInsertRetiredMenu(t, db, "/business/cmdb/host", "business.cmdb.host")
	mustInsertRetiredPermission(t, db, "business:cmdb:host:view")
	mustInsertRetiredI18n(t, db, "business.cmdb.host")
	mustInsertManagedRegistration(t, db, "business.cmdb.host", "biz_cmdb_host", 1)

	if err := cleanupRetiredBusinessModules(db); err != nil {
		t.Fatalf("cleanup retired modules: %v", err)
	}

	assertTableExists(t, db, "biz_cmdb_host")
	assertRecordCount(t, db, "system_menu", "module = 'business.cmdb.host'", 1)
	assertRecordCount(t, db, "system_role_permission", "permission_key = 'business:cmdb:host:view'", 1)
	assertRecordCount(t, db, "system_i18n", "module = 'business.cmdb.host'", 1)
	assertRecordCount(t, db, "system_module_registration", "name = 'business.cmdb.host'", 1)
}

func TestCleanupRetiredBusinessModules_RemovesLegacyMetadataWithoutDroppingBusinessTables(t *testing.T) {
	db := openRetiredModuleTestDB(t)
	mustCreateRetiredModuleGovernanceTables(t, db)
	mustCreateRetiredModuleBusinessTable(t, db, "biz_cmdb_host")

	mustInsertRetiredMenu(t, db, "/business/cmdb/host", "business.cmdb")
	mustInsertRetiredPermission(t, db, "business:cmdb:host:view")
	mustInsertRetiredI18n(t, db, "business.cmdb.host")

	if err := cleanupRetiredBusinessModules(db); err != nil {
		t.Fatalf("cleanup retired modules: %v", err)
	}

	assertTableExists(t, db, "biz_cmdb_host")
	assertRecordCount(t, db, "system_menu", "1 = 1", 0)
	assertRecordCount(t, db, "system_role_permission", "1 = 1", 0)
	assertRecordCount(t, db, "system_i18n", "1 = 1", 0)
}

func openRetiredModuleTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	return testmysql.Open(t)
}

func mustCreateRetiredModuleGovernanceTables(t *testing.T, db *gorm.DB) {
	t.Helper()
	statements := []string{
		`CREATE TABLE system_menu (
			id BIGINT PRIMARY KEY AUTO_INCREMENT,
			path VARCHAR(255),
			type VARCHAR(8),
			module VARCHAR(64),
			component VARCHAR(255),
			page_perm VARCHAR(255),
			perms VARCHAR(255)
		)`,
		`CREATE TABLE system_role_menu (
			id BIGINT PRIMARY KEY AUTO_INCREMENT,
			role_id BIGINT,
			menu_id BIGINT
		)`,
		`CREATE TABLE system_role_permission (
			id BIGINT PRIMARY KEY AUTO_INCREMENT,
			role_id BIGINT,
			permission_key VARCHAR(255)
		)`,
		`CREATE TABLE system_i18n (
			id BIGINT PRIMARY KEY AUTO_INCREMENT,
			module VARCHAR(64)
		)`,
		`CREATE TABLE system_module_registration (
			id BIGINT PRIMARY KEY AUTO_INCREMENT,
			name VARCHAR(64),
			table_name VARCHAR(128),
			status INT
		)`,
	}
	for _, statement := range statements {
		if err := db.Exec(statement).Error; err != nil {
			t.Fatalf("create governance table failed: %v", err)
		}
	}
}

func mustCreateRetiredModuleBusinessTable(t *testing.T, db *gorm.DB, tableName string) {
	t.Helper()
	if err := db.Exec("CREATE TABLE " + tableName + " (id BIGINT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(64))").Error; err != nil {
		t.Fatalf("create business table %s: %v", tableName, err)
	}
}

func mustInsertRetiredMenu(t *testing.T, db *gorm.DB, path string, module string) {
	t.Helper()
	if err := db.Exec(
		`INSERT INTO system_menu (path, type, module, component, page_perm, perms) VALUES (?, 'C', ?, 'business/cmdb/host/CmdbHostList', 'business:cmdb:host:view', 'business:cmdb:host:view')`,
		path,
		module,
	).Error; err != nil {
		t.Fatalf("insert retired menu: %v", err)
	}
}

func mustInsertRetiredPermission(t *testing.T, db *gorm.DB, permissionKey string) {
	t.Helper()
	if err := db.Exec(`INSERT INTO system_role_permission (role_id, permission_key) VALUES (1, ?)`, permissionKey).Error; err != nil {
		t.Fatalf("insert retired permission: %v", err)
	}
}

func mustInsertRetiredI18n(t *testing.T, db *gorm.DB, module string) {
	t.Helper()
	if err := db.Exec(`INSERT INTO system_i18n (module) VALUES (?)`, module).Error; err != nil {
		t.Fatalf("insert retired i18n: %v", err)
	}
}

func mustInsertManagedRegistration(t *testing.T, db *gorm.DB, module string, tableName string, status int) {
	t.Helper()
	if err := db.Exec(`INSERT INTO system_module_registration (name, table_name, status) VALUES (?, ?, ?)`, module, tableName, status).Error; err != nil {
		t.Fatalf("insert managed registration: %v", err)
	}
}

func assertTableExists(t *testing.T, db *gorm.DB, tableName string) {
	t.Helper()
	if !db.Migrator().HasTable(tableName) {
		t.Fatalf("expected table %s to exist", tableName)
	}
}

func assertRecordCount(t *testing.T, db *gorm.DB, tableName string, where string, expected int64) {
	t.Helper()
	var count int64
	if err := db.Table(tableName).Where(where).Count(&count).Error; err != nil {
		t.Fatalf("count %s: %v", tableName, err)
	}
	if count != expected {
		t.Fatalf("unexpected %s count: got %d want %d", tableName, count, expected)
	}
}
