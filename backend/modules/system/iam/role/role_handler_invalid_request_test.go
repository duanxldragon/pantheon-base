package iam

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newRoleJSONContext(method, target, body string) *gin.Context {
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	context.Request = request
	return context
}

func TestRoleHandlerInvalidRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewRoleHandler(nil)

	jsonCases := []func(*gin.Context){
		handler.CreateRole,
		handler.ExportRoles,
		handler.BatchUpdateRoleStatus,
		handler.BatchDeleteRoles,
	}
	for _, fn := range jsonCases {
		fn(newRoleJSONContext(http.MethodPost, "/", "{"))
	}

	queryCases := []func(*gin.Context){
		handler.GetRoleList,
	}
	for _, fn := range queryCases {
		fn(newRoleJSONContext(http.MethodGet, "/?page=bad", ""))
	}

	pathCases := []func(*gin.Context){
		handler.GetRoleMembers,
		handler.GetRoleMemberCandidates,
		handler.AddRoleMembers,
		handler.RemoveRoleMembers,
		handler.DeleteRole,
	}
	for _, fn := range pathCases {
		context := newRoleJSONContext(http.MethodPost, "/", "{")
		context.Params = gin.Params{{Key: roleParamID, Value: "bad"}}
		fn(context)
	}

	context := newRoleJSONContext(http.MethodPut, "/", "{")
	context.Params = gin.Params{{Key: roleParamID, Value: "bad"}}
	handler.UpdateRole(context)
}
