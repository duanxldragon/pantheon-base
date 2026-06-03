package iam

import (
	"net/http"
	"strings"
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

func TestUserService_NilDBPublicGuards(t *testing.T) {
	service := NewUserService(nil)

	cases := []struct {
		name string
		run  func() error
	}{
		{"migrate", service.Migrate},
		{"normalize preference json", service.normalizeUserPreferenceJSON},
		{"get user roles", func() error { _, err := service.GetUserRoles(1); return err }},
		{"get user perms", func() error { _, err := service.GetUserPerms(1); return err }},
		{"get profile", func() error { _, err := service.GetProfile(1); return err }},
		{"list users", func() error { _, err := service.ListUsers(nil, nil); return err }},
		{"get user detail", func() error { _, err := service.GetUserDetail(1); return err }},
		{"create user", func() error {
			_, err := service.CreateUser(&UserCreateReq{Username: "demo", Password: "ChangeMe123", Status: 1})
			return err
		}},
		{"update user", func() error { _, err := service.UpdateUser(1, &UserUpdateReq{Nickname: "demo", Status: 1}); return err }},
		{"update profile", func() error { _, err := service.UpdateProfile(1, &UserProfileUpdateReq{Nickname: "demo"}); return err }},
		{"reset password", func() error { _, err := service.ResetPassword(1, "ChangeMe123"); return err }},
		{"batch update status", func() error { _, err := service.BatchUpdateUserStatus([]uint64{1}, 1); return err }},
		{"delete user", func() error { return service.DeleteUser(2) }},
		{"export users", func() error { _, err := service.ExportUsers(nil); return err }},
		{"import users", func() error { _, err := service.ImportUsers([][]string{{"username"}}); return err }},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.run(); err == nil || err.Error() != userDatabaseNotInitializedKey {
				t.Fatalf("expected %s, got %v", userDatabaseNotInitializedKey, err)
			}
		})
	}
}

func TestUserService_HelperGuards(t *testing.T) {
	if err := validateOptionalEmail("bad-email"); err == nil || err.Error() != userEmailInvalidKey {
		t.Fatalf("expected invalid email error, got %v", err)
	}

	if _, err := marshalUserProfileExt(map[string]interface{}{"invalid": make(chan int)}); err == nil || err.Error() != userProfileExtInvalidKey {
		t.Fatalf("expected invalid profile ext error, got %v", err)
	}

	if _, err := marshalUserProfileExt(map[string]interface{}{"bio": strings.Repeat("x", maxUserProfileExtBytes+1)}); err == nil || err.Error() != userProfileExtTooLargeKey {
		t.Fatalf("expected too-large profile ext error, got %v", err)
	}

	if _, err := unmarshalUserProfileExt("{"); err == nil || err.Error() != userProfileExtInvalidKey {
		t.Fatalf("expected invalid profile ext json error, got %v", err)
	}
}
