package auth

import (
	"strings"
	"testing"
	"time"

	"pantheon-platform/backend/internal/middleware"
	auditmod "pantheon-platform/backend/modules/system/audit"
	user "pantheon-platform/backend/modules/system/user"

	"github.com/glebarez/sqlite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func setupTestDB() *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// 迁移模型
	_ = db.AutoMigrate(&user.SystemUser{}, &SystemUserSession{}, &SystemLogLogin{})
	_ = db.Exec("CREATE TABLE IF NOT EXISTS system_setting (setting_key TEXT PRIMARY KEY, setting_value TEXT)")
	return db
}

func TestAuthService_Authenticate(t *testing.T) {
	db := setupTestDB()
	s := NewAuthService(db)

	password := "123456"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	// 创建测试用户
	testUser := user.SystemUser{
		Username: "testuser",
		Password: string(hash),
		Status:   1,
	}
	db.Create(&testUser)

	// 1. 成功登录
	u, err := s.Authenticate(&LoginReq{
		Username: "testuser",
		Password: password,
	})
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if u.Username != "testuser" {
		t.Errorf("expected username testuser, got %s", u.Username)
	}

	// 2. 密码错误
	_, err = s.Authenticate(&LoginReq{
		Username: "testuser",
		Password: "wrongpassword",
	})
	if err == nil || err.Error() != "user.login.error.password_wrong" {
		t.Errorf("expected password wrong error, got %v", err)
	}

	// 3. 用户不存在
	_, err = s.Authenticate(&LoginReq{
		Username: "nonexistent",
		Password: password,
	})
	if err == nil || err.Error() != "user.login.error.not_found" {
		t.Errorf("expected user not found error, got %v", err)
	}

	// 4. 用户被禁用
	db.Model(&testUser).Update("status", 2)
	_, err = s.Authenticate(&LoginReq{
		Username: "testuser",
		Password: password,
	})
	if err == nil || err.Error() != "user.login.error.disabled" {
		t.Errorf("expected user disabled error, got %v", err)
	}
}

func TestAuthService_UpdatePassword(t *testing.T) {
	db := setupTestDB()
	s := NewAuthService(db)

	oldPassword := "oldpassword"
	newPassword := "newpassword"
	hash, _ := bcrypt.GenerateFromPassword([]byte(oldPassword), bcrypt.DefaultCost)

	testUser := user.SystemUser{
		Username: "testpwd",
		Password: string(hash),
		Status:   1,
	}
	db.Create(&testUser)

	// 1. 成功修改密码
	err := s.UpdatePassword(testUser.ID, "session123", &PasswordUpdateReq{
		OldPassword: oldPassword,
		NewPassword: newPassword,
	})
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}

	// 验证新密码
	var updatedUser user.SystemUser
	db.First(&updatedUser, testUser.ID)
	err = bcrypt.CompareHashAndPassword([]byte(updatedUser.Password), []byte(newPassword))
	if err != nil {
		t.Errorf("new password verification failed: %v", err)
	}

	// 2. 旧密码错误
	err = s.UpdatePassword(testUser.ID, "session123", &PasswordUpdateReq{
		OldPassword: "wrongpassword",
		NewPassword: "somepassword",
	})
	if err == nil || err.Error() != "user.password.error.old_password_invalid" {
		t.Errorf("expected old password invalid error, got %v", err)
	}

	// 3. 新旧密码相同
	err = s.UpdatePassword(testUser.ID, "session123", &PasswordUpdateReq{
		OldPassword: newPassword,
		NewPassword: newPassword,
	})
	if err == nil || err.Error() != "user.password.error.same_as_old" {
		t.Errorf("expected same as old error, got %v", err)
	}

	// 4. 密码太短
	err = s.UpdatePassword(testUser.ID, "session123", &PasswordUpdateReq{
		OldPassword: newPassword,
		NewPassword: "123",
	})
	if err == nil || err.Error() != "user.update.error.password_too_short" {
		t.Errorf("expected password too short error, got %v", err)
	}
}

