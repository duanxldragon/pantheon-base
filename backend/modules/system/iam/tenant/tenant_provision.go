package tenant

import (
	"errors"
	"fmt"
	"strings"

	"github.com/duanxldragon/pantheon-base/backend/pkg/common"
	"github.com/duanxldragon/pantheon-base/backend/pkg/common/security"
	"github.com/duanxldragon/pantheon-base/backend/pkg/database"
	"github.com/duanxldragon/pantheon-base/backend/pkg/rbacbind"
	tenantctx "github.com/duanxldragon/pantheon-base/backend/pkg/tenant"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Tenant-local role keys. They live in the tenant's own namespace
// (system_role.tenant_id = <tenant>), so every tenant may own its own copy
// without colliding with the platform's roles (contract §4/§7).
//
// The canonical values are declared in pkg/tenant so the middleware can
// recognise a tenant administrator without importing this module.
const (
	// TenantRoleAdminKey is the tenant administrator: the full console, with
	// every query automatically confined to the tenant (see ScopeTenantReads).
	TenantRoleAdminKey = tenantctx.TenantRoleAdminKey
	// TenantRoleMemberKey is a read-only tenant member.
	TenantRoleMemberKey = tenantctx.TenantRoleMemberKey
)

const (
	// sqlSelectMenuIdentity is the menu projection both the provisioning and the
	// repair paths classify on (module + path). One literal keeps the two
	// queries from drifting apart when a column is added.
	sqlSelectMenuIdentity = "id, module, path"
	// condTenantScopedRow restricts a repair statement to tenant-owned rows. The
	// platform namespace (tenant_id = 0) is never touched by the repair.
	condTenantScopedRow = "tenant_id <> ?"
)

// tenantRoleDefinition describes one provisioned tenant role.
type tenantRoleDefinition struct {
	Key     string
	Name    string
	Sort    int
	Methods []string // HTTP methods granted on /api/v1/*
}

// tenantRoleDefinitions is the role set every tenant is provisioned with.
//
// tenant_admin deliberately receives the same /api/v1/* breadth as the platform
// `admin` role: the chosen product model is "the full console, automatically
// confined to the caller's tenant". Confinement is enforced in two places —
// tenant-scoped reads (ScopeTenantReads) and a platform-capability gate on the
// tenant-console write routes — not by narrowing the Casbin surface, because a
// path allowlist here would silently rot as routes are added.
var tenantRoleDefinitions = []tenantRoleDefinition{
	{
		Key:     TenantRoleAdminKey,
		Name:    "租户管理员",
		Sort:    1,
		Methods: []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
	},
	{
		Key:     TenantRoleMemberKey,
		Name:    "租户成员",
		Sort:    2,
		Methods: []string{"GET"},
	},
}

// ErrTenantAdminUsernameTaken is returned when the requested tenant admin
// username already exists in the target tenant.
var ErrTenantAdminUsernameTaken = errors.New("tenant admin username already exists in this tenant")

// ProvisionInput carries everything needed to make a freshly created tenant
// usable. AdminUsername may be empty: the tenant roles and settings are still
// provisioned, but no login is created (the caller can add members later).
type ProvisionInput struct {
	TenantID      uint64
	AdminUsername string
	AdminPassword string
	AdminNickname string
}

// ProvisionResult reports what provisioning actually created.
type ProvisionResult struct {
	AdminUserID     uint64
	RoleIDs         map[string]uint64
	RootDeptID      uint64
	PolicyCount     int
	SettingsCopied  int64
	DictTypesCopied int64
	DictItemsCopied int64
}

// ProvisionTenant turns a bare `tenants` row into a usable tenant.
//
// Before this existed, CreateTenant inserted one row and nothing else —
// InitializeTenantDefaults was a documented no-op — so a new tenant had no
// administrator, no roles and no settings, and nobody could log into it. This
// runs the whole set in one transaction:
//
//  1. tenant-scoped roles (tenant_admin, tenant_member)
//  2. the tenant's administrator user, owned by the tenant (system_user.tenant_id)
//  3. the admin's role binding, in the tenant's namespace
//  4. the owner membership that the login issuance gate requires
//  5. Casbin policies for role:<key>@tenant:<id>
//  6. a copy of the platform settings so the tenant renders with sane defaults
//  7. a copy of the platform default dictionaries (same idempotent pattern)
//
// Everything is idempotent: re-running for an existing tenant re-creates only
// what is missing, so it doubles as a repair entry point.
func (s *Service) ProvisionTenant(in ProvisionInput) (*ProvisionResult, error) {
	if s.db == nil {
		return nil, errors.New("tenant provision: database not initialized")
	}
	if in.TenantID == 0 {
		return nil, errors.New("tenant provision: tenant id is required")
	}
	if _, err := s.GetTenantByID(in.TenantID); err != nil {
		return nil, err
	}

	result := &ProvisionResult{RoleIDs: make(map[string]uint64)}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		roleIDs, err := provisionTenantRoles(tx, in.TenantID)
		if err != nil {
			return err
		}
		result.RoleIDs = roleIDs

		if err := provisionTenantRoleMenus(tx, in.TenantID, roleIDs); err != nil {
			return err
		}

		if err := provisionTenantRoleBindings(tx, in.TenantID, roleIDs); err != nil {
			return err
		}
		// Re-provisioning is the repair entry point: clear grants that a pre-fix
		// copy left behind before returning.
		if err := repairTenantPlatformGrants(tx, in.TenantID); err != nil {
			return err
		}

		rootDeptID, err := provisionTenantRootDept(tx, in.TenantID)
		if err != nil {
			return err
		}
		result.RootDeptID = rootDeptID

		if strings.TrimSpace(in.AdminUsername) == "" {
			return nil
		}

		userID, err := provisionTenantAdminUser(tx, in)
		if err != nil {
			return err
		}
		result.AdminUserID = userID

		if err := provisionTenantAdminBinding(tx, in.TenantID, userID, roleIDs); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	// Casbin writes go through the shared synced enforcer, which has its own
	// adapter and therefore cannot join the SQL transaction above. They are
	// idempotent (AddPolicy is a no-op when the rule exists), so a partial
	// failure is repaired by re-running provisioning.
	result.PolicyCount = grantTenantRolePolicies(in.TenantID)

	settings, err := s.copyPlatformSettingsToTenant(in.TenantID)
	if err != nil {
		return nil, err
	}
	result.SettingsCopied = settings

	dictTypes, dictItems, err := s.copyPlatformDictsToTenant(in.TenantID)
	if err != nil {
		return nil, err
	}
	result.DictTypesCopied = dictTypes
	result.DictItemsCopied = dictItems

	return result, nil
}

// provisionTenantRoles ensures the tenant owns its role set and returns the
// role_key -> role_id map.
func provisionTenantRoles(tx *gorm.DB, tenantID uint64) (map[string]uint64, error) {
	roleIDs := make(map[string]uint64, len(tenantRoleDefinitions))
	for _, def := range tenantRoleDefinitions {
		var existing struct{ ID uint64 }
		err := tx.Table("system_role").
			Select("id").
			Where("tenant_id = ? AND role_key = ?", tenantID, def.Key).
			Limit(1).
			Scan(&existing).Error
		if err != nil {
			return nil, fmt.Errorf("look up tenant role %s: %w", def.Key, err)
		}
		if existing.ID != 0 {
			roleIDs[def.Key] = existing.ID
			continue
		}
		row := struct {
			TenantID uint64
			RoleName string
			RoleKey  string
			Sort     int
			Status   int
		}{TenantID: tenantID, RoleName: def.Name, RoleKey: def.Key, Sort: def.Sort, Status: 1}
		if err := tx.Table("system_role").Create(&row).Error; err != nil {
			return nil, fmt.Errorf("create tenant role %s: %w", def.Key, err)
		}
		var created struct{ ID uint64 }
		if err := tx.Table("system_role").
			Select("id").
			Where("tenant_id = ? AND role_key = ?", tenantID, def.Key).
			Limit(1).
			Scan(&created).Error; err != nil {
			return nil, fmt.Errorf("read back tenant role %s: %w", def.Key, err)
		}
		roleIDs[def.Key] = created.ID
	}
	return roleIDs, nil
}

// tenantPlatformMenuModule names the platform-only menu module for fixtures.
// Production classification goes through pkg/tenant.IsPlatformOnlyMenu.
const tenantPlatformMenuModule = tenantctx.PlatformOnlyMenuModuleTenant

// condRoleIDEquals is the predicate both role-binding tables are read and
// written by, so the placeholder style stays identical across the four queries.
const condRoleIDEquals = "role_id = ?"

// provisionTenantRoleMenus grants the tenant administrator the tenant console
// navigation.
//
// Role-menu grants are tenant-scoped (system_role_menu.tenant_id), so a freshly
// provisioned tenant starts with an empty sidebar unless the grants are seeded
// here: the navigation resolver joins system_role_menu by role id, and a new
// tenant's role ids have no rows at all. The symptom is silent — the tenant
// administrator logs in, the shell renders, and every page is unreachable
// because the menu tree is empty. The tenant smoke suite caught it on main
// immediately after role-menu grants became tenant-scoped.
//
// Platform-only menus (module system.tenant) are deliberately excluded: a tenant
// administrator must not see platform tenancy management, which is the same
// boundary the console capability signal enforces.
func provisionTenantRoleMenus(tx *gorm.DB, tenantID uint64, roleIDs map[string]uint64) error {
	if tenantID == tenantctx.PlatformGlobalTenantID {
		// The platform console keeps its own menu model (tenant 0 grants). A
		// tenant-scoped grant set here would be invisible to platform subjects
		// and would only add noise.
		return nil
	}
	adminRoleID := roleIDs[TenantRoleAdminKey]
	if adminRoleID == 0 {
		return errors.New("tenant provision: tenant_admin role missing")
	}
	type menuRow struct {
		ID     uint64 `gorm:"column:id"`
		Module string `gorm:"column:module"`
		Path   string `gorm:"column:path"`
	}
	var menus []menuRow
	if err := tx.Table("system_menu").
		Select(sqlSelectMenuIdentity).
		Where("is_visible = ? AND type <> ?", 1, "F").
		Order("sort asc, id asc").
		Scan(&menus).Error; err != nil {
		return fmt.Errorf("list tenant navigation menus: %w", err)
	}
	for _, menu := range menus {
		if tenantctx.IsPlatformOnlyMenu(menu.Module, menu.Path) {
			continue
		}
		if err := rbacbind.EnsureRoleMenu(tx, tenantID, adminRoleID, menu.ID); err != nil {
			return fmt.Errorf("grant tenant admin menu %d: %w", menu.ID, err)
		}
	}
	return nil
}

// tenantRootDeptName is the display name of the root department every tenant
// owns. It mirrors the platform tree's root name (dept.defaultRootDeptName) so
// a tenant console reads the same label at the top of its department tree.
const tenantRootDeptName = "Pantheon Base"

// provisionTenantRootDept ensures the tenant owns exactly one root department
// and returns its id (0 when tenantID is the platform global tenant).
//
// A tenant's department tree needs a root to hang off. DeptService.CreateDept
// rejects a top-level create (`parent_id = 0` -> `dept.parent.required`) by
// design — "departments must be placed under the organisation root or an
// existing department" — so without a provisioned root a freshly created tenant
// can never create its first department, and therefore never its first post
// either (PostService.ensurePostDeptID requires a non-root tenant department).
// Before this existed `system_dept` held rows for tenant 0 only, so every tenant
// console rendered an empty department tree that could not be populated from the
// UI: GET /system/dept/tree answered `[]` and the create form always failed.
//
// Idempotent: an existing root is reused, so re-running provisioning repairs a
// tenant that lost its root instead of duplicating it.
func provisionTenantRootDept(tx *gorm.DB, tenantID uint64) (uint64, error) {
	if tenantID == 0 {
		return 0, nil
	}

	var existing struct{ ID uint64 }
	if err := tx.Table("system_dept").
		Select("id").
		Where("tenant_id = ? AND is_root = ?", tenantID, common.StatusFlagYes).
		Order("id asc").
		Limit(1).
		Scan(&existing).Error; err != nil {
		return 0, fmt.Errorf("look up tenant root dept: %w", err)
	}
	if existing.ID != 0 {
		return existing.ID, nil
	}

	row := struct {
		TenantID  uint64
		ParentID  uint64
		Ancestors string
		IsRoot    int
		DeptName  string
		Sort      int
		Status    int
	}{
		TenantID: tenantID,
		ParentID: 0,
		IsRoot:   common.StatusFlagYes,
		DeptName: tenantRootDeptName,
		Status:   common.StatusEnabled,
	}
	if err := tx.Table("system_dept").Create(&row).Error; err != nil {
		return 0, fmt.Errorf("create tenant root dept: %w", err)
	}

	var created struct{ ID uint64 }
	if err := tx.Table("system_dept").
		Select("id").
		Where("tenant_id = ? AND is_root = ?", tenantID, common.StatusFlagYes).
		Order("id asc").
		Limit(1).
		Scan(&created).Error; err != nil {
		return 0, fmt.Errorf("read back tenant root dept: %w", err)
	}
	return created.ID, nil
}

// provisionTenantAdminUser creates the tenant's administrator. The username is
// unique per tenant, so each tenant may own its own `admin`.
func provisionTenantAdminUser(tx *gorm.DB, in ProvisionInput) (uint64, error) {
	username := strings.TrimSpace(in.AdminUsername)

	var existing struct{ ID uint64 }
	if err := tx.Table("system_user").
		Select("id").
		Where("tenant_id = ? AND username = ?", in.TenantID, username).
		Limit(1).
		Scan(&existing).Error; err != nil {
		return 0, fmt.Errorf("look up tenant admin: %w", err)
	}
	if existing.ID != 0 {
		return existing.ID, nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.AdminPassword), security.GetBcryptCost())
	if err != nil {
		return 0, fmt.Errorf("hash tenant admin password: %w", err)
	}
	nickname := strings.TrimSpace(in.AdminNickname)
	if nickname == "" {
		nickname = username
	}
	row := struct {
		TenantID uint64
		Username string
		Password string
		Nickname string
		Status   int
	}{TenantID: in.TenantID, Username: username, Password: string(hash), Nickname: nickname, Status: 1}
	if err := tx.Table("system_user").Create(&row).Error; err != nil {
		return 0, fmt.Errorf("create tenant admin: %w", err)
	}

	var created struct{ ID uint64 }
	if err := tx.Table("system_user").
		Select("id").
		Where("tenant_id = ? AND username = ?", in.TenantID, username).
		Limit(1).
		Scan(&created).Error; err != nil {
		return 0, fmt.Errorf("read back tenant admin: %w", err)
	}
	return created.ID, nil
}

