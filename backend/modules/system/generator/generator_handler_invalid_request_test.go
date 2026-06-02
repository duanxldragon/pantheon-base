package generator

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newGeneratorJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestGeneratorHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewGeneratorHandler(nil)

	jsonCases := []func(*gin.Context){
		handler.CreateDatasource,
		handler.UpdateDatasource,
		handler.PreviewGeneratedFiles,
		handler.DownloadGeneratedSource,
	}
	for _, fn := range jsonCases {
		context := newGeneratorJSONContext(http.MethodPost, "/", "{")
		context.Params = gin.Params{{Key: generatorParamID, Value: "datasource"}}
		fn(context)
	}

	handler.PreviewTable(newGeneratorJSONContext(http.MethodGet, "/", ""))
}
