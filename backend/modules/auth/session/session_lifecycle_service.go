package session

import (
	"time"

	"gorm.io/gorm"
)

// LifecycleService owns system_user_session lifecycle mutations for auth/session.
type LifecycleService struct {
	db *gorm.DB
}

func NewLifecycleService(db *gorm.DB) *LifecycleService {
	return &LifecycleService{db: db}
}

func (s *LifecycleService) WithDB(db *gorm.DB) *LifecycleService {
	return &LifecycleService{db: db}
}

func (s *LifecycleService) RevokeUserSessions(userID uint64, now time.Time) (int64, error) {
	if s == nil || s.db == nil || userID == 0 {
		return 0, nil
	}

	result := s.db.Model(&SystemUserSession{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		UpdateColumn("revoked_at", now)
	return result.RowsAffected, result.Error
}

func (s *LifecycleService) DeleteUserSessions(userID uint64) error {
	if s == nil || s.db == nil || userID == 0 {
		return nil
	}
	return s.db.Where("user_id = ?", userID).Delete(&SystemUserSession{}).Error
}

// PurgeUserAuthArtifacts 在用户删除时级联清理 auth 域残留：密码历史、
// MFA 因子（含 TOTP secret）与未完成的 MFA 挑战。登录/操作日志按审计
// 保留策略有意不删；system_login_throttle 仅有 ip: 键（共享状态），无
// 用户键行，不在清理范围。HasTable 守卫兼容按模块裁剪建表的部署。
func (s *LifecycleService) PurgeUserAuthArtifacts(userID uint64) error {
	if s == nil || s.db == nil || userID == 0 {
		return nil
	}
	for _, table := range []string{
		"system_user_password_history",
		"system_auth_factor",
		"system_auth_mfa_challenge",
	} {
		if !s.db.Migrator().HasTable(table) {
			continue
		}
		if err := s.db.Table(table).Where("user_id = ?", userID).Delete(nil).Error; err != nil {
			return err
		}
	}
	return nil
}
