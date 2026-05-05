package middleware

import (
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
	for _, policy := range policies {
		mode := strings.TrimSpace(policy.Mode)
		if mode == "" || mode == common.DataScopeModeAll {
			continue
		}
		scope.Mode = mode
		if mode == common.DataScopeModeCustom {
			scope.DeptIDs = parseDataScopeDeptIDs(policy.DeptIDs)
		}
		return
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

func hasAdminRole(roleKeys []string) bool {
	for _, roleKey := range roleKeys {
		if strings.TrimSpace(roleKey) == "admin" {
			return true
		}
	}
	return false
}
