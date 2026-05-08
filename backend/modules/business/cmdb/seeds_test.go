package cmdb

import (
	"testing"

	"pantheon-platform/backend/pkg/testmysql"

	"gorm.io/gorm"
)

func TestSeedHostMenusCreatesCmdbPagesAndActionPermissions(t *testing.T) {
	db := testmysql.Open(t)
	mustCreateCmdbSeedTables(t, db)
	if err := db.Exec("INSERT INTO system_role (id, role_key) VALUES (1, 'admin')").Error; err != nil {
		t.Fatalf("seed admin role: %v", err)
	}

	if err := seedHostMenus(db); err != nil {
		t.Fatalf("seed cmdb menus: %v", err)
	}

	assertCmdbRecordCount(t, db, "system_menu", "path = '/operations/cmdb/host' AND page_perm = 'business:cmdb:host:list'", 1)
	assertCmdbRecordCount(t, db, "system_menu", "path = '/operations/cmdb/group' AND page_perm = 'business:cmdb:group:list'", 1)
	assertCmdbRecordCount(t, db, "system_menu", "perms = 'business:cmdb:host:create' AND type = 'F'", 1)
	assertCmdbRecordCount(t, db, "system_menu", "perms = 'business:cmdb:host:collect' AND type = 'F'", 1)
	assertCmdbRecordCount(t, db, "system_menu", "perms = 'business:cmdb:group:delete' AND type = 'F'", 1)
	assertCmdbRecordCount(t, db, "system_role_permission", "role_id = 1 AND permission_key = 'business:cmdb:host:list'", 1)
	assertCmdbRecordCount(t, db, "system_role_permission", "role_id = 1 AND permission_key = 'business:cmdb:host:create'", 1)
	assertCmdbRecordCount(t, db, "system_role_permission", "role_id = 1 AND permission_key = 'business:cmdb:group:delete'", 1)
	assertCmdbRecordCount(t, db, "system_role_menu", "role_id = 1", 4)
}

func mustCreateCmdbSeedTables(t *testing.T, db *gorm.DB) {
	t.Helper()
	statements := []string{
		`CREATE TABLE system_role (
			id BIGINT PRIMARY KEY AUTO_INCREMENT,
			role_key VARCHAR(64)
		)`,
		`CREATE TABLE system_menu (
			id BIGINT PRIMARY KEY AUTO_INCREMENT,
			parent_id BIGINT,
			title_key VARCHAR(128),
			path VARCHAR(255),
			component VARCHAR(255),
			page_perm VARCHAR(255),
			perms VARCHAR(255),
			type VARCHAR(8),
			icon VARCHAR(64),
			route_name VARCHAR(128),
			module VARCHAR(64),
			sort INT,
			is_visible INT,
			is_cache INT,
			created_at DATETIME,
			updated_at DATETIME
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
		`CREATE TABLE system_dict_type (
			id BIGINT PRIMARY KEY AUTO_INCREMENT,
			dict_code VARCHAR(64),
			dict_name VARCHAR(64),
			module VARCHAR(64),
			status INT,
			created_at DATETIME,
			updated_at DATETIME
		)`,
		`CREATE TABLE system_dict_item (
			id BIGINT PRIMARY KEY AUTO_INCREMENT,
			dict_code VARCHAR(64),
			item_label_key VARCHAR(128),
			item_value VARCHAR(64),
			sort INT,
			status INT,
			created_at DATETIME,
			updated_at DATETIME
		)`,
	}
	for _, statement := range statements {
		if err := db.Exec(statement).Error; err != nil {
			t.Fatalf("create seed table: %v", err)
		}
	}
}

func assertCmdbRecordCount(t *testing.T, db *gorm.DB, table string, where string, expected int64) {
	t.Helper()
	var count int64
	if err := db.Table(table).Where(where).Count(&count).Error; err != nil {
		t.Fatalf("count %s: %v", table, err)
	}
	if count != expected {
		t.Fatalf("unexpected %s count for %q: got %d want %d", table, where, count, expected)
	}
}
