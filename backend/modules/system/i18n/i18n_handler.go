package system

import (
	"github.com/gin-gonic/gin"
	"pantheon-platform/backend/pkg/common"
)

type I18nHandler struct {
	service *I18nService
}

func NewI18nHandler(s *I18nService) *I18nHandler {
	return &I18nHandler{service: s}
}

// GetLangPack 获取语言包接口
func (h *I18nHandler) GetLangPack(c *gin.Context) {
	lang := c.DefaultQuery("lang", "zh-CN")
	pack, err := h.service.GetLangPack(lang)
	if err != nil {
		common.Fail(c, common.CodeError, "i18n.fetch.error")
		return
	}
	common.Success(c, pack)
}
