package system

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newAuditJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestAuditHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewAuditHandler(nil)

	handler.GetOperationLogList(newAuditJSONContext(http.MethodGet, "/?page=bad", ""))
	handler.CleanupOperationLogs(newAuditJSONContext(http.MethodPost, "/", "{"))
	handler.BatchDeleteOperationLogs(newAuditJSONContext(http.MethodPost, "/", "{"))
	handler.ExportOperationLogs(newAuditJSONContext(http.MethodPost, "/", "{"))

	context := newAuditJSONContext(http.MethodGet, "/", "")
	context.Params = gin.Params{{Key: auditParamID, Value: "bad"}}
	handler.GetOperationLog(context)

	context = newAuditJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: auditParamID, Value: "bad"}}
	handler.DeleteOperationLog(context)
}
