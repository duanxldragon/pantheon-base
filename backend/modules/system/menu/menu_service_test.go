package system

import (
	"fmt"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupMenuTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&SystemMenu{}); err != nil {
		t.Fatalf("migrate menu: %v", err)
	}
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
