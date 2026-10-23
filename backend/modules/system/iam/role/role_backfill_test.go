package role

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// TestBackfillRolePermissionsStampsTenantAndDeduplicates pins the bootstrap
// backfill: permission rows are keyed by (tenant_id, role_id, permission_key),
// but the select used to read role menus without joining the owning role, so
// every backfilled row landed in tenant 0. Two menus exposing the same key also
// produced duplicate seeds. The backfill must stamp the role's tenant, keep one
// row per natural key and stay idempotent across restarts.
func TestBackfillRolePermissionsStampsTenantAndDeduplicates(t *testing.T) {
	db := setupRoleTestDB(t)
	service := NewRoleService(db)

	platformRole := SystemRole{TenantID: 0, RoleName: "Platform", RoleKey: "platform_backfill", Status: 1}
	tenantRole := SystemRole{TenantID: 700, RoleName: "Tenant", RoleKey: "tenant_backfill", Status: 1}
	deletedRole := SystemRole{
		TenantID: 700,
		RoleName: "Deleted",
		RoleKey:  "deleted_backfill",
		Status:   1,
		DeletedAt: gorm.DeletedAt{
			Time:  time.Now(),
			Valid: true,
		},
	}
	require.NoError(t, db.Create(&platformRole).Error)
	require.NoError(t, db.Create(&tenantRole).Error)
	require.NoError(t, db.Create(&deletedRole).Error)

	// Menu 1 and the extra menu 3 expose the same permission key, so the tenant
	// role would seed it twice.
	require.NoError(t, db.Exec(
		"INSERT INTO system_menu (id, page_perm, perms, type) VALUES (3, 'sys:user:list', '', 'F')",
	).Error)
	grants := []SystemRoleMenu{
		{TenantID: 0, RoleID: platformRole.ID, MenuID: 1},
		{TenantID: 700, RoleID: tenantRole.ID, MenuID: 1},
		{TenantID: 700, RoleID: tenantRole.ID, MenuID: 2},
		{TenantID: 700, RoleID: tenantRole.ID, MenuID: 3},
		{TenantID: 700, RoleID: deletedRole.ID, MenuID: 1},
	}
	for _, grant := range grants {
		require.NoError(t, db.Create(&grant).Error)
	}

	require.NoError(t, service.backfillRolePermissions())

	type permissionRow struct {
		TenantID      uint64 `gorm:"column:tenant_id"`
		RoleID        uint64 `gorm:"column:role_id"`
		PermissionKey string `gorm:"column:permission_key"`
	}
	loadRows := func() []permissionRow {
		t.Helper()
		var rows []permissionRow
		require.NoError(t, db.Table("system_role_permission").
			Select("tenant_id, role_id, permission_key").
			Order("tenant_id asc, role_id asc, permission_key asc").
			Scan(&rows).Error)
		return rows
	}

	rows := loadRows()
	assert.ElementsMatch(t, []permissionRow{
		{TenantID: 0, RoleID: platformRole.ID, PermissionKey: "sys:user:list"},
		{TenantID: 700, RoleID: tenantRole.ID, PermissionKey: "sys:user:create"},
		{TenantID: 700, RoleID: tenantRole.ID, PermissionKey: "sys:user:list"},
	}, rows, "backfill must stamp the owning tenant, deduplicate keys and skip deleted roles")

	// Re-running bootstrap must not insert a second copy.
	require.NoError(t, service.backfillRolePermissions())
	assert.Equal(t, rows, loadRows(), "backfill must be idempotent")
}

// TestBackfillRolePermissionsRepairsPlatformNamespaceGrants pins the repair for
// grants a pre-fix backfill stamped with tenant_id = 0 even though the role is
// tenant-owned. Two situations must be handled in this order: a stale row whose
// key the role already owns under its real tenant is a duplicate and must be
// deleted (updating it would violate uk_role_permission_tenant), while a stale
// row with no owner must be re-stamped. Platform grants and grants of
// soft-deleted roles are out of scope and must not move.
func TestBackfillRolePermissionsRepairsPlatformNamespaceGrants(t *testing.T) {
	db := setupRoleTestDB(t)
	service := NewRoleService(db)

	platformRole := SystemRole{TenantID: 0, RoleName: "Platform", RoleKey: "platform_repair", Status: 1}
	tenantRole := SystemRole{TenantID: 700, RoleName: "Tenant", RoleKey: "tenant_repair", Status: 1}
	deletedRole := SystemRole{
		TenantID: 700,
		RoleName: "Deleted",
		RoleKey:  "deleted_repair",
		Status:   1,
		DeletedAt: gorm.DeletedAt{
			Time:  time.Now(),
			Valid: true,
		},
	}
	require.NoError(t, db.Create(&platformRole).Error)
	require.NoError(t, db.Create(&tenantRole).Error)
	require.NoError(t, db.Create(&deletedRole).Error)

	grants := []SystemRolePermission{
		{TenantID: 0, RoleID: tenantRole.ID, PermissionKey: "sys:tenant:list"},
		{TenantID: 0, RoleID: tenantRole.ID, PermissionKey: "sys:user:list"},
		{TenantID: 700, RoleID: tenantRole.ID, PermissionKey: "sys:user:list"},
		{TenantID: 0, RoleID: platformRole.ID, PermissionKey: "sys:tenant:list"},
		{TenantID: 0, RoleID: deletedRole.ID, PermissionKey: "sys:tenant:list"},
	}
	for i := range grants {
		require.NoError(t, db.Create(&grants[i]).Error)
	}

	require.NoError(t, service.backfillRolePermissions())

	type permissionRow struct {
		TenantID      uint64 `gorm:"column:tenant_id"`
		RoleID        uint64 `gorm:"column:role_id"`
		PermissionKey string `gorm:"column:permission_key"`
	}
	loadRows := func() []permissionRow {
		t.Helper()
		var rows []permissionRow
		require.NoError(t, db.Table("system_role_permission").
			Select("tenant_id, role_id, permission_key").
			Order("tenant_id asc, role_id asc, permission_key asc").
			Scan(&rows).Error)
		return rows
	}

	rows := loadRows()
	assert.ElementsMatch(t, []permissionRow{
		{TenantID: 700, RoleID: tenantRole.ID, PermissionKey: "sys:tenant:list"},
		{TenantID: 700, RoleID: tenantRole.ID, PermissionKey: "sys:user:list"},
		{TenantID: 0, RoleID: platformRole.ID, PermissionKey: "sys:tenant:list"},
		{TenantID: 0, RoleID: deletedRole.ID, PermissionKey: "sys:tenant:list"},
	}, rows, "stale tenant grants must be re-stamped or deduplicated, platform and deleted-role grants untouched")

	require.NoError(t, service.backfillRolePermissions())
	assert.Equal(t, rows, loadRows(), "the repair must be idempotent")
}