func TestAuthService_AuthenticateLocksUserByConfiguredPolicy(t *testing.T) {
	db := setupTestDB()
	s := NewAuthService(db)

	hash, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
	testUser := user.SystemUser{
		Username: "locked_user",
		Password: string(hash),
		Status:   1,
	}
	db.Create(&testUser)
	_ = db.Exec("INSERT INTO system_setting (setting_key, setting_value) VALUES ('login.max_failed_attempts', '2'), ('login.lock_minutes', '10')")

	_, err := s.Authenticate(&LoginReq{Username: "locked_user", Password: "wrong"})
	if err == nil || err.Error() != "user.login.error.password_wrong" {
		t.Fatalf("expected password wrong on first failure, got %v", err)
	}
	_, err = s.Authenticate(&LoginReq{Username: "locked_user", Password: "wrong"})
	if err == nil || err.Error() != "user.login.error.locked" {
		t.Fatalf("expected locked error on second failure, got %v", err)
	}

	var updated user.SystemUser
	if err := db.First(&updated, testUser.ID).Error; err != nil {
		t.Fatalf("reload locked user: %v", err)
	}
	if updated.LoginLockedUntil == nil || !updated.LoginLockedUntil.After(time.Now()) {
		t.Fatalf("expected login_locked_until to be set, got %+v", updated.LoginLockedUntil)
	}
}

func TestAuthService_UpdatePasswordUsesConfiguredMinLength(t *testing.T) {
	db := setupTestDB()
	s := NewAuthService(db)

	hash, _ := bcrypt.GenerateFromPassword([]byte("oldpassword"), bcrypt.DefaultCost)
	testUser := user.SystemUser{
		Username: "policy_user",
		Password: string(hash),
		Status:   1,
	}
	db.Create(&testUser)
	_ = db.Exec("INSERT INTO system_setting (setting_key, setting_value) VALUES ('security.password_min_length', '8')")

	err := s.UpdatePassword(testUser.ID, "session123", &PasswordUpdateReq{
		OldPassword: "oldpassword",
		NewPassword: "1234567",
	})
	if err == nil || err.Error() != "user.update.error.password_too_short" {
		t.Fatalf("expected configured min length error, got %v", err)
	}
}

func TestAuthService_ListSessionsOnlyReturnsActiveSessions(t *testing.T) {
	db := setupTestDB()
	s := NewAuthService(db)
	now := time.Now()
	revokedAt := now.Add(-time.Hour)

	sessions := []SystemUserSession{
		{
			SessionID:        "other-active",
			UserID:           7,
			RefreshJTI:       "jti-other-active",
			RefreshExpiresAt: now.Add(24 * time.Hour),
			CreatedAt:        now.Add(-time.Hour),
		},
		{
			SessionID:        "current-active",
			UserID:           7,
			RefreshJTI:       "jti-current-active",
			RefreshExpiresAt: now.Add(24 * time.Hour),
			CreatedAt:        now.Add(-2 * time.Hour),
		},
		{
			SessionID:        "revoked",
			UserID:           7,
			RefreshJTI:       "jti-revoked",
			RefreshExpiresAt: now.Add(24 * time.Hour),
			RevokedAt:        &revokedAt,
			CreatedAt:        now,
		},
		{
			SessionID:        "expired",
			UserID:           7,
			RefreshJTI:       "jti-expired",
			RefreshExpiresAt: now.Add(-time.Hour),
			CreatedAt:        now,
		},
	}

	if err := db.Create(&sessions).Error; err != nil {
		t.Fatalf("seed sessions: %v", err)
	}

	result, err := s.ListSessions(7, "current-active")
	if err != nil {
		t.Fatalf("list sessions: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("expected 2 active sessions, got %d: %+v", len(result), result)
	}
	if result[0].SessionID != "current-active" || !result[0].IsCurrent {
		t.Fatalf("expected current active session first, got %+v", result[0])
	}
	if result[1].SessionID != "other-active" {
		t.Fatalf("expected other active session second, got %+v", result[1])
	}
}

func TestAuthService_MigrateRepairsSQLiteTemporalColumns(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite database: %v", err)
	}

	if err := db.Exec(`CREATE TABLE system_user_session (
session_id TEXT PRIMARY KEY,
user_id INTEGER NOT NULL,
refresh_jti TEXT NOT NULL,
refresh_expires_at TEXT NOT NULL,
last_refresh_at TEXT NULL,
last_ip TEXT NULL,
user_agent TEXT NULL,
revoked_at TEXT NULL,
created_at TEXT NULL,
updated_at TEXT NULL
)`).Error; err != nil {
		t.Fatalf("failed to create legacy session table: %v", err)
	}
	if err := db.Exec(`CREATE TABLE system_log_login (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT,
ipaddr TEXT,
login_location TEXT,
browser TEXT,
os TEXT,
status INTEGER,
msg TEXT,
login_time TEXT
)`).Error; err != nil {
		t.Fatalf("failed to create legacy login log table: %v", err)
	}

	svc := NewAuthService(db)
	if err := svc.Migrate(); err != nil {
		t.Fatalf("migrate failed: %v", err)
	}

	assertSQLiteColumnType(t, db, "system_user_session", "refresh_expires_at", "DATETIME")
	assertSQLiteColumnType(t, db, "system_user_session", "last_refresh_at", "DATETIME")
	assertSQLiteColumnType(t, db, "system_log_login", "login_time", "DATETIME")
}