// provisionTenantRoleBindings copies the platform `admin` role's permission and
// menu bindings onto the tenant's own roles.
//
// The product model for a tenant administrator is "the full console,
// automatically confined to the caller's tenant" — confinement is enforced by
// tenant.WithTenantScope and by the Casbin domain, NOT by shrinking the console
// surface. Until this step existed, provisioning created the roles and granted
// the Casbin policies but left the roles carrying ZERO permission keys, so
// GET /system/menu/tree answered with an empty tree and the tenant
// administrator signed into a console with no sidebar at all: the API surface
// worked, the console rendered nothing. The navigation tree is driven by
// permission keys (see MenuService.getScopedNavigationMenuTree), so the binding
// is what makes the console exist for a tenant subject.
//
// `tenant_member` receives the same menu visibility but only the read-only
// permission keys, matching its read-only Casbin surface (GET on /api/v1/*).
//
// Idempotent: existing bindings are skipped, so re-running provisioning is
// still a valid repair path.
func provisionTenantRoleBindings(tx *gorm.DB, tenantID uint64, roleIDs map[string]uint64) error {
	if tenantID == 0 || len(roleIDs) == 0 {
		return nil
	}
	platformRoleID, err := platformAdminRoleID(tx)
	if err != nil {
		return err
	}
	if platformRoleID == 0 {
		// No platform seed in this database (fresh schema, canary, unit-test
		// fixture). There is nothing to derive the console surface from, and
		// failing the tenant creation over it would be worse than leaving the
		// role without bindings.
		return nil
	}
	permissionKeys, menuIDs, err := readPlatformAdminBindings(tx, platformRoleID)
	if err != nil {
		return err
	}
	if len(permissionKeys) == 0 && len(menuIDs) == 0 {
		return nil
	}

	bindings := []struct {
		roleKey      string
		readOnlyOnly bool
	}{{roleKey: TenantRoleAdminKey}, {roleKey: TenantRoleMemberKey, readOnlyOnly: true}}

	for _, binding := range bindings {
		roleID := roleIDs[binding.roleKey]
		if roleID == 0 {
			continue
		}
		if err := grantTenantRolePermissions(tx, tenantID, roleID, binding.roleKey, permissionKeys, binding.readOnlyOnly); err != nil {
			return err
		}
		if err := grantTenantRoleMenus(tx, tenantID, roleID, binding.roleKey, menuIDs); err != nil {
			return err
		}
	}
	return nil
}

