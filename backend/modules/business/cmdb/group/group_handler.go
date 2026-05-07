package group

import (
	"encoding/json"
	"strconv"

	"pantheon-platform/backend/pkg/common"

	"github.com/gin-gonic/gin"
)

type GroupHandler struct {
	svc *GroupService
}

func NewGroupHandler(svc *GroupService) *GroupHandler {
	return &GroupHandler{svc: svc}
}

func (h *GroupHandler) RegisterRoutes(r gin.IRoutes) {
	r.GET("/groups", h.List)
	r.GET("/groups/:id", h.GetByID)
	r.GET("/groups/:id/members", h.GetMembers)
	r.POST("/groups", h.Create)
	r.PUT("/groups/:id", h.Update)
	r.DELETE("/groups/:id", h.Delete)
}

func (h *GroupHandler) List(c *gin.Context) {
	items, err := h.svc.List()
	if err != nil {
		common.FailWithError(c, common.CodeError, err, "cmdbgroup.list_failed")
		return
	}
	common.Success(c, items)
}

func (h *GroupHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "common.param_invalid")
		return
	}
	resp, err := h.svc.GetByID(id)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, "cmdbgroup.not_found")
		return
	}
	common.Success(c, resp)
}

func (h *GroupHandler) GetMembers(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "common.param_invalid")
		return
	}
	members, group, err := h.svc.GetMembers(id)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, "cmdbgroup.not_found")
		return
	}
	memberMaps := make([]map[string]interface{}, len(members))
	for i, m := range members {
		memberMaps[i] = hostToMap(&m)
	}
	common.Success(c, map[string]interface{}{
		"groupId":   group.ID,
		"groupName": group.Name,
		"members":   memberMaps,
	})
}

func (h *GroupHandler) Create(c *gin.Context) {
	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "common.param_invalid")
		return
	}
	resp, err := h.svc.Create(req)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, "cmdbgroup.create_failed")
		return
	}
	common.Success(c, resp)
}

func (h *GroupHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "common.param_invalid")
		return
	}
	var req UpdateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "common.param_invalid")
		return
	}
	resp, err := h.svc.Update(id, req)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, "cmdbgroup.update_failed")
		return
	}
	common.Success(c, resp)
}

func (h *GroupHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "common.param_invalid")
		return
	}
	if err := h.svc.Delete(id); err != nil {
		common.FailWithError(c, common.CodeError, err, "cmdbgroup.delete_failed")
		return
	}
	common.Success(c, nil)
}

func hostToMap(h *Host) map[string]interface{} {
	var labels []LabelEntry
	if len(h.LabelValues) > 0 {
		json.Unmarshal(h.LabelValues, &labels)
	}
	return map[string]interface{}{
		"id":           h.ID,
		"hostname":     h.Hostname,
		"ip":           h.IP,
		"status":       h.Status,
		"os":           h.OS,
		"osVersion":    h.OSVersion,
		"cpuCores":     h.CPUCores,
		"memoryGb":     h.MemoryGB,
		"diskGb":       h.DiskGB,
		"labelValues":  labels,
	}
}
