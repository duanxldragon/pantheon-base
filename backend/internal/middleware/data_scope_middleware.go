package middleware

import (
	"sort"
	"strconv"
	"strings"

	"pantheon-platform/backend/pkg/common"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SystemRoleDataScope struct {
	ID      uint64 `gorm:"primaryKey;autoIncrement"`
	RoleKey string `gorm:"size:64;not null;uniqueIndex"`
	Mode    string `gorm:"size:32;not null;default:'all'"`
	DeptIDs string `gorm:"type:text"`
}

func (SystemRoleDataScope) TableName() string {
	return "system_role_data_scope"
}

func MigrateDataScopePolicy(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	return db.AutoMigrate(&SystemRoleDataScope{})
}

func DataScopeMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := common.GetUserID(c)
		roleKeys := readRoleKeysFromContext(c)
		scope := &common.DataScopeReq{
			UserID:   userID,
			RoleKeys: roleKeys,
			Mode:     common.DataScopeModeAll,
			IsAdmin:  hasAdminRole(roleKeys),
		}

		if db != nil && userID > 0 {
			scope.DeptID = loadCurrentUserDeptID(db, userID)
		}
		if db != nil && !scope.IsAdmin {
			applyRoleDataScopePolicy(db, scope)
		}

		c.Set(common.DataScopeContextKey, scope)
		c.Next()
	}
}

func loadCurrentUserDeptID(db *gorm.DB, userID uint64) uint64 {
	var deptID uint64
	_ = db.Table("system_user").Select("dept_id").Where("id = ?", userID).Limit(1).Pluck("dept_id", &deptID).Error
	return deptID
}

func applyRoleDataScopePolicy(db *gorm.DB, scope *common.DataScopeReq) {
	if scope == nil || len(scope.RoleKeys) == 0 || !db.Migrator().HasTable(&SystemRoleDataScope{}) {
		return
	}
	var policies []SystemRoleDataScope
	if err := db.Where("role_key IN ?", scope.RoleKeys).Find(&policies).Error; err != nil {
		return
	}
	if len(policies) == 0 {
		return
	}

	scope.Mode = resolveDataScopeMode(policies)
	switch scope.Mode {
	case common.DataScopeModeCustom:
		scope.DeptIDs = resolveCustomDataScopeDeptIDs(policies)
	case common.DataScopeModeDept, common.DataScopeModeDeptAndChildren, common.DataScopeModeSelf:
		scope.DeptIDs = nil
	case common.DataScopeModeAll:
		scope.DeptIDs = nil
	}
}

func parseDataScopeDeptIDs(raw string) []uint64 {
	parts := strings.Split(raw, ",")
	result := make([]uint64, 0, len(parts))
	for _, part := range parts {
		value, err := strconv.ParseUint(strings.TrimSpace(part), 10, 64)
		if err != nil || value == 0 {
			continue
		}
		result = append(result, value)
	}
	return result
}

func resolveDataScopeMode(policies []SystemRoleDataScope) string {
	hasSelf := false
	hasDept := false
	hasDeptAndChildren := false
	customDeptIDs := 0

	for _, policy := range policies {
		switch strings.TrimSpace(policy.Mode) {
		case "", common.DataScopeModeAll:
			return common.DataScopeModeAll
		case common.DataScopeModeCustom:
			customDeptIDs += len(parseDataScopeDeptIDs(policy.DeptIDs))
		case common.DataScopeModeDeptAndChildren:
			hasDeptAndChildren = true
		case common.DataScopeModeDept:
			hasDept = true
		case common.DataScopeModeSelf:
			hasSelf = true
		}
	}

	switch {
	case customDeptIDs > 0:
		return common.DataScopeModeCustom
	case hasDeptAndChildren:
		return common.DataScopeModeDeptAndChildren
	case hasDept:
		return common.DataScopeModeDept
	case hasSelf:
		return common.DataScopeModeSelf
	default:
		return common.DataScopeModeAll
	}
}

func resolveCustomDataScopeDeptIDs(policies []SystemRoleDataScope) []uint64 {
	seen := make(map[uint64]struct{})
	result := make([]uint64, 0)
	for _, policy := range policies {
		if strings.TrimSpace(policy.Mode) != common.DataScopeModeCustom {
			continue
		}
		for _, deptID := range parseDataScopeDeptIDs(policy.DeptIDs) {
			if _, ok := seen[deptID]; ok {
				continue
			}
			seen[deptID] = struct{}{}
			result = append(result, deptID)
		}
	}
	sort.Slice(result, func(i, j int) bool { return result[i] < result[j] })
	return result
}

func hasAdminRole(roleKeys []string) bool {
	for _, roleKey := range roleKeys {
		if strings.TrimSpace(roleKey) == "admin" {
			return true
		}
	}
	return false
}
