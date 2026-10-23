package tenant

import (
	"fmt"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestConcurrentProvisioningKeepsTenantResourcesIsolated turns the last open
// delivery residual into a checked claim. Two tenants created at the same time
// were previously described as "structurally safe but unverified": the unique
// key on `code` prevents duplicate tenants, and every provisioning write is
// keyed by tenant_id, but nothing exercised it.
//
// The invariant that matters is not that both creations succeed. Provisioning
// writes roles, role-menu grants, role-permission grants, a root department, an
// administrator, copied settings and copied dictionaries, all keyed by
// tenant_id. A path that forgot the tenant predicate would still create both
// tenants successfully; it would just give one of them the other's rows, or
// let one transaction overwrite the other's grants. So the assertions below are
// about ownership and disjointness, not about error codes.
//
// The admin username is deliberately identical in every tenant: `(tenant_id,
// username)` is the unique key, so a dropped tenant predicate collides instead
// of quietly succeeding.
func TestConcurrentProvisioningKeepsTenantResourcesIsolated(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)

	const (
		tenantCount   = 4
		adminUsername = "owner"
		adminPassword = "abc12345"
	)

	// One platform-level setting to copy. Without a source row the copy step is
	// a no-op and "0 settings" would be correct, so the assertion below would
	// prove nothing about whether the copy is tenant-scoped.
	require.NoError(t, db.Exec(
		`INSERT INTO system_setting (tenant_id, setting_key, setting_value, group_key, module, value_type)
		 VALUES (0, 'site.name', 'Pantheon', 'site', 'system', 'string')`,
	).Error)

	var (
		wg      sync.WaitGroup
		start   = make(chan struct{})
		created = make([]*Tenant, tenantCount)
		errs    = make([]error, tenantCount)
	)
	for i := 0; i < tenantCount; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			<-start // release every goroutine as close together as possible
			created[i], errs[i] = service.CreateTenant(CreateTenantDTO{
				Code:          fmt.Sprintf("concurrent-%d", i),
				Name:          fmt.Sprintf("Concurrent %d", i),
				AdminUsername: adminUsername,
				AdminPassword: adminPassword,
			})
		}(i)
	}
	close(start)
	wg.Wait()

	for i, err := range errs {
		require.NoErrorf(t, err, "tenant %d must be created under concurrency", i)
	}

	roleOwner := make(map[uint64]uint64, tenantCount*len(tenantRoleDefinitions))
	for i, row := range created {
		require.NotNilf(t, row, "tenant %d is nil", i)

		var roles []struct {
			ID       uint64 `gorm:"column:id"`
			TenantID uint64 `gorm:"column:tenant_id"`
			RoleKey  string `gorm:"column:role_key"`
		}
		require.NoError(t, db.Table("system_role").
			Select("id, tenant_id, role_key").
			Where("tenant_id = ?", row.ID).
			Scan(&roles).Error)
		require.Len(t, roles, len(tenantRoleDefinitions),
			"tenant %d must own exactly its own role set, got %d", i, len(roles))
		for _, role := range roles {
			require.Equalf(t, row.ID, role.TenantID, "role %s leaked to another tenant", role.RoleKey)
			previous, taken := roleOwner[role.ID]
			require.Falsef(t, taken, "role id %d is shared by tenant %d and tenant %d", role.ID, previous, row.ID)
			roleOwner[role.ID] = row.ID
		}

		// Exactly one active membership: the administrator this creation made.
		var memberships []struct {
			UserID uint64 `gorm:"column:user_id"`
			Status string `gorm:"column:status"`
		}
		require.NoError(t, db.Model(&Membership{}).
			Select("user_id, status").
			Where("tenant_id = ?", row.ID).
			Scan(&memberships).Error)
		require.Len(t, memberships, 1, "tenant %d must have exactly one membership", i)
		assert.Equal(t, "active", memberships[0].Status)

		// The administrator belongs to this tenant, and the shared username did
		// not stop a second tenant from getting its own row.
		var admins []struct {
			ID       uint64 `gorm:"column:id"`
			TenantID uint64 `gorm:"column:tenant_id"`
		}
		require.NoError(t, db.Table("system_user").
			Select("id, tenant_id").
			Where("tenant_id = ? AND username = ?", row.ID, adminUsername).
			Scan(&admins).Error)
		require.Len(t, admins, 1, "tenant %d must own exactly one %q", i, adminUsername)
		assert.Equal(t, row.ID, admins[0].TenantID)
		assert.Equal(t, memberships[0].UserID, admins[0].ID, "the membership must point at this tenant's administrator")

		// One root department, not zero (provisioning skipped) and not two
		// (both transactions provisioned into one tenant).
		var rootDepts int64
		require.NoError(t, db.Table("system_dept").
			Where("tenant_id = ? AND is_root = ?", row.ID, 1).
			Count(&rootDepts).Error)
		assert.Equal(t, int64(1), rootDepts, "tenant %d must have exactly one root department", i)

		// The platform settings were copied into this tenant, with its own
		// tenant_id - not appended to the platform namespace and not written
		// into a sibling's.
		var copied []struct {
			TenantID uint64 `gorm:"column:tenant_id"`
			Value    string `gorm:"column:setting_value"`
		}
		require.NoError(t, db.Table("system_setting").
			Select("tenant_id, setting_value").
			Where("setting_key = ?", "site.name").
			Scan(&copied).Error)
		require.Len(t, copied, tenantCount+1,
			"expected the platform row plus one copy per tenant, got %d", len(copied))
		ownCopies := 0
		for _, setting := range copied {
			if setting.TenantID == 0 {
				assert.Equal(t, "Pantheon", setting.Value, "the platform row must keep its value")
				continue
			}
			if setting.TenantID == row.ID {
				ownCopies++
			}
		}
		assert.Equal(t, 1, ownCopies, "tenant %d must receive exactly one copy of the platform setting", i)
	}

	// No role row may exist outside the tenants this test created, and the
	// total must be exactly tenantCount full role sets - a tenant that
	// provisioned twice, or one that picked up a sibling's roles, changes this
	// number.
	var totalRoles int64
	require.NoError(t, db.Table("system_role").Count(&totalRoles).Error)
	assert.Equal(t, int64(tenantCount*len(tenantRoleDefinitions)), totalRoles)
}

