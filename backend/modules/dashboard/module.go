package dashboard

import (
	"pantheon-platform/backend/internal/middleware"
	dept "pantheon-platform/backend/modules/system/org/dept"
	"pantheon-platform/backend/pkg/contracts"
	"pantheon-platform/backend/pkg/database"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type deptGovernanceTaskLoader struct {
	db *gorm.DB
}

func (l deptGovernanceTaskLoader) ListOrgGovernanceTasks() ([]OrgGovernanceTask, error) {
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

func InitDashboardModule(r *gin.RouterGroup, db *gorm.DB) {
	dashboardSvc := NewDashboardService(db, WithOrgGovernanceTaskLoader(deptGovernanceTaskLoader{db: db}))
	dashboardHandler := NewDashboardHandler(dashboardSvc)

	tokenMiddleware := middleware.TokenAuthMiddleware(database.RDB)

	modules := []contracts.BackendModule{
		contracts.FuncModule{
			ModuleName: "dashboard",
			Register: func(r *gin.RouterGroup) {
				registerDashboardRoutes(r, tokenMiddleware, dashboardHandler)
			},
		},
	}

	contracts.RegisterBackendModules(r, db, modules...)
}

func registerDashboardRoutes(r *gin.RouterGroup, tokenMiddleware gin.HandlerFunc, dashboardHandler *DashboardHandler) {
	dashboardGroup := r.Group("/dashboard").Use(tokenMiddleware)
	{
		dashboardGroup.GET("/summary", dashboardHandler.GetSummary)
	}

	// Compatibility for clients still using the old platform-scoped endpoint.
	r.Group("/platform").Use(tokenMiddleware).GET("/dashboard/summary", dashboardHandler.GetSummary)
}
