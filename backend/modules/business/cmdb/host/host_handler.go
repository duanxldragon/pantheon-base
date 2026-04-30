package host

import (
	"pantheon-platform/backend/pkg/common"
	"strconv"
	"github.com/gin-gonic/gin"
)

type CmdbHostHandler struct {
	service *CmdbHostService
}

func NewCmdbHostHandler(s *CmdbHostService) *CmdbHostHandler {
	return &CmdbHostHandler{service: s}
}

// GetCmdbHostList 获取列表
func (h *CmdbHostHandler) GetCmdbHostList(c *gin.Context) {
	var query CmdbHostListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	dataScope := common.GetDataScope(c)
	list, err := h.service.ListCmdbHosts(&query, dataScope)
	if err != nil {
		common.Fail(c, common.CodeError, "cmdbhost.list.error")
		return
	}
	common.Success(c, list)
}

// GetCmdbHostDetail 获取详情
func (h *CmdbHostHandler) GetCmdbHostDetail(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	detail, err := h.service.GetCmdbHostDetail(id)
	if err != nil {
		common.Fail(c, common.CodeError, "cmdbhost.detail.error")
		return
	}
	common.Success(c, detail)
}

// CreateCmdbHost 创建
func (h *CmdbHostHandler) CreateCmdbHost(c *gin.Context) {
	common.SetAuditMetadata(c, "business.cmdb.host.audit.create", common.BusinessInsert)
	var req CmdbHostCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	item, err := h.service.CreateCmdbHost(&req)
	if err != nil {
		common.Fail(c, common.CodeError, "cmdbhost.create.error")
		return
	}
	common.Success(c, item)
}

// UpdateCmdbHost 更新
func (h *CmdbHostHandler) UpdateCmdbHost(c *gin.Context) {
	common.SetAuditMetadata(c, "business.cmdb.host.audit.update", common.BusinessUpdate)
	var req CmdbHostUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	id, err := parseUintParam(c, "id")
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	item, err := h.service.UpdateCmdbHost(id, &req)
	if err != nil {
		common.Fail(c, common.CodeError, "cmdbhost.update.error")
		return
	}
	common.Success(c, item)
}

// DeleteCmdbHost 删除
func (h *CmdbHostHandler) DeleteCmdbHost(c *gin.Context) {
	common.SetAuditMetadata(c, "business.cmdb.host.audit.delete", common.BusinessDelete)
	id, err := parseUintParam(c, "id")
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	if err := h.service.DeleteCmdbHost(id); err != nil {
		common.Fail(c, common.CodeError, "cmdbhost.delete.error")
		return
	}
	common.Success(c, gin.H{"deleted": true})
}

// parseUintParam 解析路径参数
func parseUintParam(c *gin.Context, key string) (uint64, error) {
	return strconv.ParseUint(c.Param(key), 10, 64)
}
