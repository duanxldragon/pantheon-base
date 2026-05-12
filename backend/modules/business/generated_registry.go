package business

import (
	orderqa "pantheon-platform/backend/modules/business/orderqa"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func InitGeneratedBusinessModules(r *gin.RouterGroup, db *gorm.DB) {
	orderqa.InitOrderqaModule(r, db)
}
