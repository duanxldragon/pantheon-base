package middleware

import (
	"errors"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestIsSelfServiceRouteBySignature_MenuTreeScopeBoundary(t *testing.T) {
	if !isSelfServiceRouteBySignature("/api/v1/system/menu/tree", "GET", "nav") {
		t.Fatalf("expected nav menu tree to be self-service")
	}
	if !isSelfServiceRouteBySignature("/api/v1/system/menu/tree", "GET", "") {
		t.Fatalf("expected default menu tree scope to be self-service")
	}
	if isSelfServiceRouteBySignature("/api/v1/system/menu/tree", "GET", "manage") {
		t.Fatalf("expected manage menu tree to remain protected")
	}
}

func TestReadRoleKeysFromContext_PrefersRoleKeysSlice(t *testing.T) {
	c, _ := gin.CreateTestContext(nil)
	c.Set("roleKeys", []string{"admin", "auditor"})
	c.Set("roleKey", "guest")

	roleKeys := readRoleKeysFromContext(c)
	if len(roleKeys) != 2 || roleKeys[0] != "admin" || roleKeys[1] != "auditor" {
		t.Fatalf("expected roleKeys slice from context, got %#v", roleKeys)
	}
}

func TestReadRoleKeysFromContext_FallsBackToSingleRoleKey(t *testing.T) {
	c, _ := gin.CreateTestContext(nil)
	c.Set("roleKey", "operator")

	roleKeys := readRoleKeysFromContext(c)
	if len(roleKeys) != 1 || roleKeys[0] != "operator" {
		t.Fatalf("expected single roleKey fallback, got %#v", roleKeys)
	}
}

func TestAuthorizeRoleKeys_AllowsWhenAnyRoleSucceeds(t *testing.T) {
	allowed, err := authorizeRoleKeys([]string{"guest", "admin"}, "/api/v1/system/users", "GET", func(roleKey, obj, act string) (bool, error) {
		return roleKey == "admin", nil
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if !allowed {
		t.Fatal("expected access to be allowed when one role matches")
	}
}

func TestAuthorizeRoleKeys_DeniesWhenNoRoleMatches(t *testing.T) {
	allowed, err := authorizeRoleKeys([]string{"guest", "operator"}, "/api/v1/system/users", "GET", func(roleKey, obj, act string) (bool, error) {
		return false, nil
	})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if allowed {
		t.Fatal("expected access to be denied when no roles match")
	}
}

func TestAuthorizeRoleKeys_StopsOnEnforcerError(t *testing.T) {
	expectedErr := errors.New("enforce failed")
	allowed, err := authorizeRoleKeys([]string{"admin"}, "/api/v1/system/users", "GET", func(roleKey, obj, act string) (bool, error) {
		return false, expectedErr
	})
	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected %v, got %v", expectedErr, err)
	}
	if allowed {
		t.Fatal("expected access to be denied when enforcer returns error")
	}
}
