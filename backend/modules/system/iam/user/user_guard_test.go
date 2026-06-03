package iam

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestUserHandler_NilDBServicePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewUserHandler(NewUserService(nil))

	context := newUserJSONContext(http.MethodGet, "/", "")
	context.Set(userContextIDKey, uint64(1))
	handler.GetProfile(context)

	context = newUserJSONContext(http.MethodPost, "/", `{"profileExt":{"theme":"indigo"}}`)
	context.Set(userContextIDKey, uint64(1))
	handler.UpdateProfile(context)

	handler.GetUserList(newUserJSONContext(http.MethodGet, "/?page=1", ""))
	handler.ExportUsers(newUserJSONContext(http.MethodPost, "/", `{}`))
	handler.CreateUser(newUserJSONContext(http.MethodPost, "/", `{"username":"demo","password":"ChangeMe123","status":1}`))

	context = newUserJSONContext(http.MethodPut, "/", `{"nickname":"demo","status":1}`)
	context.Params = gin.Params{{Key: userParamID, Value: "1"}}
	handler.UpdateUser(context)

	context = newUserJSONContext(http.MethodPost, "/", `{"newPassword":"ChangeMe123"}`)
	context.Params = gin.Params{{Key: userParamID, Value: "1"}}
	handler.ResetPassword(context)

	handler.BatchUpdateUserStatus(newUserJSONContext(http.MethodPost, "/", `{"userIds":[1],"status":1}`))
	handler.BatchDeleteUsers(newUserJSONContext(http.MethodPost, "/", `{"ids":[1]}`))

	context = newUserJSONContext(http.MethodGet, "/", "")
	context.Params = gin.Params{{Key: userParamID, Value: "1"}}
	handler.GetUserDetail(context)

	context = newUserJSONContext(http.MethodDelete, "/", "")
	context.Params = gin.Params{{Key: userParamID, Value: "1"}}
	handler.DeleteUser(context)
}

func TestUserService_GuardBranches(t *testing.T) {
	db := setupUserTestDB(t)
	service := NewUserService(db)

	if _, err := service.BatchUpdateUserStatus(nil, 1); err == nil || err.Error() != "user.batch.empty" {
		t.Fatalf("expected empty user batch error, got %v", err)
	}
	if _, err := service.BatchUpdateUserStatus([]uint64{1}, 3); err == nil || err.Error() != "param.invalid" {
		t.Fatalf("expected invalid user status error, got %v", err)
	}
	if _, err := service.ResetPassword(1, "123"); err == nil || err.Error() != "user.update.error.password_too_short" {
		t.Fatalf("expected short-password reset error, got %v", err)
	}
	if err := service.DeleteUser(1); err == nil || err.Error() != "user.delete.error.protected" {
		t.Fatalf("expected protected delete error, got %v", err)
	}
	if err := service.validateUserCreate(&UserCreateReq{Username: "demo", Password: "123"}); err == nil || err.Error() != "user.update.error.password_too_short" {
		t.Fatalf("expected create password length error, got %v", err)
	}
}
