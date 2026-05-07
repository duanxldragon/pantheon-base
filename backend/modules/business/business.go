package business

import (
	"pantheon-platform/backend/modules/business/cmdb"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitBusinessModules(r *gin.RouterGroup, db *gorm.DB) {
	if err := cleanupRetiredBusinessModules(db); err != nil {
		panic(err)
	}
	InitGeneratedBusinessModules(r, db)
	cmdb.InitCmdbModule(r, db)
}
