package mdqaorder

import (
	"github.com/gin-gonic/gin"
	"pantheon-platform/backend/pkg/common"
	"strconv"
)

type MdqaorderHandler struct {
	service *MdqaorderService
}

func NewMdqaorderHandler(s *MdqaorderService) *MdqaorderHandler {
	return &MdqaorderHandler{service: s}
}

// GetMdqaorderList 获取列表
func (h *MdqaorderHandler) GetMdqaorderList(c *gin.Context) {
	var query MdqaorderListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	dataScope := common.GetDataScope(c)
	list, err := h.service.ListMdqaorders(&query, dataScope)
	if err != nil {
		common.Fail(c, common.CodeError, "mdqaorder.list.error")
		return
	}
	common.Success(c, list)
}

// GetMdqaorderOptions 获取关系选项
func (h *MdqaorderHandler) GetMdqaorderOptions(c *gin.Context) {
	options, err := h.service.ListMdqaorderOptions()
	if err != nil {
		common.Fail(c, common.CodeError, "mdqaorder.options.error")
		return
	}
	common.Success(c, options)
}

// GetMdqaorderDetail 获取详情
func (h *MdqaorderHandler) GetMdqaorderDetail(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	detail, err := h.service.GetMdqaorderDetail(id)
	if err != nil {
		common.Fail(c, common.CodeError, "mdqaorder.detail.error")
		return
	}
	common.Success(c, detail)
}

// CreateMdqaorder 创建
func (h *MdqaorderHandler) CreateMdqaorder(c *gin.Context) {
	common.SetAuditMetadata(c, "business.mdqaorder.audit.create", common.BusinessInsert)
	var req MdqaorderCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	item, err := h.service.CreateMdqaorder(&req)
	if err != nil {
		common.Fail(c, common.CodeError, "mdqaorder.create.error")
		return
	}
	common.Success(c, item)
}

// UpdateMdqaorder 更新
func (h *MdqaorderHandler) UpdateMdqaorder(c *gin.Context) {
	common.SetAuditMetadata(c, "business.mdqaorder.audit.update", common.BusinessUpdate)
	var req MdqaorderUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	id, err := parseUintParam(c, "id")
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	item, err := h.service.UpdateMdqaorder(id, &req)
	if err != nil {
		common.Fail(c, common.CodeError, "mdqaorder.update.error")
		return
	}
	common.Success(c, item)
}

// DeleteMdqaorder 删除
func (h *MdqaorderHandler) DeleteMdqaorder(c *gin.Context) {
	common.SetAuditMetadata(c, "business.mdqaorder.audit.delete", common.BusinessDelete)
	id, err := parseUintParam(c, "id")
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	if err := h.service.DeleteMdqaorder(id); err != nil {
		common.Fail(c, common.CodeError, "mdqaorder.delete.error")
		return
	}
	common.Success(c, gin.H{"deleted": true})
}

// parseUintParam 解析路径参数
func parseUintParam(c *gin.Context, key string) (uint64, error) {
	return strconv.ParseUint(c.Param(key), 10, 64)
}
