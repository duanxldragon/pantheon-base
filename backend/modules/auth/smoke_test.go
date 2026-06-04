package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	user "pantheon-platform/backend/modules/system/iam/user"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/testmysql"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func setupSmokeTestRouter(t *testing.T) (*gin.Engine, *gorm.DB) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	db := testmysql.Open(t)

	// 清理旧表
	_ = db.Exec("DROP TABLE IF EXISTS system_user")
	_ = db.Exec("DROP TABLE IF EXISTS system_user_session")
	_ = db.Exec("DROP TABLE IF EXISTS system_log_login")
	_ = db.Exec("DROP TABLE IF EXISTS system_login_throttle")
	_ = db.Exec("DROP TABLE IF EXISTS system_auth_factor")
	_ = db.Exec("DROP TABLE IF EXISTS system_auth_mfa_challenge")
	_ = db.Exec("DROP TABLE IF EXISTS system_role")
	_ = db.Exec("DROP TABLE IF EXISTS system_user_role")
	_ = db.Exec("DROP TABLE IF EXISTS system_role_permission")

	// 迁移所有核心表
	_ = db.AutoMigrate(&user.SystemUser{}, &SystemUserSession{}, &SystemLogLogin{}, &SystemLoginThrottle{}, &SystemAuthFactor{}, &SystemAuthMFAChallenge{})
	_ = db.Exec("CREATE TABLE IF NOT EXISTS system_role (id BIGINT PRIMARY KEY, role_key VARCHAR(64), status INT)")
	_ = db.Exec("CREATE TABLE IF NOT EXISTS system_user_role (user_id BIGINT, role_id BIGINT)")
	_ = db.Exec("CREATE TABLE IF NOT EXISTS system_role_permission (role_id BIGINT, permission_key VARCHAR(128))")

	// 创建初始管理员
	hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	db.Create(&user.SystemUser{
		ID:       1,
		Username: "admin",
		Password: string(hash),
		Status:   1,
	})
	_ = db.Exec("INSERT INTO system_role (id, role_key, status) VALUES (1, 'admin', 1)")
	_ = db.Exec("INSERT INTO system_user_role (user_id, role_id) VALUES (1, 1)")
	_ = db.Exec("INSERT INTO system_role_permission (role_id, permission_key) VALUES (1, 'sys:dashboard:view')")

	authSvc := NewAuthService(db)
	handler := NewAuthHandler(authSvc)

	r := gin.Default()
	v1 := r.Group("/api/v1")
	{
		v1.POST("/auth/login", handler.LoginHandler)
		v1.POST("/auth/refresh", handler.RefreshTokenHandler)
	}

	return r, db
}

func TestSmoke_LoginFlow(t *testing.T) {
	r, db := setupSmokeTestRouter(t)

	tests := []struct {
		name            string
		username        string
		password        string
		expectedCode    int
		expectedBizCode int
	}{
		{
			name:            "Valid Admin Login",
			username:        "admin",
			password:        "123456",
			expectedCode:    http.StatusOK,
			expectedBizCode: 200,
		},
		{
			name:            "Wrong Password",
			username:        "admin",
			password:        "wrongpass",
			expectedCode:    http.StatusOK,
			expectedBizCode: 401,
		},
		{
			name:            "Non-existent User",
			username:        "nobody",
			password:        "123456",
			expectedCode:    http.StatusOK,
			expectedBizCode: 401,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(LoginReq{
				Username: tt.username,
				Password: tt.password,
			})
			req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != tt.expectedCode {
				t.Errorf("expected http code %d, got %d", tt.expectedCode, w.Code)
			}

			var resp common.Response
			_ = json.Unmarshal(w.Body.Bytes(), &resp)
			if resp.Code != tt.expectedBizCode {
				t.Errorf("expected biz code %d, got %d. Msg: %s", tt.expectedBizCode, resp.Code, resp.Message)
			}
		})
	}

	var loginLogCount int64
	if err := db.Model(&SystemLogLogin{}).Count(&loginLogCount).Error; err != nil {
		t.Fatalf("count login logs: %v", err)
	}
	if loginLogCount != int64(len(tests)) {
		t.Fatalf("expected %d login logs, got %d", len(tests), loginLogCount)
	}
}

