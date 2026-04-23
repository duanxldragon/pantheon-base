package business

import (
	"pantheon-platform/backend/modules/business/cmdb"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitBusinessModules(r *gin.RouterGroup, db *gorm.DB) {
	cmdb.InitCMDBModule(r, db)
}