// platformAdminRoleID resolves the platform `admin` role, whose bindings are the
// source of the tenant console surface. A zero result means this database has no
// platform seed.
func platformAdminRoleID(tx *gorm.DB) (uint64, error) {
	var platformRoleID uint64
	if err := tx.Table("system_role").
		Select("id").
		Where("tenant_id = 0 AND role_key = ? AND status = ? AND deleted_at IS NULL", "admin", 1).
		Limit(1).
		Scan(&platformRoleID).Error; err != nil {
		return 0, fmt.Errorf("look up platform admin role: %w", err)
	}
	return platformRoleID, nil
}

// readPlatformAdminBindings reads the platform admin role's permission keys and
// menu ids, the two surfaces a tenant role is derived from. Platform-only
// bindings are dropped: the console capability gate refuses those routes for
// every tenant subject, so copying them would only produce menu entries whose
// pages answer 403 tenant.platformOnly (and stale permission keys that make the
// frontend expose actions the server rejects).
func readPlatformAdminBindings(tx *gorm.DB, platformRoleID uint64) ([]string, []uint64, error) {
	var permissionKeys []string
	if err := tx.Table("system_role_permission").
		Select("permission_key").
		Where(condRoleIDEquals, platformRoleID).
		Order("permission_key asc").
		Pluck("permission_key", &permissionKeys).Error; err != nil {
		return nil, nil, fmt.Errorf("read platform admin permissions: %w", err)
	}
	permissionKeys = tenantctx.FilterPlatformOnlyPermissionKeys(permissionKeys)

	var menuIDs []uint64
	if err := tx.Table("system_role_menu").
		Select("menu_id").
		Where(condRoleIDEquals, platformRoleID).
		Order("menu_id asc").
		Pluck("menu_id", &menuIDs).Error; err != nil {
		return nil, nil, fmt.Errorf("read platform admin menus: %w", err)
	}
	if len(menuIDs) == 0 {
		return permissionKeys, nil, nil
	}
	type menuRow struct {
		ID     uint64 `gorm:"column:id"`
		Module string `gorm:"column:module"`
		Path   string `gorm:"column:path"`
	}
	var menus []menuRow
	if err := tx.Table("system_menu").
		Select(sqlSelectMenuIdentity).
		Where("id IN ?", menuIDs).
		Scan(&menus).Error; err != nil {
		return nil, nil, fmt.Errorf("read platform admin menu rows: %w", err)
	}
	allowed := make(map[uint64]struct{}, len(menus))
	for _, menu := range menus {
		if tenantctx.IsPlatformOnlyMenu(menu.Module, menu.Path) {
			continue
		}
		allowed[menu.ID] = struct{}{}
	}
	filtered := make([]uint64, 0, len(menuIDs))
	for _, menuID := range menuIDs {
		if _, ok := allowed[menuID]; ok {
			filtered = append(filtered, menuID)
		}
	}
	return permissionKeys, filtered, nil
}

