package lowcode

import (
	"pantheon-platform/modules/lowcode/dynamicmodule"
	"pantheon-platform/modules/lowcode/generator"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitLowcodeModule(r *gin.RouterGroup, db *gorm.DB) {
	dynamicmodule.InitDynamicModule(r, db)
	generator.InitGeneratorModule(r, db)
}
