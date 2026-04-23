package system

import (
	"strconv"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"github.com/gin-gonic/gin"
)

type AuditHandler struct {
	service *AuditService
}

func NewAuditHandler(s *AuditService) *AuditHandler {
	return &AuditHandler{service: s}
}

func (h *AuditHandler) GetOperationLogList(c *gin.Context) {
	var query OperationLogQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	page, err := h.service.ListOperationLogs(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "audit.operation_log.list.error")
		return
	}
	common.Success(c, page)
}

func (h *AuditHandler) DeleteOperationLog(c *gin.Context) {
	common.SetAuditMetadata(c, "删除操作日志", common.BusinessDelete)
	logID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	if err := h.service.DeleteOperationLog(logID); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"deleted": true})
}

func (h *AuditHandler) ClearOperationLogs(c *gin.Context) {
	common.SetAuditMetadata(c, "清空操作日志", common.BusinessClean)
	if err := h.service.ClearOperationLogs(); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"cleared": true})
}

func (h *AuditHandler) ExportOperationLogs(c *gin.Context) {
	common.SetAuditMetadata(c, "导出操作日志", common.BusinessExport)

	var query OperationLogQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	file, err := h.service.ExportOperationLogs(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "audit.operation_log.export.error")
		return
	}
	if err := impexp.WriteCSV(c, *file); err != nil {
		common.Fail(c, common.CodeError, "audit.operation_log.export.error")
	}
}
