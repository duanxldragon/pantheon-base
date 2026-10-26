package role

import (
	"strings"

	"github.com/casbin/casbin/v2/util"
	"github.com/duanxldragon/pantheon-base/backend/modules/system/iam/permission"
	"github.com/duanxldragon/pantheon-base/backend/pkg/database"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type roleAPIRoute struct {
	path   string
	method string
}

// syncRoleAPIPolicies keeps the Casbin policies of one role in step with the
// permission keys the role currently holds. Only routes declared by the shared
// permission→route binding table are managed here: policies outside that table
// (wildcards written by tenant provisioning, manual grants from the permission
// page) are never touched.
func syncRoleAPIPolicies(tx *gorm.DB, subject string, permissionKeys []string) error {
	subject = strings.TrimSpace(subject)
	if subject == "" {
		return nil
	}

	heldKeys := make(map[string]struct{}, len(permissionKeys))
	for _, key := range normalizePermissionKeys(permissionKeys) {
		heldKeys[key] = struct{}{}
	}

	managed := make(map[roleAPIRoute]struct{})
	desired := make(map[roleAPIRoute]struct{})
	for permissionKey, entries := range permission.RequiredAPIRoutesByPermission() {
		for _, entry := range entries {
			route := roleAPIRoute{
				path:   strings.TrimSpace(entry.Path),
				method: normalizeRolePolicyMethod(entry.Method),
			}
			if route.path == "" || route.method == "" {
				continue
			}
			managed[route] = struct{}{}
			if _, ok := heldKeys[permissionKey]; ok {
				desired[route] = struct{}{}
			}
		}
	}
	if len(managed) == 0 {
		return nil
	}

	var existing []database.CasbinRule
	if err := tx.Where("ptype = ? AND v0 = ?", "p", subject).Find(&existing).Error; err != nil {
		return err
	}

	removedIDs := make([]uint64, 0)
	present := make(map[roleAPIRoute]struct{}, len(existing))
	for _, policy := range existing {
		route := roleAPIRoute{
			path:   strings.TrimSpace(policy.V1),
			method: normalizeRolePolicyMethod(policy.V2),
		}
		present[route] = struct{}{}
		if _, ok := managed[route]; !ok {
			continue
		}
		if _, ok := desired[route]; !ok {
			removedIDs = append(removedIDs, policy.ID)
		}
	}
	if len(removedIDs) > 0 {
		if err := tx.Where("id IN ?", removedIDs).Delete(&database.CasbinRule{}).Error; err != nil {
			return err
		}
	}

	created := make([]database.CasbinRule, 0, len(desired))
	for route := range desired {
		if _, ok := present[route]; ok {
			continue
		}
		// A wildcard grant (`/api/v1/*`) already enforces this route; adding an
		// exact duplicate would only bloat the policy table.
		if rolePolicyCoversRoute(existing, route) {
			continue
		}
		created = append(created, database.CasbinRule{
			PType: "p",
			V0:    subject,
			V1:    route.path,
			V2:    route.method,
		})
	}
	if len(created) == 0 {
		return nil
	}
	// Remediation and role saves can race on the same natural key; the unique
	// index keeps one row and the loser simply observes it as already present.
	return tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(created, 100).Error
}

func normalizeRolePolicyMethod(method string) string {
	return strings.ToUpper(strings.TrimSpace(method))
}

// rolePolicyCoversRoute reports whether an existing policy already authorises
// the route under the Casbin keyMatch2 matcher used by the enforcement model.
func rolePolicyCoversRoute(policies []database.CasbinRule, route roleAPIRoute) bool {
	for _, policy := range policies {
		if normalizeRolePolicyMethod(policy.V2) != route.method {
			continue
		}
		if util.KeyMatch2(route.path, strings.TrimSpace(policy.V1)) {
			return true
		}
	}
	return false
}
