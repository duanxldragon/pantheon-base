package system

import (
	"encoding/json"

	"github.com/gin-gonic/gin"
	"pantheon-platform/backend/pkg/common"
)

type SettingHandler struct {
	service *SettingService
}

func NewSettingHandler(service *SettingService) *SettingHandler {
	return &SettingHandler{service: service}
}

func (h *SettingHandler) GetSettingList(c *gin.Context) {
	var query SettingListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	items, err := h.service.List(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "setting.list.error")
		return
	}
	common.Success(c, items)
}

func (h *SettingHandler) GetSettingGroup(c *gin.Context) {
	group, err := h.service.GetGroup(c.Param("groupKey"))
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, group)
}

func (h *SettingHandler) UpdateSettingGroup(c *gin.Context) {
	var req SettingGroupUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	groupKey := c.Param("groupKey")
	c.Set("operationLog.title", settingAuditTitle)
	c.Set("operationLog.businessType", settingAuditBusinessType)
	successPayload := ""
	if payload, err := h.service.BuildAuditPayload(groupKey, &req, false); err == nil && payload != "" {
		c.Set("operationLog.param", payload)
	}
	if payload, err := h.service.BuildAuditPayload(groupKey, &req, true); err == nil {
		successPayload = payload
	}

	group, err := h.service.UpdateGroup(groupKey, &req)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	if successPayload != "" {
		c.Set("operationLog.param", successPayload)
	}
	if data, err := json.Marshal(gin.H{"updated": true, "groupKey": groupKey}); err == nil {
		c.Set("operationLog.result", string(data))
	}
	common.Success(c, group)
}

func (h *SettingHandler) GetPublicSettings(c *gin.Context) {
	resp, err := h.service.GetPublicSettings()
	if err != nil {
		common.Fail(c, common.CodeError, "setting.public.error")
		return
	}
	common.Success(c, resp)
}

func (h *SettingHandler) RefreshSettingCache(c *gin.Context) {
	var req SettingCacheRefreshReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	resp, err := h.service.RefreshSettingCache(req.GroupKeys)
	if err != nil {
		common.Fail(c, common.CodeError, "setting.cache.refresh.error")
		return
	}
	common.Success(c, resp)
}

func (h *SettingHandler) GetSettingAuditList(c *gin.Context) {
	var query SettingAuditQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	page, err := h.service.ListAudit(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "setting.audit.list.error")
		return
	}
	common.Success(c, page)
}
