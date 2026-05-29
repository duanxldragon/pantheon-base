package business

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	mdqaorder "pantheon-platform/backend/modules/business/mdqaorder"
	mdqaorderitem "pantheon-platform/backend/modules/business/mdqaorderitem"
)

func InitGeneratedBusinessModules(r *gin.RouterGroup, db *gorm.DB) {
	mdqaorder.InitMdqaorderModule(r, db)
	mdqaorderitem.InitMdqaorderitemModule(r, db)
}