// TestConcurrentProvisioningOfTheSameCodeCreatesOneTenant is the other half:
// serialisation is not required for correctness, because `code` is UNIQUE. One
// caller wins and the rest must receive a conflict rather than a second tenant
// or a 500.
func TestConcurrentProvisioningOfTheSameCodeCreatesOneTenant(t *testing.T) {
	db := setupTestDB(t)
	service := NewService(db)

	const contenders = 4
	var (
		wg      sync.WaitGroup
		start   = make(chan struct{})
		errs    = make([]error, contenders)
		created = make([]*Tenant, contenders)
	)
	for i := 0; i < contenders; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			<-start
			created[i], errs[i] = service.CreateTenant(CreateTenantDTO{Code: "race-co", Name: "Race Co"})
		}(i)
	}
	close(start)
	wg.Wait()

	succeeded := 0
	for i, err := range errs {
		if err == nil {
			succeeded++
			require.NotNil(t, created[i])
			continue
		}
		// Either the pre-check saw the winner, or the UNIQUE index rejected the
		// insert. Both are contract-shaped conflicts; a 500 or a raw driver
		// error would not be.
		assert.ErrorIsf(t, err, ErrTenantCodeExists, "contender %d must fail as a code conflict, got %v", i, err)
	}
	assert.Equal(t, 1, succeeded, "exactly one contender may create the tenant")

	var rows int64
	require.NoError(t, db.Model(&Tenant{}).Where("code = ?", "race-co").Count(&rows).Error)
	assert.Equal(t, int64(1), rows, "the unique index must leave exactly one tenant row")
}
