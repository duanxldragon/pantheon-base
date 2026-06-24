package generator

import (
	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/pkg/contracts"
	"pantheon-platform/backend/pkg/database"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitGeneratorModule(r *gin.RouterGroup, db *gorm.DB) {
	// AutoMigrate handled by versioned migrations or contracts system
	service := NewGeneratorService(db)
	handler := NewGeneratorHandler(service)

	contracts.RegisterBackendModules(r, db, contracts.FuncModule{
		ModuleName: "generator",
		Register: func(r *gin.RouterGroup) {
			tokenMiddleware := middleware.TokenAuthMiddleware(database.RDB)
			readAPI := r.Group("/system/generator").
				Use(tokenMiddleware).
				Use(middleware.CasbinMiddleware())
			{
				readAPI.GET("/datasources", handler.ListDatasources)
				readAPI.GET("/tables", handler.ListTables)
				readAPI.GET("/table-schema", handler.PreviewTable)
				readAPI.POST("/preview-files", handler.PreviewGeneratedFiles)
				readAPI.POST("/download-source", handler.DownloadGeneratedSource)
			}

			writeAPI := r.Group("/system/generator").
				Use(tokenMiddleware).
				Use(middleware.CasbinMiddleware()).
				Use(middleware.SecureActionMiddleware())
			{
				writeAPI.POST("/datasources", handler.CreateDatasource)
				writeAPI.PUT("/datasources/:id", handler.UpdateDatasource)
				writeAPI.DELETE("/datasources/:id", handler.DeleteDatasource)
				writeAPI.POST("/datasources/:id/test", handler.TestDatasource)
			}
		},
	})
}
