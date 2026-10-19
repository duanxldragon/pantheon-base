package role

import (
	"testing"

	"github.com/duanxldragon/pantheon-base/backend/pkg/tenant"

	"gorm.io/gorm"
)

func tenantRoleService(db *gorm.DB, tenantID uint64) *RoleService {
	return NewRoleService(db).WithTenantContext(&tenant.Context{
		TenantID:   tenantID,
		Mode:       tenant.ModeMulti,
		ResolvedBy: tenant.ResolvedBySubject,
	})
}

func countRoleMenus(t *testing.T, db *gorm.DB, tenantID, roleID uint64) int64 {
	t.Helper()
	var count int64
	if err := db.Table("system_role_menu").
		Where("tenant_id = ? AND role_id = ?", tenantID, roleID).
		Count(&count).Error; err != nil {
		t.Fatalf("count role menus: %v", err)
	}
	return count
}

// F3: InsertRoleMenus used to omit tenant_id, so a tenant role's navigation
// grant landed in tenant 0 while loadRoleMenus read under the tenant scope. The
// grant was unreadable the moment it was saved, and a second edit deleted the
// rows it then failed to rewrite.
func TestCreateTenantRolePersistsMenusInRoleTenant(t *testing.T) {
	db := setupRoleTestDB(t)
	s := tenantRoleService(db, 282)

	created, err := s.CreateRole(&RoleCreateReq{
		RoleName: "Tenant Navigator",
		RoleKey:  "tenant_nav",
		Status:   1,
		MenuIDs:  []uint64{1},
	})
	if err != nil {
		t.Fatalf("create tenant role: %v", err)
	}

	if got := countRoleMenus(t, db, 282, created.ID); got != 1 {
		t.Fatalf("menus in tenant 282 = %d, want 1", got)
	}
	if got := countRoleMenus(t, db, 0, created.ID); got != 0 {
		t.Fatalf("menus in tenant 0 = %d, want 0 (grant must follow the role)", got)
	}

	// The read path the console uses must see the grant back.
	listed, err := s.ListRoles(&RoleListQuery{RoleKey: "tenant_nav", Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("list roles: %v", err)
	}
	if len(listed.Items) != 1 {
		t.Fatalf("expected one role in the list, got %d", len(listed.Items))
	}
	if len(listed.Items[0].MenuIDs) != 1 || listed.Items[0].MenuIDs[0] != 1 {
		t.Fatalf("menuIds echoed = %v, want [1]", listed.Items[0].MenuIDs)
	}

	// Re-saving the same role must not wipe the grant (the old bug deleted it
	// and then wrote it into a namespace the read path never saw).
	if _, err := s.UpdateRole(created.ID, &RoleUpdateReq{
		RoleName: "Tenant Navigator",
		RoleKey:  "tenant_nav",
		Status:   1,
		MenuIDs:  []uint64{1},
	}); err != nil {
		t.Fatalf("second edit: %v", err)
	}
	if got := countRoleMenus(t, db, 282, created.ID); got != 1 {
		t.Fatalf("menus after second edit in tenant 282 = %d, want 1", got)
	}

	// A different tenant must not see the grant through its own scope.
	other := tenantRoleService(db, 291)
	otherList, err := other.ListRoles(&RoleListQuery{RoleKey: "tenant_nav", Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("list roles as other tenant: %v", err)
	}
	if len(otherList.Items) != 0 {
		t.Fatalf("tenant 291 sees %d of tenant 282's roles, want 0", len(otherList.Items))
	}
}

// A platform administrator may edit a tenant role. The grant must follow the
// role row, not the caller's (platform) context.
func TestPlatformEditOfTenantRoleKeepsGrantInRoleTenant(t *testing.T) {
	db := setupRoleTestDB(t)
	tenantService := tenantRoleService(db, 282)

	created, err := tenantService.CreateRole(&RoleCreateReq{
		RoleName: "Tenant Navigator",
		RoleKey:  "tenant_nav_platform_edit",
		Status:   1,
		MenuIDs:  []uint64{1},
	})
	if err != nil {
		t.Fatalf("create tenant role: %v", err)
	}

	platformService := NewRoleService(db)
	if _, err := platformService.UpdateRole(created.ID, &RoleUpdateReq{
		RoleName: "Tenant Navigator Edited",
		RoleKey:  "tenant_nav_platform_edit",
		Status:   1,
		MenuIDs:  []uint64{1},
	}); err != nil {
		t.Fatalf("platform edit of tenant role: %v", err)
	}

	if got := countRoleMenus(t, db, 282, created.ID); got != 1 {
		t.Fatalf("menus in role's tenant = %d, want 1", got)
	}
	if got := countRoleMenus(t, db, 0, created.ID); got != 0 {
		t.Fatalf("menus in platform tenant = %d, want 0", got)
	}
}
