package lowcode

import (
	"pantheon-platform/backend/modules/lowcode/dynamicmodule"
	"pantheon-platform/backend/modules/lowcode/generator"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitLowcodeModule(r *gin.RouterGroup, db *gorm.DB) {
	dynamicmodule.InitDynamicModule(r, db)
	generator.InitGeneratorModule(r, db)
}