// RepairTenantPlatformGrants removes platform-only menu and permission grants
// from every tenant-owned role.
//
// The grant copy used to mirror the platform administrator verbatim, so tenants
// provisioned before this fix carry `system.tenant` / `system:i18n` / menu-write
// bindings. Re-provisioning only adds missing rows, so without this repair the
// old rows would outlive the fix and keep rendering menus whose routes answer
// 403 tenant.platformOnly. Runs at startup, is idempotent and never touches the
// platform namespace (tenant_id = 0).
func (s *Service) RepairTenantPlatformGrants() error {
	if s.db == nil {
		return common.ErrDatabaseNotInitialized
	}
	return repairTenantPlatformGrants(s.db, 0)
}

// repairTenantPlatformGrants removes the platform-only grants inside one
// tenant's namespace, or every tenant namespace when tenantID is 0.
func repairTenantPlatformGrants(tx *gorm.DB, tenantID uint64) error {
	if tx == nil || tx.Migrator() == nil {
		return nil
	}
	if !tx.Migrator().HasTable("system_menu") ||
		!tx.Migrator().HasTable("system_role_menu") ||
		!tx.Migrator().HasTable("system_role_permission") {
		return nil
	}

	platformMenuIDs, err := collectPlatformOnlyMenuIDs(tx)
	if err != nil {
		return err
	}
	if err := deleteTenantMenuGrants(tx, tenantID, platformMenuIDs); err != nil {
		return err
	}

	platformKeys, err := collectTenantPlatformPermissionKeys(tx)
	if err != nil {
		return err
	}
	return deleteTenantPermissionGrants(tx, tenantID, platformKeys)
}

