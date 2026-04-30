package business

import (
	cmdb_host "pantheon-platform/backend/modules/business/cmdb/host"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitGeneratedBusinessModules(r *gin.RouterGroup, db *gorm.DB) {
	cmdb_host.InitCmdbHostModule(r, db)
}
