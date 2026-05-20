package business

import (
	mdqaorder "pantheon-platform/backend/modules/business/mdqaorder"
	mdqaorderitem "pantheon-platform/backend/modules/business/mdqaorderitem"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitGeneratedBusinessModules(r *gin.RouterGroup, db *gorm.DB) {
	mdqaorder.InitMdqaorderModule(r, db)
	mdqaorderitem.InitMdqaorderitemModule(r, db)
}
