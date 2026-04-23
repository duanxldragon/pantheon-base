package cmdb

import (
	"strconv"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"github.com/gin-gonic/gin"
)

type CMDBHandler struct {
	service *CMDBService
}

func NewCMDBHandler(service *CMDBService) *CMDBHandler {
	return &CMDBHandler{service: service}
}

func (h *CMDBHandler) GetTypeList(c *gin.Context) {
	var query CMDBTypeListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	page, err := h.service.ListTypes(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "cmdb.type.list.error")
		return
	}
	common.Success(c, page)
}

func (h *CMDBHandler) CreateType(c *gin.Context) {
	common.SetAuditMetadata(c, "新增 CMDB 资源类型", common.BusinessInsert)
	var req CMDBTypeCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	row, err := h.service.CreateType(&req)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, row)
}

func (h *CMDBHandler) UpdateType(c *gin.Context) {
	common.SetAuditMetadata(c, "编辑 CMDB 资源类型", common.BusinessUpdate)
	typeID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	var req CMDBTypeUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	row, err := h.service.UpdateType(typeID, &req)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, row)
}

func (h *CMDBHandler) DeleteType(c *gin.Context) {
	common.SetAuditMetadata(c, "删除 CMDB 资源类型", common.BusinessDelete)
	typeID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	if err := h.service.DeleteType(typeID); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"deleted": true})
}

func (h *CMDBHandler) ExportTypes(c *gin.Context) {
	common.SetAuditMetadata(c, "导出 CMDB 资源类型", common.BusinessExport)
	var query CMDBTypeListQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	file, err := h.service.ExportTypes(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "cmdb.type.export.error")
		return
	}
	if err := impexp.WriteCSV(c, *file); err != nil {
		common.Fail(c, common.CodeError, "cmdb.type.export.error")
	}
}

func (h *CMDBHandler) DownloadTypeImportTemplate(c *gin.Context) {
	file := h.service.BuildTypeImportTemplate()
	if err := impexp.WriteCSV(c, *file); err != nil {
		common.Fail(c, common.CodeError, "cmdb.type.import_template.error")
	}
}

func (h *CMDBHandler) ImportTypes(c *gin.Context) {
	common.SetAuditMetadata(c, "导入 CMDB 资源类型", common.BusinessImport)
	fileHeader, err := c.FormFile("file")
	if err != nil {
		setCMDBImportAuditResult(c, "type", nil, "import.file.required")
		common.Fail(c, common.CodeParamInvalid, "import.file.required")
		return
	}
	setCMDBImportAuditParam(c, "type", fileHeader)
	file, err := fileHeader.Open()
	if err != nil {
		setCMDBImportAuditResult(c, "type", nil, "import.file.read.error")
		common.Fail(c, common.CodeError, "import.file.read.error")
		return
	}
	records, err := impexp.ReadCSV(file)
	if err != nil {
		setCMDBImportAuditResult(c, "type", nil, "import.file.invalid_csv")
		common.Fail(c, common.CodeParamInvalid, "import.file.invalid_csv")
		return
	}
	result, err := h.service.ImportTypes(records)
	if err != nil {
		setCMDBImportAuditResult(c, "type", result, "cmdb.type.import.error")
		common.Fail(c, common.CodeError, "cmdb.type.import.error")
		return
	}
	setCMDBImportAuditResult(c, "type", result, "")
	common.Success(c, result)
}

func (h *CMDBHandler) GetItemList(c *gin.Context) {
	var query CMDBItemListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	page, err := h.service.ListItems(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "cmdb.item.list.error")
		return
	}
	common.Success(c, page)
}

func (h *CMDBHandler) GetItemDetail(c *gin.Context) {
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	row, err := h.service.GetItemDetail(itemID)
	if err != nil {
		common.Fail(c, common.CodeError, "cmdb.item.detail.error")
		return
	}
	common.Success(c, row)
}

func (h *CMDBHandler) CreateItem(c *gin.Context) {
	common.SetAuditMetadata(c, "新增 CMDB 资源实例", common.BusinessInsert)
	var req CMDBItemCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	row, err := h.service.CreateItem(&req)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, row)
}

func (h *CMDBHandler) UpdateItem(c *gin.Context) {
	common.SetAuditMetadata(c, "编辑 CMDB 资源实例", common.BusinessUpdate)
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	var req CMDBItemUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	row, err := h.service.UpdateItem(itemID, &req)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, row)
}

func (h *CMDBHandler) DeleteItem(c *gin.Context) {
	common.SetAuditMetadata(c, "删除 CMDB 资源实例", common.BusinessDelete)
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	if err := h.service.DeleteItem(itemID); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"deleted": true})
}

func (h *CMDBHandler) CreateRelation(c *gin.Context) {
	common.SetAuditMetadata(c, "新增 CMDB 资源关系", common.BusinessInsert)
	var req CMDBRelationCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	row, err := h.service.CreateRelation(&req)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, row)
}

func (h *CMDBHandler) DeleteRelation(c *gin.Context) {
	common.SetAuditMetadata(c, "删除 CMDB 资源关系", common.BusinessDelete)
	relationID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	if err := h.service.DeleteRelation(relationID); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"deleted": true})
}

func (h *CMDBHandler) ExportItems(c *gin.Context) {
	common.SetAuditMetadata(c, "导出 CMDB 资源实例", common.BusinessExport)
	var query CMDBItemListQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	file, err := h.service.ExportItems(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "cmdb.item.export.error")
		return
	}
	if err := impexp.WriteCSV(c, *file); err != nil {
		common.Fail(c, common.CodeError, "cmdb.item.export.error")
	}
}

func (h *CMDBHandler) DownloadItemImportTemplate(c *gin.Context) {
	file := h.service.BuildItemImportTemplate()
	if err := impexp.WriteCSV(c, *file); err != nil {
		common.Fail(c, common.CodeError, "cmdb.item.import_template.error")
	}
}

func (h *CMDBHandler) ImportItems(c *gin.Context) {
	common.SetAuditMetadata(c, "导入 CMDB 资源实例", common.BusinessImport)
	fileHeader, err := c.FormFile("file")
	if err != nil {
		setCMDBImportAuditResult(c, "item", nil, "import.file.required")
		common.Fail(c, common.CodeParamInvalid, "import.file.required")
		return
	}
	setCMDBImportAuditParam(c, "item", fileHeader)
	file, err := fileHeader.Open()
	if err != nil {
		setCMDBImportAuditResult(c, "item", nil, "import.file.read.error")
		common.Fail(c, common.CodeError, "import.file.read.error")
		return
	}
	records, err := impexp.ReadCSV(file)
	if err != nil {
		setCMDBImportAuditResult(c, "item", nil, "import.file.invalid_csv")
		common.Fail(c, common.CodeParamInvalid, "import.file.invalid_csv")
		return
	}
	result, err := h.service.ImportItems(records)
	if err != nil {
		setCMDBImportAuditResult(c, "item", result, "cmdb.item.import.error")
		common.Fail(c, common.CodeError, "cmdb.item.import.error")
		return
	}
	setCMDBImportAuditResult(c, "item", result, "")
	common.Success(c, result)
}
