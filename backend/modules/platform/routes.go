package platform

import (
	"github.com/duanxldragon/pantheon-base/backend/internal/middleware"
	"github.com/duanxldragon/pantheon-base/backend/pkg/database"
	"github.com/duanxldragon/pantheon-base/backend/pkg/tenant"
	"time"

	dept "github.com/duanxldragon/pantheon-base/backend/modules/system/org/dept"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type platformDeptGovernanceTaskLoader struct {
	db *gorm.DB
}

func (l platformDeptGovernanceTaskLoader) ListOrgGovernanceTasks() ([]OrgGovernanceTask, error) {
	orgSvc := dept.NewDeptService(l.db)
	tasks, err := orgSvc.ListGovernanceTasks(&dept.DeptGovernanceTaskQuery{})
	if err != nil {
		return nil, err
	}
	result := make([]OrgGovernanceTask, 0, len(tasks))
	for _, task := range tasks {
		result = append(result, OrgGovernanceTask{
			TaskKey:               task.TaskKey,
			GovernanceScope:       task.GovernanceScope,
			GovernanceTag:         task.GovernanceTag,
			GovernanceAction:      task.GovernanceAction,
			GovernanceScopeLabel:  task.GovernanceScopeLabel,
			GovernanceTagLabel:    task.GovernanceTagLabel,
			GovernanceActionLabel: task.GovernanceActionLabel,
			DeptID:                task.DeptID,
			DeptName:              task.DeptName,
			PostName:              task.PostName,
			RelatedUserCount:      task.RelatedUserCount,
		})
	}
	return result, nil
}

func RegisterPlatformRoutes(r *gin.RouterGroup, db *gorm.DB) {
	tokenMiddleware := middleware.TokenAuthMiddleware(database.RDB)
	tenantModeLoader := tenant.NewModeLoader(func() string {
		var value string
		if db == nil || db.Table("system_setting").Where("setting_key = ?", "platform.tenant_mode").Pluck("setting_value", &value).Error != nil {
			return tenant.ModeCompat
		}
		return value
	}, int64(5*time.Second))

	dashboardSvc := NewDashboardService(db, WithOrgGovernanceTaskLoader(platformDeptGovernanceTaskLoader{db: db}))
	dashboardHandler := NewDashboardHandler(dashboardSvc)

	dashboardGroup := r.Group("/dashboard").Use(tokenMiddleware).Use(middleware.TenantContextMiddleware(tenantModeLoader, db))
	{
		dashboardGroup.GET("/summary", dashboardHandler.GetSummary)
	}

	RegisterHealthRoutes(r, db)
}
