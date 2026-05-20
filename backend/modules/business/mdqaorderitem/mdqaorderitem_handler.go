package mdqaorderitem

import (
	"pantheon-platform/backend/pkg/common"
	"strconv"
	"github.com/gin-gonic/gin"
)

type MdqaorderitemHandler struct {
	service *MdqaorderitemService
}

func NewMdqaorderitemHandler(s *MdqaorderitemService) *MdqaorderitemHandler {
	return &MdqaorderitemHandler{service: s}
}

// GetMdqaorderitemList 获取列表
func (h *MdqaorderitemHandler) GetMdqaorderitemList(c *gin.Context) {
	var query MdqaorderitemListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	dataScope := common.GetDataScope(c)
	list, err := h.service.ListMdqaorderitems(&query, dataScope)
	if err != nil {
		common.Fail(c, common.CodeError, "mdqaorderitem.list.error")
		return
	}
	common.Success(c, list)
}

// GetMdqaorderitemDetail 获取详情
func (h *MdqaorderitemHandler) GetMdqaorderitemDetail(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	detail, err := h.service.GetMdqaorderitemDetail(id)
	if err != nil {
		common.Fail(c, common.CodeError, "mdqaorderitem.detail.error")
		return
	}
	common.Success(c, detail)
}

// CreateMdqaorderitem 创建
func (h *MdqaorderitemHandler) CreateMdqaorderitem(c *gin.Context) {
	common.SetAuditMetadata(c, "business.mdqaorderitem.audit.create", common.BusinessInsert)
	var req MdqaorderitemCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	item, err := h.service.CreateMdqaorderitem(&req)
	if err != nil {
		common.Fail(c, common.CodeError, "mdqaorderitem.create.error")
		return
	}
	common.Success(c, item)
}

// UpdateMdqaorderitem 更新
func (h *MdqaorderitemHandler) UpdateMdqaorderitem(c *gin.Context) {
	common.SetAuditMetadata(c, "business.mdqaorderitem.audit.update", common.BusinessUpdate)
	var req MdqaorderitemUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	id, err := parseUintParam(c, "id")
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	item, err := h.service.UpdateMdqaorderitem(id, &req)
	if err != nil {
		common.Fail(c, common.CodeError, "mdqaorderitem.update.error")
		return
	}
	common.Success(c, item)
}

// DeleteMdqaorderitem 删除
func (h *MdqaorderitemHandler) DeleteMdqaorderitem(c *gin.Context) {
	common.SetAuditMetadata(c, "business.mdqaorderitem.audit.delete", common.BusinessDelete)
	id, err := parseUintParam(c, "id")
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	if err := h.service.DeleteMdqaorderitem(id); err != nil {
		common.Fail(c, common.CodeError, "mdqaorderitem.delete.error")
		return
	}
	common.Success(c, gin.H{"deleted": true})
}

// parseUintParam 解析路径参数
func parseUintParam(c *gin.Context, key string) (uint64, error) {
	return strconv.ParseUint(c.Param(key), 10, 64)
}
