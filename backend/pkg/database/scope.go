package database

import (
	"pantheon-platform/backend/pkg/common"

	"gorm.io/gorm"
)

// WithDataScope GORM 数据权限拦截钩子
// 使用方式：db.Scopes(database.WithDataScope(req)).Find(&users)
func WithDataScope(req *common.DataScopeReq) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if req == nil || req.IsAdmin {
			return db
		}

		// 这里是未来扩展行级过滤逻辑的地方
		// 例如：
		// 1. 全部数据权限 (default) -> 直接返回
		// 2. 自定义部门数据权限 -> db.Where("dept_id IN (?)", deptIDs)
		// 3. 本部门数据权限 -> db.Where("dept_id = ?", req.DeptID)
		// 4. 本部门及以下数据权限 -> db.Where("dept_id IN (SELECT id FROM system_dept WHERE ...)")
		// 5. 仅本人数据权限 -> db.Where("create_by = ?", req.UserID)

		return db
	}
}