// collectPlatformOnlyMenuIDs resolves every menu row that belongs to a
// platform-only surface, including the button rows that hang under such a page
// (they carry no path of their own, so they are matched by parent).
func collectPlatformOnlyMenuIDs(tx *gorm.DB) ([]uint64, error) {
	type menuRow struct {
		ID     uint64 `gorm:"column:id"`
		Module string `gorm:"column:module"`
		Path   string `gorm:"column:path"`
	}
	var menus []menuRow
	if err := tx.Table("system_menu").Select(sqlSelectMenuIdentity).Scan(&menus).Error; err != nil {
		return nil, fmt.Errorf("repair tenant platform grants: list menus: %w", err)
	}
	platformMenuIDs := make([]uint64, 0)
	for _, menu := range menus {
		if tenantctx.IsPlatformOnlyMenu(menu.Module, menu.Path) {
			platformMenuIDs = append(platformMenuIDs, menu.ID)
		}
	}
	if len(platformMenuIDs) == 0 {
		return platformMenuIDs, nil
	}
	var childIDs []uint64
	if err := tx.Table("system_menu").
		Select("id").
		Where("parent_id IN ?", platformMenuIDs).
		Pluck("id", &childIDs).Error; err != nil {
		return nil, fmt.Errorf("repair tenant platform grants: list platform button rows: %w", err)
	}
	return append(platformMenuIDs, childIDs...), nil
}