func TestAuditService_MigrateRepairsSQLiteTemporalColumns(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite database: %v", err)
	}

	if err := db.Exec(`CREATE TABLE system_log_oper (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT,
business_type INTEGER,
method TEXT,
oper_name TEXT,
oper_url TEXT,
oper_ip TEXT,
oper_param TEXT,
json_result TEXT,
status INTEGER,
error_msg TEXT,
oper_time TEXT,
cost_time INTEGER
)`).Error; err != nil {
		t.Fatalf("failed to create legacy operation log table: %v", err)
	}
	svc := auditmod.NewAuditService(db)
	if err := svc.Migrate(); err != nil {
		t.Fatalf("audit migrate failed: %v", err)
	}

	assertSQLiteColumnType(t, db, "system_log_oper", "oper_time", "DATETIME")
}

func TestAuthService_ExportLoginLogs(t *testing.T) {
	db := setupTestDB()
	s := NewAuthService(db)

	if err := db.Create(&SystemLogLogin{
		Username:  "tester",
		Ipaddr:    "127.0.0.1",
		Browser:   "Chrome",
		Os:        "Windows",
		Status:    1,
		Msg:       "auth.loginSuccess",
		LoginTime: time.Now(),
	}).Error; err != nil {
		t.Fatalf("seed login log: %v", err)
	}

	exported, err := s.ExportLoginLogs(&LoginLogQuery{Username: "tester"})
	if err != nil {
		t.Fatalf("export login logs: %v", err)
	}
	if len(exported.Rows) != 1 || exported.Rows[0][0] != "tester" {
		t.Fatalf("unexpected exported login log rows: %+v", exported.Rows)
	}
}

func TestAuditService_ExportOperationLogs(t *testing.T) {
	db := setupTestDB()
	if err := db.AutoMigrate(&middleware.SystemLogOper{}); err != nil {
		t.Fatalf("migrate operation log: %v", err)
	}
	s := auditmod.NewAuditService(db)

	if err := db.Create(&middleware.SystemLogOper{
		Title:        "导出用户",
		BusinessType: 5,
		Method:       "POST",
		OperName:     "admin",
		OperURL:      "/api/v1/system/user/export",
		OperIP:       "127.0.0.1",
		Status:       1,
		OperTime:     time.Now(),
		CostTime:     12,
	}).Error; err != nil {
		t.Fatalf("seed operation log: %v", err)
	}

	exported, err := s.ExportOperationLogs(&auditmod.OperationLogQuery{Title: "导出用户"})
	if err != nil {
		t.Fatalf("export operation logs: %v", err)
	}
	if len(exported.Rows) != 1 || exported.Rows[0][0] != "导出用户" {
		t.Fatalf("unexpected exported operation log rows: %+v", exported.Rows)
	}
}

func assertSQLiteColumnType(t *testing.T, db *gorm.DB, tableName string, columnName string, expected string) {
	t.Helper()

	rows, err := db.Raw("PRAGMA table_info(" + tableName + ")").Rows()
	if err != nil {
		t.Fatalf("failed to query table info: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name string
		var dataType string
		var notNull int
		var defaultValue interface{}
		var pk int
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &defaultValue, &pk); err != nil {
			t.Fatalf("failed to scan pragma row: %v", err)
		}
		if name == columnName {
			if !strings.EqualFold(dataType, expected) {
				t.Fatalf("expected %s.%s to be %s, got %s", tableName, columnName, expected, dataType)
			}
			return
		}
	}

	t.Fatalf("column %s not found in %s", columnName, tableName)
}
