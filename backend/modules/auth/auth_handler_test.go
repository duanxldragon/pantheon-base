package auth

import (
	"encoding/json"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	user "pantheon-platform/backend/modules/system/iam/user"
	"pantheon-platform/backend/pkg/common"
)

func TestAuthHandlerHelpers(t *testing.T) {
	t.Run("buildLoginSourceKey trims whitespace", func(t *testing.T) {
		if got := buildLoginSourceKey(" 127.0.0.1 "); got != "ip:127.0.0.1" {
			t.Fatalf("expected trimmed key, got %q", got)
		}
		if got := buildLoginSourceKey("   "); got != "ip:unknown" {
			t.Fatalf("expected unknown key, got %q", got)
		}
	})

	t.Run("preferencesEqual handles nil and changed values", func(t *testing.T) {
		if !preferencesEqual(nil, nil) {
			t.Fatal("expected nil preferences to be equal")
		}

		left := &user.UserPlatformPreferenceResp{Theme: "indigo", Language: "zh-CN", LayoutMode: "vertical", DensityMode: "comfortable"}
		right := &user.UserPlatformPreferenceResp{Theme: "indigo", Language: "zh-CN", LayoutMode: "vertical", DensityMode: "comfortable"}
		if !preferencesEqual(left, right) {
			t.Fatal("expected identical preferences to be equal")
		}

		right.DensityMode = "compact"
		if preferencesEqual(left, right) {
			t.Fatal("expected changed preferences to differ")
		}
	})

	t.Run("buildPreferenceAuditPayload encodes before and after", func(t *testing.T) {
		previous := &user.UserPlatformPreferenceResp{Theme: "indigo"}
		current := &user.UserPlatformPreferenceResp{Theme: "slate"}

		raw := buildPreferenceAuditPayload(previous, current)
		var payload map[string]any
		if err := json.Unmarshal([]byte(raw), &payload); err != nil {
			t.Fatalf("unmarshal payload: %v", err)
		}
		if payload["scope"] != "platform.shell.preferences" {
			t.Fatalf("unexpected scope: %#v", payload["scope"])
		}
	})

	t.Run("buildPreferenceAuditResult includes username and changed flag", func(t *testing.T) {
		resp := &UserInfoResp{ID: 9, Username: "admin"}
		previous := &user.UserPlatformPreferenceResp{Theme: "indigo"}
		current := &user.UserPlatformPreferenceResp{Theme: "slate"}

		raw := buildPreferenceAuditResult(resp, previous, current)
		var payload map[string]any
		if err := json.Unmarshal([]byte(raw), &payload); err != nil {
			t.Fatalf("unmarshal result: %v", err)
		}
		if payload[usernameFieldKey] != "admin" {
			t.Fatalf("expected username in payload, got %#v", payload[usernameFieldKey])
		}
		if payload["changed"] != true {
			t.Fatalf("expected changed=true, got %#v", payload["changed"])
		}
	})

	t.Run("marshalAuthAuditPayload falls back to object", func(t *testing.T) {
		type unsupported struct {
			Channel chan int `json:"channel"`
		}
		if got := marshalAuthAuditPayload(unsupported{Channel: make(chan int)}); got != "{}" {
			t.Fatalf("expected fallback payload, got %q", got)
		}
	})

	t.Run("writeSessionCookies sets access refresh and csrf cookies", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		if err := writeSessionCookies(recorder, "access-token", "refresh-token"); err != nil {
			t.Fatalf("write session cookies: %v", err)
		}

		setCookies := recorder.Header().Values("Set-Cookie")
		if len(setCookies) < 3 {
			t.Fatalf("expected at least 3 cookies, got %d", len(setCookies))
		}

		var names []string
		for _, item := range setCookies {
			switch {
			case strings.HasPrefix(item, common.CookieAccessToken+"="):
				names = append(names, common.CookieAccessToken)
			case strings.HasPrefix(item, common.CookieRefreshToken+"="):
				names = append(names, common.CookieRefreshToken)
			case strings.HasPrefix(item, common.CookieCSRFToken+"="):
				names = append(names, common.CookieCSRFToken)
			}
		}

		expected := []string{common.CookieAccessToken, common.CookieRefreshToken, common.CookieCSRFToken}
		if !reflect.DeepEqual(names, expected) {
			t.Fatalf("unexpected cookie names: %#v", names)
		}
	})
}