// deleteTenantMenuGrants removes the menu grants that point at a platform-only
// surface, inside one tenant namespace or every tenant namespace (tenantID 0).
func deleteTenantMenuGrants(tx *gorm.DB, tenantID uint64, menuIDs []uint64) error {
	if len(menuIDs) == 0 {
		return nil
	}
	menuGrants := tx.Table("system_role_menu").
		Where(condTenantScopedRow, tenantctx.PlatformGlobalTenantID).
		Where("menu_id IN ?", menuIDs)
	if tenantID != 0 {
		menuGrants = menuGrants.Where("tenant_id = ?", tenantID)
	}
	if err := menuGrants.Delete(nil).Error; err != nil {
		return fmt.Errorf("repair tenant platform grants: delete menu grants: %w", err)
	}
	return nil
}

// collectTenantPlatformPermissionKeys lists the permission keys stored under a
// tenant namespace that only a platform-capable subject may hold.
func collectTenantPlatformPermissionKeys(tx *gorm.DB) ([]string, error) {
	var tenantKeys []string
	if err := tx.Table("system_role_permission").
		Distinct("permission_key").
		Where(condTenantScopedRow, tenantctx.PlatformGlobalTenantID).
		Pluck("permission_key", &tenantKeys).Error; err != nil {
		return nil, fmt.Errorf("repair tenant platform grants: list permission keys: %w", err)
	}
	platformKeys := make([]string, 0, len(tenantKeys))
	for _, key := range tenantKeys {
		if tenantctx.IsPlatformOnlyPermissionKey(key) {
			platformKeys = append(platformKeys, key)
		}
	}
	return platformKeys, nil
}

// deleteTenantPermissionGrants removes the platform-only permission grants from
// one tenant namespace or every tenant namespace (tenantID 0).
func deleteTenantPermissionGrants(tx *gorm.DB, tenantID uint64, keys []string) error {
	if len(keys) == 0 {
		return nil
	}
	permissionGrants := tx.Table("system_role_permission").
		Where(condTenantScopedRow, tenantctx.PlatformGlobalTenantID).
		Where("permission_key IN ?", keys)
	if tenantID != 0 {
		permissionGrants = permissionGrants.Where("tenant_id = ?", tenantID)
	}
	if err := permissionGrants.Delete(nil).Error; err != nil {
		return fmt.Errorf("repair tenant platform grants: delete permission grants: %w", err)
	}
	return nil
}

// grantTenantRolePermissions copies the missing permission keys onto one tenant
// role. readOnlyOnly keeps a read-only role on the GET-only subset, so the
// console never advertises an action the server would refuse.
func grantTenantRolePermissions(
	tx *gorm.DB,
	tenantID, roleID uint64,
	roleKey string,
	permissionKeys []string,
	readOnlyOnly bool,
) error {
	existing := make(map[string]struct{})
	var currentKeys []string
	if err := tx.Table("system_role_permission").
		Select("permission_key").
		Where(condRoleIDEquals, roleID).
		Pluck("permission_key", &currentKeys).Error; err != nil {
		return fmt.Errorf("read existing permissions for %s: %w", roleKey, err)
	}
	for _, key := range currentKeys {
		existing[key] = struct{}{}
	}
	for _, key := range permissionKeys {
		if readOnlyOnly && !isReadOnlyPermissionKey(key) {
			continue
		}
		if _, taken := existing[key]; taken {
			continue
		}
		row := struct {
			TenantID      uint64
			RoleID        uint64
			PermissionKey string
		}{TenantID: tenantID, RoleID: roleID, PermissionKey: key}
		if err := tx.Table("system_role_permission").Create(&row).Error; err != nil {
			return fmt.Errorf("grant %s permission %s: %w", roleKey, key, err)
		}
	}
	return nil
}

