package tenant

import (
	"errors"
	"fmt"
	"strings"

	"github.com/duanxldragon/pantheon-base/backend/pkg/common"
	"github.com/duanxldragon/pantheon-base/backend/pkg/common/security"
	"github.com/duanxldragon/pantheon-base/backend/pkg/database"
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
	AdminUserID    uint64
	RoleIDs        map[string]uint64
	RootDeptID     uint64
	PolicyCount    int
	SettingsCopied int64
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

		if err := provisionTenantRoleBindings(tx, in.TenantID, roleIDs); err != nil {
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
	var platformRoleID uint64
	if err := tx.Table("system_role").
		Select("id").
		Where("tenant_id = 0 AND role_key = ? AND status = ? AND deleted_at IS NULL", "admin", 1).
		Limit(1).
		Scan(&platformRoleID).Error; err != nil {
		return fmt.Errorf("look up platform admin role: %w", err)
	}
	if platformRoleID == 0 {
		// No platform seed in this database (fresh schema, canary, unit-test
		// fixture). There is nothing to derive the console surface from, and
		// failing the tenant creation over it would be worse than leaving the
		// role without bindings.
		return nil
	}

	var permissionKeys []string
	if err := tx.Table("system_role_permission").
		Select("permission_key").
		Where("role_id = ?", platformRoleID).
		Order("permission_key asc").
		Pluck("permission_key", &permissionKeys).Error; err != nil {
		return fmt.Errorf("read platform admin permissions: %w", err)
	}
	var menuIDs []uint64
	if err := tx.Table("system_role_menu").
		Select("menu_id").
		Where("role_id = ?", platformRoleID).
		Order("menu_id asc").
		Pluck("menu_id", &menuIDs).Error; err != nil {
		return fmt.Errorf("read platform admin menus: %w", err)
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

		existingKeys := make(map[string]struct{})
		var currentKeys []string
		if err := tx.Table("system_role_permission").
			Select("permission_key").
			Where("role_id = ?", roleID).
			Pluck("permission_key", &currentKeys).Error; err != nil {
			return fmt.Errorf("read existing permissions for %s: %w", binding.roleKey, err)
		}
		for _, key := range currentKeys {
			existingKeys[key] = struct{}{}
		}
		for _, key := range permissionKeys {
			if binding.readOnlyOnly && !isReadOnlyPermissionKey(key) {
				continue
			}
			if _, taken := existingKeys[key]; taken {
				continue
			}
			row := struct {
				TenantID      uint64
				RoleID        uint64
				PermissionKey string
			}{TenantID: tenantID, RoleID: roleID, PermissionKey: key}
			if err := tx.Table("system_role_permission").Create(&row).Error; err != nil {
				return fmt.Errorf("grant %s permission %s: %w", binding.roleKey, key, err)
			}
		}

		existingMenus := make(map[uint64]struct{})
		var currentMenus []uint64
		if err := tx.Table("system_role_menu").
			Select("menu_id").
			Where("role_id = ?", roleID).
			Pluck("menu_id", &currentMenus).Error; err != nil {
			return fmt.Errorf("read existing menus for %s: %w", binding.roleKey, err)
		}
		for _, id := range currentMenus {
			existingMenus[id] = struct{}{}
		}
		for _, id := range menuIDs {
			if _, taken := existingMenus[id]; taken {
				continue
			}
			row := struct {
				RoleID   uint64
				MenuID   uint64
				TenantID uint64
			}{RoleID: roleID, MenuID: id, TenantID: tenantID}
			if err := tx.Table("system_role_menu").Create(&row).Error; err != nil {
				return fmt.Errorf("grant %s menu %d: %w", binding.roleKey, id, err)
			}
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
