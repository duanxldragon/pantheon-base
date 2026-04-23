package cmdb

import (
	"encoding/json"
	"mime/multipart"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"github.com/gin-gonic/gin"
)

type cmdbImportAuditParam struct {
	Domain   string `json:"domain"`
	Entity   string `json:"entity"`
	FileName string `json:"fileName"`
	FileSize int64  `json:"fileSize"`
}

type cmdbImportAuditResult struct {
	Domain      string               `json:"domain"`
	Entity      string               `json:"entity"`
	Applied     bool                 `json:"applied"`
	Created     int                  `json:"created"`
	Updated     int                  `json:"updated"`
	Failed      int                  `json:"failed"`
	ErrorMsg    string               `json:"errorMsg,omitempty"`
	ErrorSample []impexp.ImportError `json:"errorSample,omitempty"`
}

func setCMDBImportAuditParam(c *gin.Context, entity string, fileHeader *multipart.FileHeader) {
	if c == nil || fileHeader == nil {
		return
	}
	payload, err := json.Marshal(cmdbImportAuditParam{
		Domain:   "business.cmdb",
		Entity:   entity,
		FileName: fileHeader.Filename,
		FileSize: fileHeader.Size,
	})
	if err != nil {
		return
	}
	common.SetAuditParam(c, string(payload))
}

func setCMDBImportAuditResult(c *gin.Context, entity string, result *impexp.ImportResult, errorMsg string) {
	if c == nil {
		return
	}
	payload := cmdbImportAuditResult{
		Domain:   "business.cmdb",
		Entity:   entity,
		ErrorMsg: errorMsg,
	}
	if result != nil {
		payload.Applied = result.Applied
		payload.Created = result.Created
		payload.Updated = result.Updated
		payload.Failed = result.Failed
		if len(result.Errors) > 0 {
			limit := len(result.Errors)
			if limit > 5 {
				limit = 5
			}
			payload.ErrorSample = append([]impexp.ImportError{}, result.Errors[:limit]...)
		}
	}
	data, err := json.Marshal(payload)
	if err == nil {
		common.SetAuditResult(c, string(data))
	}
	if result != nil && (!result.Applied || result.Failed > 0) {
		common.SetAuditStatus(c, 2)
		if errorMsg == "" {
			errorMsg = "import.result.has_errors"
		}
	}
	if errorMsg != "" {
		common.SetAuditErrorMsg(c, errorMsg)
	}
}