// grantTenantRoleMenus copies the missing menu grants onto one tenant role, so
// the tenant console renders the same navigation as the platform one.
func grantTenantRoleMenus(tx *gorm.DB, tenantID, roleID uint64, roleKey string, menuIDs []uint64) error {
	existing := make(map[uint64]struct{})
	var currentMenus []uint64
	if err := tx.Table("system_role_menu").
		Select("menu_id").
		Where(condRoleIDEquals, roleID).
		Pluck("menu_id", &currentMenus).Error; err != nil {
		return fmt.Errorf("read existing menus for %s: %w", roleKey, err)
	}
	for _, id := range currentMenus {
		existing[id] = struct{}{}
	}
	for _, id := range menuIDs {
		if _, taken := existing[id]; taken {
			continue
		}
		row := struct {
			RoleID   uint64
			MenuID   uint64
			TenantID uint64
		}{RoleID: roleID, MenuID: id, TenantID: tenantID}
		if err := tx.Table("system_role_menu").Create(&row).Error; err != nil {
			return fmt.Errorf("grant %s menu %d: %w", roleKey, id, err)
		}
	}
	return nil
}

// isReadOnlyPermissionKey reports whether a permission key only reads. A tenant
// member's Casbin surface is GET on /api/v1/*, so handing it the write-capable
// keys would render action buttons that the server then refuses — the console
// would advertise capabilities it does not have.
func isReadOnlyPermissionKey(key string) bool {
	switch {
	case strings.HasSuffix(key, ":list"),
		strings.HasSuffix(key, ":detail"),
		strings.HasSuffix(key, ":view"),
		strings.HasSuffix(key, ":tree"),
		strings.HasSuffix(key, ":export"):
		return true
	default:
		return false
	}
}

// provisionTenantAdminBinding binds the admin user to the tenant admin role and
// records the owner membership the login issuance gate checks.
func provisionTenantAdminBinding(tx *gorm.DB, tenantID, userID uint64, roleIDs map[string]uint64) error {
	adminRoleID := roleIDs[TenantRoleAdminKey]
	if adminRoleID == 0 {
		return errors.New("tenant provision: tenant_admin role missing")
	}

	var bound int64
	if err := tx.Table("system_user_role").
		Where("tenant_id = ? AND user_id = ? AND role_id = ?", tenantID, userID, adminRoleID).
		Count(&bound).Error; err != nil {
		return fmt.Errorf("check tenant admin role binding: %w", err)
	}
	if bound == 0 {
		row := struct {
			TenantID uint64
			UserID   uint64
			RoleID   uint64
		}{TenantID: tenantID, UserID: userID, RoleID: adminRoleID}
		if err := tx.Table("system_user_role").Create(&row).Error; err != nil {
			return fmt.Errorf("bind tenant admin role: %w", err)
		}
	}

	var member int64
	if err := tx.Table("tenant_memberships").
		Where("tenant_id = ? AND user_id = ?", tenantID, userID).
		Count(&member).Error; err != nil {
		return fmt.Errorf("check tenant owner membership: %w", err)
	}
	if member == 0 {
		row := struct {
			TenantID uint64
			UserID   uint64
			Role     string
			Status   string
		}{TenantID: tenantID, UserID: userID, Role: "owner", Status: "active"}
		if err := tx.Table("tenant_memberships").Create(&row).Error; err != nil {
			return fmt.Errorf("create tenant owner membership: %w", err)
		}
	}
	return nil
}

// grantTenantRolePolicies writes the Casbin policies for the tenant's roles as
// the domain subjects role:<key>@tenant:<id> (contract §4). The middleware
// already consults exactly these subjects for a tenant-scoped request, so this
// is the step that turns a membership role into real permissions.
func grantTenantRolePolicies(tenantID uint64) int {
	if database.Enforcer == nil {
		return 0
	}
	added := 0
	for _, def := range tenantRoleDefinitions {
		subject := tenantctx.RoleSubject(def.Key, tenantID)
		for _, method := range def.Methods {
			ok, err := database.Enforcer.AddPolicy(subject, "/api/v1/*", method)
			if err == nil && ok {
				added++
			}
		}
	}
	return added
}

// platformScopedSettingKeys are deployment-wide flags that must NOT be copied
// into a tenant. They describe the deployment itself, not tenant behaviour:
//   - platform.tenant_mode: one mode per deployment, one-way switch
//     (contract §6/§7). A per-tenant copy would let a tenant's row shadow the
//     platform flag for every reader that is not tenant-scoped.
//   - platform.app_mode: the deployment's application mode (enterprise /
//     consumer / hybrid), read platform-wide by pkg/capability.
//
// Everything else (site.*, security.*, upload.*, ui.*, ...) is legitimately
// tenant-overridable and is copied so the tenant renders with sane defaults.
var platformScopedSettingKeys = []string{
	"platform.tenant_mode",
	"platform.app_mode",
}

