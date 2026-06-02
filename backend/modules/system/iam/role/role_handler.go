package iam

import (
	"strconv"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"github.com/gin-gonic/gin"
)

const (
	roleParamInvalidMessageKey  = "param.invalid"
	roleRequestFailedMessageKey = "request.failed"
	roleParamID                 = "id"
	roleUpdatedCountField       = "updatedCount"
	roleAddedCountField         = "addedCount"
	roleRemovedCountField       = "removedCount"
	roleDeletedField            = "deleted"
)

type RoleHandler struct {
	service *RoleService
}

func NewRoleHandler(s *RoleService) *RoleHandler {
	return &RoleHandler{service: s}
}

// GetRoleList 获取角色列表。
func (h *RoleHandler) GetRoleList(c *gin.Context) {
	var query RoleListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	list, err := h.service.ListRoles(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "role.list.error")
		return
	}
	common.Success(c, list)
}

// CreateRole 创建角色。
func (h *RoleHandler) CreateRole(c *gin.Context) {
	common.SetAuditMetadata(c, "role.create.title", common.BusinessInsert)

	var req RoleCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	role, err := h.service.CreateRole(&req)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, roleRequestFailedMessageKey)
		return
	}
	common.Success(c, role)
}

func (h *RoleHandler) ExportRoles(c *gin.Context) {
	common.SetAuditMetadata(c, "导出角色", common.BusinessExport)

	var query RoleListQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	file, err := h.service.ExportRoles(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "role.export.error")
		return
	}
	if err := impexp.WriteCSV(c, *file); err != nil {
		common.Fail(c, common.CodeError, "role.export.error")
	}
}

// UpdateRole 更新角色。
func (h *RoleHandler) UpdateRole(c *gin.Context) {
	common.SetAuditMetadata(c, "role.update.title", common.BusinessUpdate)

	var req RoleUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	roleID, err := parseRoleUintPathParam(c, roleParamID)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	role, err := h.service.UpdateRole(roleID, &req)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, roleRequestFailedMessageKey)
		return
	}
	common.Success(c, role)
}

func (h *RoleHandler) BatchUpdateRoleStatus(c *gin.Context) {
	common.SetAuditMetadata(c, "批量更新角色状态", common.BusinessUpdate)

	var req RoleBatchStatusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	updatedCount, err := h.service.BatchUpdateRoleStatus(req.RoleIDs, req.Status)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, roleRequestFailedMessageKey)
		return
	}
	common.Success(c, gin.H{roleUpdatedCountField: updatedCount})
}

func (h *RoleHandler) BatchDeleteRoles(c *gin.Context) {
	common.SetAuditMetadata(c, "批量删除角色", common.BusinessDelete)

	var req common.BatchDeleteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}
	resp := common.BatchDelete(req.IDs, h.service.DeleteRole)
	common.Success(c, resp)
}

func (h *RoleHandler) GetRoleMembers(c *gin.Context) {
	roleID, err := parseRoleUintPathParam(c, roleParamID)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	var query RoleMemberQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	resp, err := h.service.ListRoleMembers(roleID, &query)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, roleRequestFailedMessageKey)
		return
	}
	common.Success(c, resp)
}

func (h *RoleHandler) GetRoleMemberCandidates(c *gin.Context) {
	roleID, err := parseRoleUintPathParam(c, roleParamID)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	var query RoleMemberQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	resp, err := h.service.ListAssignableUsers(roleID, &query)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, roleRequestFailedMessageKey)
		return
	}
	common.Success(c, resp)
}

func (h *RoleHandler) AddRoleMembers(c *gin.Context) {
	common.SetAuditMetadata(c, "维护角色成员", common.BusinessUpdate)

	roleID, err := parseRoleUintPathParam(c, roleParamID)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	var req RoleMemberAssignReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	addedCount, err := h.service.AddRoleMembers(roleID, req.UserIDs)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, roleRequestFailedMessageKey)
		return
	}
	common.Success(c, gin.H{roleAddedCountField: addedCount})
}

func (h *RoleHandler) RemoveRoleMembers(c *gin.Context) {
	common.SetAuditMetadata(c, "移除角色成员", common.BusinessUpdate)

	roleID, err := parseRoleUintPathParam(c, roleParamID)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	var req RoleMemberAssignReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	removedCount, err := h.service.RemoveRoleMembers(roleID, req.UserIDs)
	if err != nil {
		common.FailWithError(c, common.CodeError, err, roleRequestFailedMessageKey)
		return
	}
	common.Success(c, gin.H{roleRemovedCountField: removedCount})
}

// DeleteRole 删除角色。
func (h *RoleHandler) DeleteRole(c *gin.Context) {
	common.SetAuditMetadata(c, "role.delete.title", common.BusinessDelete)

	roleID, err := parseRoleUintPathParam(c, roleParamID)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, roleParamInvalidMessageKey)
		return
	}

	if err := h.service.DeleteRole(roleID); err != nil {
		common.FailWithError(c, common.CodeError, err, roleRequestFailedMessageKey)
		return
	}
	common.Success(c, gin.H{roleDeletedField: true})
}

func parseRoleUintPathParam(c *gin.Context, key string) (uint64, error) {
	return strconv.ParseUint(c.Param(key), 10, 64)
}
