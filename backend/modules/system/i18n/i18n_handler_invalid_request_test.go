package system

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newI18nJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestI18nHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewI18nHandler(nil)

	jsonCases := []func(*gin.Context){
		handler.DeleteArchivedUnusedKeys,
		handler.PreviewRenameKey,
		handler.RenameKey,
		handler.Create,
		handler.DeleteBatch,
		handler.Export,
		handler.ReloadCache,
	}
	for _, fn := range jsonCases {
		fn(newI18nJSONContext(http.MethodPost, "/", "{"))
	}

	handler.List(newI18nJSONContext(http.MethodGet, "/?page=bad", ""))

	context := newI18nJSONContext(http.MethodGet, "/", "")
	context.Params = gin.Params{{Key: i18nIDParamKey, Value: "bad"}}
	handler.Get(context)

	context = newI18nJSONContext(http.MethodPut, "/", "{")
	context.Params = gin.Params{{Key: i18nIDParamKey, Value: "0"}}
	handler.Update(context)

	context = newI18nJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: i18nIDParamKey, Value: "bad"}}
	handler.Delete(context)
}