// copyPlatformSettingsToTenant gives the tenant its own copy of the platform
// settings so a tenant-scoped read returns real values instead of an empty set
// (contract §3.3: settings are tenant-scoped). Existing tenant rows win — the
// copy only fills keys the tenant does not have yet.
//
// Deployment-wide flags are excluded (platformScopedSettingKeys): they are
// platform-scoped by contract and a tenant copy would make any reader that
// runs without a resolved tenant context non-deterministic.
//
// Every NOT-NULL column without a default must be copied explicitly:
// `group_key` is one of them, and omitting it fails the whole insert with
// MySQL 1364 ("Field 'group_key' doesn't have a default value"). Copying the
// full descriptive column set also keeps the tenant's settings renderable —
// a row with only a key and a value would lose its group, module and type.
func (s *Service) copyPlatformSettingsToTenant(tenantID uint64) (int64, error) {
	if tenantID == 0 {
		return 0, nil
	}
	res := s.db.Exec(`
		INSERT INTO system_setting (
			tenant_id, setting_key, setting_value, group_key, module, label_key,
			description, value_type, sort, is_public, is_encrypted, remark,
			is_readonly, created_at, updated_at
		)
		SELECT ?, src.setting_key, src.setting_value, src.group_key, src.module, src.label_key,
		       src.description, src.value_type, src.sort, src.is_public, src.is_encrypted, src.remark,
		       src.is_readonly, NOW(), NOW()
		FROM system_setting src
		WHERE src.tenant_id = 0
		  AND src.setting_key NOT IN ?
		  AND NOT EXISTS (
		    SELECT 1 FROM system_setting dst
		    WHERE dst.tenant_id = ? AND dst.setting_key = src.setting_key
		  )
	`, tenantID, platformScopedSettingKeys, tenantID)
	if res.Error != nil {
		return 0, fmt.Errorf("copy platform settings to tenant: %w", res.Error)
	}
	return res.RowsAffected, nil
}

// copyPlatformDictsToTenant seeds the tenant with the platform's default
// dictionaries (system_dict_type + system_dict_item) so tenant-scoped pages
// resolve their labels out of the box instead of showing empty select options.
//
// Same idempotent INSERT…SELECT + NOT EXISTS shape as
// copyPlatformSettingsToTenant:
//   - existing tenant-owned keys win — a tenant's private dict (or its own
//     customization of a copied one) is never overwritten, which is also how
//     tenant-private key conflicts are excluded;
//   - the dst existence check deliberately does NOT filter deleted_at: soft
//     deleted rows still occupy the (tenant_id, dict_code[, item_value]) unique
//     keys, so re-inserting them would fail as a duplicate — skipping them
//     keeps the statement retry-safe;
//   - deleted platform rows are not copied (src.deleted_at IS NULL);
//   - every NOT-NULL-without-default column is listed explicitly
//     (dict_name / item_label_key / item_value), matching the MySQL 1364 rule
//     documented on the settings copy.
func (s *Service) copyPlatformDictsToTenant(tenantID uint64) (int64, int64, error) {
	if tenantID == 0 {
		return 0, 0, nil
	}
	types := s.db.Exec(`
		INSERT INTO system_dict_type (
			tenant_id, dict_code, dict_name, module, status, remark, created_at, updated_at
		)
		SELECT ?, src.dict_code, src.dict_name, src.module, src.status, src.remark, NOW(), NOW()
		FROM system_dict_type src
		WHERE src.tenant_id = 0
		  AND src.deleted_at IS NULL
		  AND NOT EXISTS (
		    SELECT 1 FROM system_dict_type dst
		    WHERE dst.tenant_id = ? AND dst.dict_code = src.dict_code
		  )
	`, tenantID, tenantID)
	if types.Error != nil {
		return 0, 0, fmt.Errorf("copy platform dict types to tenant: %w", types.Error)
	}

	items := s.db.Exec(`
		INSERT INTO system_dict_item (
			tenant_id, dict_code, item_label_key, item_value, item_color,
			sort, status, remark, created_at, updated_at
		)
		SELECT ?, src.dict_code, src.item_label_key, src.item_value, src.item_color,
		       src.sort, src.status, src.remark, NOW(), NOW()
		FROM system_dict_item src
		WHERE src.tenant_id = 0
		  AND src.deleted_at IS NULL
		  AND NOT EXISTS (
		    SELECT 1 FROM system_dict_item dst
		    WHERE dst.tenant_id = ? AND dst.dict_code = src.dict_code AND dst.item_value = src.item_value
		  )
	`, tenantID, tenantID)
	if items.Error != nil {
		return types.RowsAffected, 0, fmt.Errorf("copy platform dict items to tenant: %w", items.Error)
	}
	return types.RowsAffected, items.RowsAffected, nil
}
