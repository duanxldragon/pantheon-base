package business

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	cmdb_host "pantheon-platform/backend/modules/business/cmdb/host"
	cmdb_vendor "pantheon-platform/backend/modules/business/cmdb/vendor"
)

func InitGeneratedBusinessModules(r *gin.RouterGroup, db *gorm.DB) {
	cmdb_host.InitCmdbHostModule(r, db)
	cmdb_vendor.InitCmdbVendorModule(r, db)
}
