package system

import (
	"strings"
	"testing"
	"time"

	"pantheon-platform/backend/pkg/database"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type permissionTestRole struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement"`
	RoleName  string         `gorm:"size:64;not null"`
	RoleKey   string         `gorm:"size:64;not null;uniqueIndex"`
	Sort      int            `gorm:"default:0"`
	Status    int            `gorm:"default:1"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (permissionTestRole) TableName() string {
	return "system_role"
}

type permissionTestRoleMenu struct {
	RoleID uint64 `gorm:"primaryKey;autoIncrement:false"`
	MenuID uint64 `gorm:"primaryKey;autoIncrement:false"`
}

func (permissionTestRoleMenu) TableName() string {
	return "system_role_menu"
}

type permissionTestRolePermission struct {
	ID            uint64 `gorm:"primaryKey;autoIncrement"`
	RoleID        uint64 `gorm:"not null"`
	PermissionKey string `gorm:"size:128;not null"`
}

func (permissionTestRolePermission) TableName() string {
	return "system_role_permission"
}

type permissionTestMenu struct {
	ID       uint64 `gorm:"primaryKey;autoIncrement"`
	TitleKey string `gorm:"size:64;not null"`
	Path     string `gorm:"size:255;default:''"`
	PagePerm string `gorm:"size:128;default:''"`
	Perms    string `gorm:"size:128;default:''"`
	Type     string `gorm:"size:1;default:'M'"`
	Module   string `gorm:"size:64;default:'system'"`
	Sort     int    `gorm:"default:0"`
}

func (permissionTestMenu) TableName() string {
	return "system_menu"
}

func setupPermissionTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(
		&permissionTestRole{},
		&permissionTestRoleMenu{},
		&permissionTestRolePermission{},
		&permissionTestMenu{},
		&database.CasbinRule{},
	); err != nil {
		t.Fatalf("migrate permission fixtures: %v", err)
	}

	return db
}

func TestPermissionService_GetWorkbench(t *testing.T) {
	db := setupPermissionTestDB(t)
	service := NewPermissionService(db)

	if err := db.Create(&permissionTestRole{ID: 1, RoleName: "管理员", RoleKey: "admin", Status: 1, Sort: 1}).Error; err != nil {
		t.Fatalf("seed role1: %v", err)
	}
	if err := db.Create(&permissionTestRole{ID: 2, RoleName: "编辑", RoleKey: "editor", Status: 1, Sort: 2}).Error; err != nil {
		t.Fatalf("seed role2: %v", err)
	}
	menus := []permissionTestMenu{
		{ID: 10, TitleKey: "system.menu.user", Path: "/system/user", Module: "system", Type: "C", PagePerm: "system:user:list"},
		{ID: 11, TitleKey: "system.permission.user.create", Path: "/system/user", Module: "system", Type: "F", Perms: "system:user:create"},
		{ID: 12, TitleKey: "system.menu.role", Path: "/system/role", Module: "system", Type: "C", PagePerm: "system:role:list"},
	}
	if err := db.Create(&menus).Error; err != nil {
		t.Fatalf("seed menus: %v", err)
	}
	if err := db.Create(&[]permissionTestRoleMenu{
		{RoleID: 2, MenuID: 10},
		{RoleID: 2, MenuID: 12},
	}).Error; err != nil {
		t.Fatalf("seed role menus: %v", err)
	}
	if err := db.Create(&[]permissionTestRolePermission{
		{RoleID: 2, PermissionKey: "system:user:list"},
		{RoleID: 2, PermissionKey: "system:user:create"},
	}).Error; err != nil {
		t.Fatalf("seed role permissions: %v", err)
	}
	if err := db.Create(&database.CasbinRule{
		PType: "p",
		V0:    "editor",
		V1:    "/api/v1/system/user/list",
		V2:    "GET",
	}).Error; err != nil {
		t.Fatalf("seed casbin rule: %v", err)
	}

	workbench, err := service.GetWorkbench(&PermissionWorkbenchQuery{RoleKey: "editor"})
	if err != nil {
		t.Fatalf("get workbench: %v", err)
	}
	if workbench.Overview.RoleCount != 1 {
		t.Fatalf("expected 1 role, got %d", workbench.Overview.RoleCount)
	}
	if len(workbench.Roles) != 1 {
		t.Fatalf("expected 1 role row, got %d", len(workbench.Roles))
	}

	role := workbench.Roles[0]
	if role.RoleKey != "editor" {
		t.Fatalf("expected role editor, got %s", role.RoleKey)
	}
	if role.MenuCount != 2 {
		t.Fatalf("expected 2 menus, got %d", role.MenuCount)
	}
	if role.PagePermissionCount != 1 {
		t.Fatalf("expected 1 page permission, got %d", role.PagePermissionCount)
	}
	if role.ActionPermissionCount != 1 {
		t.Fatalf("expected 1 action permission, got %d", role.ActionPermissionCount)
	}
	if role.APIPolicyCount != 1 {
		t.Fatalf("expected 1 api policy, got %d", role.APIPolicyCount)
	}
	if role.UnknownPermissionCount != 0 {
		t.Fatalf("expected 0 unknown permissions, got %d", role.UnknownPermissionCount)
	}
}

func TestPermissionService_GetWorkbenchExcludesDeletedRoles(t *testing.T) {
	db := setupPermissionTestDB(t)
	service := NewPermissionService(db)

	deletedAt := gorm.DeletedAt{Time: time.Now(), Valid: true}
	if err := db.Create(&permissionTestRole{ID: 1, RoleName: "Deleted Role", RoleKey: "__deleted_role_1", Status: 1, DeletedAt: deletedAt}).Error; err != nil {
		t.Fatalf("seed deleted role: %v", err)
	}
	if err := db.Create(&permissionTestRole{ID: 2, RoleName: "Active Role", RoleKey: "active_role", Status: 1}).Error; err != nil {
		t.Fatalf("seed active role: %v", err)
	}

	workbench, err := service.GetWorkbench(nil)
	if err != nil {
		t.Fatalf("get workbench: %v", err)
	}
	if workbench.Overview.RoleCount != 1 {
		t.Fatalf("expected 1 active role, got %d", workbench.Overview.RoleCount)
	}
	if len(workbench.Roles) != 1 || workbench.Roles[0].RoleKey != "active_role" {
		t.Fatalf("expected only active_role, got %+v", workbench.Roles)
	}
}

func TestPermissionService_MigrateRemovesOrphanPolicies(t *testing.T) {
	db := setupPermissionTestDB(t)
	service := NewPermissionService(db)

	deletedAt := gorm.DeletedAt{Time: time.Now(), Valid: true}
	if err := db.Create(&permissionTestRole{ID: 1, RoleName: "Active Role", RoleKey: "active_role", Status: 1}).Error; err != nil {
		t.Fatalf("seed active role: %v", err)
	}
	if err := db.Create(&permissionTestRole{ID: 2, RoleName: "Deleted Role", RoleKey: "__deleted_role_2", Status: 1, DeletedAt: deletedAt}).Error; err != nil {
		t.Fatalf("seed deleted role: %v", err)
	}
	if err := db.Create(&[]database.CasbinRule{
		{PType: "p", V0: "active_role", V1: "/api/v1/system/active", V2: "GET"},
		{PType: "p", V0: "missing_role", V1: "/api/v1/system/missing", V2: "GET"},
		{PType: "p", V0: "__deleted_role_2", V1: "/api/v1/system/deleted", V2: "GET"},
	}).Error; err != nil {
		t.Fatalf("seed casbin policies: %v", err)
	}

	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	var policies []database.CasbinRule
	if err := db.Model(&database.CasbinRule{}).Order("v0 asc").Find(&policies).Error; err != nil {
		t.Fatalf("list policies: %v", err)
	}
	if len(policies) != 1 || policies[0].V0 != "active_role" {
		t.Fatalf("expected only active role policy, got %+v", policies)
	}
}

func TestPermissionService_ImportTemplateAndExport(t *testing.T) {
	db := setupPermissionTestDB(t)
	service := NewPermissionService(db)

	if err := db.Create(&permissionTestRole{ID: 1, RoleName: "管理员", RoleKey: "admin", Status: 1}).Error; err != nil {
		t.Fatalf("seed role: %v", err)
	}

	template := service.BuildImportTemplate()
	if len(template.Rows) == 0 || !strings.HasPrefix(template.Rows[0][0], "#") {
		t.Fatalf("expected template to include ignored instruction rows, got %+v", template.Rows)
	}
	templateResult, err := service.ImportPolicies(append([][]string{template.Headers}, template.Rows...))
	if err != nil {
		t.Fatalf("import template comments: %v", err)
	}
	if !templateResult.Applied || templateResult.Created != 0 || templateResult.Failed != 0 {
		t.Fatalf("expected template comments to be ignored, got %+v", templateResult)
	}

	result, err := service.ImportPolicies([][]string{
		template.Headers,
		{"admin", "/api/v1/system/user/list", "GET"},
	})
	if err != nil {
		t.Fatalf("import policy: %v", err)
	}
	if !result.Applied || result.Created != 1 || result.Failed != 0 {
		t.Fatalf("unexpected import result: %+v", result)
	}

	exported, err := service.ExportPolicies(&PermissionPolicyQuery{RoleKey: "admin"})
	if err != nil {
		t.Fatalf("export policy: %v", err)
	}
	if len(exported.Rows) != 1 || exported.Rows[0][0] != "admin" || exported.Rows[0][2] != "GET" {
		t.Fatalf("unexpected export rows: %+v", exported.Rows)
	}
}