func TestSmoke_LoginFlowSetsHttpOnlyCSRFCookieAndHeader(t *testing.T) {
	r, _ := setupSmokeTestRouter(t)

	body, _ := json.Marshal(LoginReq{
		Username: "admin",
		Password: "123456",
	})
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	r.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", recorder.Code)
	}

	var resp struct {
		Code int `json:"code"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode login response: %v", err)
	}
	if resp.Code != common.CodeSuccess {
		t.Fatalf("expected business success code, got %d", resp.Code)
	}

	var csrfCookieFound bool
	for _, cookie := range recorder.Result().Cookies() {
		if cookie.Name != common.CookieCSRFToken {
			continue
		}
		csrfCookieFound = true
		if !cookie.HttpOnly {
			t.Fatal("expected csrf cookie to be httpOnly after login")
		}
		if recorder.Header().Get("X-CSRF-Token") == "" {
			t.Fatal("expected login response to expose csrf token header")
		}
		if recorder.Header().Get("X-CSRF-Token") != cookie.Value {
			t.Fatalf("expected csrf header and cookie to match, got header=%q cookie=%q", recorder.Header().Get("X-CSRF-Token"), cookie.Value)
		}
	}
	if !csrfCookieFound {
		t.Fatal("expected login response to set csrf cookie")
	}
}

func TestSmoke_RefreshFlowReissuesCSRFCookieAndHeader(t *testing.T) {
	r, _ := setupSmokeTestRouter(t)

	loginBody, _ := json.Marshal(LoginReq{
		Username: "admin",
		Password: "123456",
	})
	loginReq, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRecorder := httptest.NewRecorder()
	r.ServeHTTP(loginRecorder, loginReq)

	if loginRecorder.Code != http.StatusOK {
		t.Fatalf("expected login status 200, got %d", loginRecorder.Code)
	}

	var loginResp struct {
		Code int `json:"code"`
		Data struct {
			RefreshToken string `json:"refreshToken"`
		} `json:"data"`
	}
	if err := json.Unmarshal(loginRecorder.Body.Bytes(), &loginResp); err != nil {
		t.Fatalf("decode login response: %v", err)
	}
	if loginResp.Code != common.CodeSuccess {
		t.Fatalf("expected login business success code, got %d", loginResp.Code)
	}
	if loginResp.Data.RefreshToken == "" {
		t.Fatal("expected login response to include refresh token")
	}

	refreshBody, _ := json.Marshal(RefreshTokenReq{RefreshToken: loginResp.Data.RefreshToken})
	refreshReq, _ := http.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewBuffer(refreshBody))
	refreshReq.Header.Set("Content-Type", "application/json")
	refreshRecorder := httptest.NewRecorder()
	r.ServeHTTP(refreshRecorder, refreshReq)

	if refreshRecorder.Code != http.StatusOK {
		t.Fatalf("expected refresh status 200, got %d", refreshRecorder.Code)
	}

	var refreshResp struct {
		Code int `json:"code"`
	}
	if err := json.Unmarshal(refreshRecorder.Body.Bytes(), &refreshResp); err != nil {
		t.Fatalf("decode refresh response: %v", err)
	}
	if refreshResp.Code != common.CodeSuccess {
		t.Fatalf("expected refresh business success code, got %d", refreshResp.Code)
	}

	var csrfCookieFound bool
	for _, cookie := range refreshRecorder.Result().Cookies() {
		if cookie.Name != common.CookieCSRFToken {
			continue
		}
		csrfCookieFound = true
		if !cookie.HttpOnly {
			t.Fatal("expected refreshed csrf cookie to be httpOnly")
		}
		if refreshRecorder.Header().Get("X-CSRF-Token") == "" {
			t.Fatal("expected refresh response to expose csrf token header")
		}
		if refreshRecorder.Header().Get("X-CSRF-Token") != cookie.Value {
			t.Fatalf("expected refresh csrf header and cookie to match, got header=%q cookie=%q", refreshRecorder.Header().Get("X-CSRF-Token"), cookie.Value)
		}
	}
	if !csrfCookieFound {
		t.Fatal("expected refresh response to set csrf cookie")
	}
}
