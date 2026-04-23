package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	user "pantheon-platform/backend/modules/system/user"
	"pantheon-platform/backend/pkg/common"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func setupSmokeTestRouter() (*gin.Engine, *gorm.DB) {
	gin.SetMode(gin.TestMode)
	// 使用文件数据库防止 Goroutine 找不到表
	db, _ := gorm.Open(sqlite.Open("smoke_test.db"), &gorm.Config{})

	// 清理旧表
	_ = db.Exec("DROP TABLE IF EXISTS system_user")
	_ = db.Exec("DROP TABLE IF EXISTS system_user_session")
	_ = db.Exec("DROP TABLE IF EXISTS system_log_login")
	_ = db.Exec("DROP TABLE IF EXISTS system_role")
	_ = db.Exec("DROP TABLE IF EXISTS system_user_role")
	_ = db.Exec("DROP TABLE IF EXISTS system_role_permission")

	// 迁移所有核心表
	_ = db.AutoMigrate(&user.SystemUser{}, &SystemUserSession{}, &SystemLogLogin{})
	_ = db.Exec("CREATE TABLE IF NOT EXISTS system_role (id INTEGER PRIMARY KEY, role_key TEXT, status INTEGER)")
	_ = db.Exec("CREATE TABLE IF NOT EXISTS system_user_role (user_id INTEGER, role_id INTEGER)")
	_ = db.Exec("CREATE TABLE IF NOT EXISTS system_role_permission (role_id INTEGER, permission_key TEXT)")

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
	}

	return r, db
}

func TestSmoke_LoginFlow(t *testing.T) {
	r, _ := setupSmokeTestRouter()

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
}
