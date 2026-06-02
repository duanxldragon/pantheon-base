package org

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newDeptJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestDeptHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewDeptHandler(nil)

	jsonCases := []func(*gin.Context){
		handler.CreateDept,
		handler.BatchUpdateDeptStatus,
		handler.BatchUpdateDeptLeader,
		handler.BatchDeleteDepts,
		handler.ExportDepts,
		handler.ExportGovernanceTasks,
	}
	for _, fn := range jsonCases {
		fn(newDeptJSONContext(http.MethodPost, "/", "{"))
	}

	handler.GetDeptTree(newDeptJSONContext(http.MethodGet, "/?status=bad", ""))

	pathCases := []func(*gin.Context){
		handler.DeleteDept,
	}
	for _, fn := range pathCases {
		context := newDeptJSONContext(http.MethodDelete, "/", "")
		context.Params = gin.Params{{Key: deptParamID, Value: "bad"}}
		fn(context)
	}

	context := newDeptJSONContext(http.MethodPut, "/", "{")
	context.Params = gin.Params{{Key: deptParamID, Value: "bad"}}
	handler.UpdateDept(context)
}
