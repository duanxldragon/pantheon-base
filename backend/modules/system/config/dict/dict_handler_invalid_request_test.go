package config

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newDictJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestDictHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewDictHandler(nil)

	jsonCases := []func(*gin.Context){
		handler.CreateDictType,
		handler.BatchUpdateDictTypeStatus,
		handler.BatchDeleteDictTypes,
		handler.CreateDictItem,
		handler.BatchUpdateDictItemStatus,
		handler.BatchDeleteDictItems,
		handler.RefreshDictOptionsCache,
		handler.ExportDictTypes,
		handler.ExportDictItems,
	}
	for _, fn := range jsonCases {
		fn(newDictJSONContext(http.MethodPost, "/", "{"))
	}

	context := newDictJSONContext(http.MethodPut, "/", "{")
	context.Params = gin.Params{{Key: dictParamID, Value: "bad"}}
	handler.UpdateDictType(context)

	context = newDictJSONContext(http.MethodPut, "/", "{")
	context.Params = gin.Params{{Key: dictParamID, Value: "bad"}}
	handler.UpdateDictItem(context)

	context = newDictJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: dictParamID, Value: "bad"}}
	handler.DeleteDictType(context)

	context = newDictJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: dictParamID, Value: "bad"}}
	handler.DeleteDictItem(context)

	context = newDictJSONContext(http.MethodPost, "/", `{"direction":"up"}`)
	context.Params = gin.Params{{Key: dictParamID, Value: "bad"}}
	handler.ReorderDictItem(context)

	handler.GetDictTypeList(newDictJSONContext(http.MethodGet, "/?status=bad", ""))
	handler.GetDictItemList(newDictJSONContext(http.MethodGet, "/?page=bad", ""))
	handler.AnalyzeDictUsage(newDictJSONContext(http.MethodGet, "/", ""))
}
