package system

import (
	"testing"

	"gorm.io/gorm"
	"pantheon-platform/backend/pkg/testmysql"
)

func setupMenuTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db := testmysql.Open(t)
	if err := db.AutoMigrate(&SystemMenu{}); err != nil {
		t.Fatalf("migrate menu: %v", err)
	}
	_ = db.Exec("CREATE TABLE IF NOT EXISTS system_role (id BIGINT PRIMARY KEY AUTO_INCREMENT, role_key VARCHAR(64), status INT)")
	_ = db.Exec("CREATE TABLE IF NOT EXISTS system_role_permission (role_id BIGINT, permission_key VARCHAR(128))")
	return db
}

func TestMenuServiceValidateMenuMetaRejectsUnknownRegisteredComponent(t *testing.T) {
	service := NewMenuService(setupMenuTestDB(t))

	err := service.validateMenuMeta(0, &MenuCreateReq{
		TitleKey:   "system.menu.example",
		Path:       "/system/example",
		Component:  "system/example/MissingPage",
		PagePerm:   "system:example:list",
		Type:       "C",
		RouteName:  "system-example",
		Module:     "system.iam",
		IsExternal: 0,
	})
	if err == nil || err.Error() != "menu.component.invalid" {
		t.Fatalf("expected menu.component.invalid, got %v", err)
	}
}

func TestMenuServiceValidateMenuMetaAcceptsRegisteredComponent(t *testing.T) {
	service := NewMenuService(setupMenuTestDB(t))

	err := service.validateMenuMeta(0, &MenuCreateReq{
		TitleKey:   "system.menu.user",
		Path:       "/system/user",
		Component:  "system/user/UserList",
		PagePerm:   "system:user:list",
		Type:       "C",
		RouteName:  "system-user",
		Module:     "system.iam",
		IsExternal: 0,
	})
	if err != nil {
		t.Fatalf("expected registered component to pass, got %v", err)
	}
}

func TestMenuServiceHasManageAccess(t *testing.T) {
	db := setupMenuTestDB(t)
	service := NewMenuService(db)

	if err := db.Exec("INSERT INTO system_role (id, role_key, status) VALUES (1, 'menu_manager', 1)").Error; err != nil {
		t.Fatalf("seed role: %v", err)
	}
	if err := db.Exec("INSERT INTO system_role_permission (role_id, permission_key) VALUES (1, 'system:menu:list')").Error; err != nil {
		t.Fatalf("seed role permission: %v", err)
	}

	allowed, err := service.HasManageAccess([]string{"menu_manager"})
	if err != nil {
		t.Fatalf("has manage access: %v", err)
	}
	if !allowed {
		t.Fatalf("expected menu_manager to have manage access")
	}

	allowed, err = service.HasManageAccess([]string{"guest"})
	if err != nil {
		t.Fatalf("has manage access for guest: %v", err)
	}
	if allowed {
		t.Fatalf("expected guest to have no manage access")
	}
}
