package session

import (
	"testing"
	"time"

	"pantheon-base/pkg/testmysql"
)

func setupLifecycleTestDB(t *testing.T) *LifecycleService {
	t.Helper()
	db := testmysql.Open(t)
	if err := db.AutoMigrate(&SystemUserSession{}); err != nil {
		t.Fatalf("migrate sessions: %v", err)
	}
	return NewLifecycleService(db)
}

func TestLifecycleService_RevokeUserSessions(t *testing.T) {
	service := setupLifecycleTestDB(t)
	now := time.Date(2026, 6, 23, 12, 0, 0, 0, time.UTC)

	if err := service.db.Create(&[]SystemUserSession{
		{SessionID: "active-1", UserID: 42, RefreshJTI: "r1", RefreshExpiresAt: now.Add(time.Hour)},
		{SessionID: "active-2", UserID: 42, RefreshJTI: "r2", RefreshExpiresAt: now.Add(time.Hour)},
		{SessionID: "other-user", UserID: 99, RefreshJTI: "r3", RefreshExpiresAt: now.Add(time.Hour)},
	}).Error; err != nil {
		t.Fatalf("seed sessions: %v", err)
	}

	revoked, err := service.RevokeUserSessions(42, now)
	if err != nil {
		t.Fatalf("revoke sessions: %v", err)
	}
	if revoked != 2 {
		t.Fatalf("expected 2 revoked sessions, got %d", revoked)
	}

	var revokedCount int64
	if err := service.db.Model(&SystemUserSession{}).
		Where("user_id = ? AND revoked_at IS NOT NULL", 42).
		Count(&revokedCount).Error; err != nil {
		t.Fatalf("count revoked sessions: %v", err)
	}
	if revokedCount != 2 {
		t.Fatalf("expected 2 revoked rows, got %d", revokedCount)
	}

	var otherRevokedCount int64
	if err := service.db.Model(&SystemUserSession{}).
		Where("user_id = ? AND revoked_at IS NOT NULL", 99).
		Count(&otherRevokedCount).Error; err != nil {
		t.Fatalf("count other user sessions: %v", err)
	}
	if otherRevokedCount != 0 {
		t.Fatalf("expected other user session to remain active, got %d revoked", otherRevokedCount)
	}
}

func TestLifecycleService_DeleteUserSessions(t *testing.T) {
	service := setupLifecycleTestDB(t)
	now := time.Date(2026, 6, 23, 12, 0, 0, 0, time.UTC)

	if err := service.db.Create(&[]SystemUserSession{
		{SessionID: "delete-1", UserID: 42, RefreshJTI: "r1", RefreshExpiresAt: now.Add(time.Hour)},
		{SessionID: "delete-2", UserID: 42, RefreshJTI: "r2", RefreshExpiresAt: now.Add(time.Hour)},
		{SessionID: "keep-1", UserID: 99, RefreshJTI: "r3", RefreshExpiresAt: now.Add(time.Hour)},
	}).Error; err != nil {
		t.Fatalf("seed sessions: %v", err)
	}

	if err := service.DeleteUserSessions(42); err != nil {
		t.Fatalf("delete sessions: %v", err)
	}

	var remainingForUser int64
	if err := service.db.Model(&SystemUserSession{}).
		Where("user_id = ?", 42).
		Count(&remainingForUser).Error; err != nil {
		t.Fatalf("count deleted user sessions: %v", err)
	}
	if remainingForUser != 0 {
		t.Fatalf("expected user sessions to be deleted, got %d", remainingForUser)
	}

	var remainingOther int64
	if err := service.db.Model(&SystemUserSession{}).
		Where("user_id = ?", 99).
		Count(&remainingOther).Error; err != nil {
		t.Fatalf("count other user sessions: %v", err)
	}
	if remainingOther != 1 {
		t.Fatalf("expected other user session to remain, got %d", remainingOther)
	}
}

func TestLifecycleService_PurgeUserAuthArtifacts(t *testing.T) {
	service := setupLifecycleTestDB(t)

	ddl := []string{
		"CREATE TABLE IF NOT EXISTS system_user_password_history (id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT, password_hash VARCHAR(255))",
		"CREATE TABLE IF NOT EXISTS system_auth_factor (id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT, factor_type VARCHAR(32), secret VARCHAR(255))",
		"CREATE TABLE IF NOT EXISTS system_auth_mfa_challenge (id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT, challenge_id VARCHAR(64))",
	}
	for _, stmt := range ddl {
		if err := service.db.Exec(stmt).Error; err != nil {
			t.Fatalf("create table: %v", err)
		}
	}
	seeds := []string{
		"INSERT INTO system_user_password_history (user_id, password_hash) VALUES (42, 'h1'), (99, 'h2')",
		"INSERT INTO system_auth_factor (user_id, factor_type, secret) VALUES (42, 'totp', 's1'), (99, 'totp', 's2')",
		"INSERT INTO system_auth_mfa_challenge (user_id, challenge_id) VALUES (42, 'c1'), (99, 'c2')",
	}
	for _, stmt := range seeds {
		if err := service.db.Exec(stmt).Error; err != nil {
			t.Fatalf("seed rows: %v", err)
		}
	}

	if err := service.PurgeUserAuthArtifacts(42); err != nil {
		t.Fatalf("purge artifacts: %v", err)
	}

	for _, table := range []string{"system_user_password_history", "system_auth_factor", "system_auth_mfa_challenge"} {
		var purged int64
		if err := service.db.Table(table).Where("user_id = ?", 42).Count(&purged).Error; err != nil {
			t.Fatalf("count %s for purged user: %v", table, err)
		}
		if purged != 0 {
			t.Fatalf("expected %s rows purged for user 42, got %d", table, purged)
		}
		var kept int64
		if err := service.db.Table(table).Where("user_id = ?", 99).Count(&kept).Error; err != nil {
			t.Fatalf("count %s for other user: %v", table, err)
		}
		if kept != 1 {
			t.Fatalf("expected %s rows kept for user 99, got %d", table, kept)
		}
	}

	// 表不存在时应静默跳过（HasTable 守卫）
	if err := service.db.Exec("DROP TABLE system_auth_mfa_challenge").Error; err != nil {
		t.Fatalf("drop table: %v", err)
	}
	if err := service.PurgeUserAuthArtifacts(99); err != nil {
		t.Fatalf("expected purge to skip missing table, got %v", err)
	}
}

func TestLifecycleService_NilAndZeroInputsAreNoops(t *testing.T) {
	var nilService *LifecycleService
	if revoked, err := nilService.RevokeUserSessions(42, time.Now()); err != nil || revoked != 0 {
		t.Fatalf("expected nil service revoke noop, got revoked=%d err=%v", revoked, err)
	}
	if err := nilService.DeleteUserSessions(42); err != nil {
		t.Fatalf("expected nil service delete noop, got %v", err)
	}
	if err := nilService.PurgeUserAuthArtifacts(42); err != nil {
		t.Fatalf("expected nil service purge noop, got %v", err)
	}

	service := NewLifecycleService(nil)
	if revoked, err := service.RevokeUserSessions(42, time.Now()); err != nil || revoked != 0 {
		t.Fatalf("expected nil db revoke noop, got revoked=%d err=%v", revoked, err)
	}
	if err := service.DeleteUserSessions(42); err != nil {
		t.Fatalf("expected nil db delete noop, got %v", err)
	}
}
