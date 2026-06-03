package auth

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

type authOverviewService struct {
	auth *AuthService
}

func newAuthOverviewService(auth *AuthService) *authOverviewService {
	return &authOverviewService{auth: auth}
}

func (s *authOverviewService) GetSecurityOverview(userID uint64, username, currentSessionID string) (*SecurityOverviewResp, error) {
	if s.auth.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
	}
	policy := s.auth.getAuthRuntimePolicy()
	now := time.Now()
	if err := s.auth.sessions.governInventory(now, policy); err != nil {
		return nil, err
	}

	info, err := s.auth.GetCurrentUserInfo(userID)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(username) == "" {
		username = info.Username
	}

	sessions, err := s.auth.ListSessions(userID, currentSessionID)
	if err != nil {
		return nil, err
	}

	var currentSession *SessionResp
	for i := range sessions {
		if sessions[i].IsCurrent {
			session := sessions[i]
			currentSession = &session
			break
		}
	}

	activeSessionCount, err := s.auth.sessions.countActiveSessions(userID, now, policy)
	if err != nil {
		return nil, err
	}

	var lastLoginAt *string
	var lastLogin SystemLogLogin
	err = s.auth.db.Where("username = ? AND status = ?", username, 1).
		Order(loginTimeDescOrderClause).
		First(&lastLogin).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if err == nil {
		formatted := lastLogin.LoginTime.Format(time.RFC3339)
		lastLoginAt = &formatted
	}

	return &SecurityOverviewResp{
		User:                 info,
		CurrentSession:       currentSession,
		ActiveSessionCount:   activeSessionCount,
		LastLoginAt:          lastLoginAt,
		PasswordExpired:      s.auth.passwords.isPasswordExpired(userID, policy, now),
		PasswordExpiresAt:    s.auth.passwords.passwordExpiresAt(userID, policy),
		RecentSecurityEvents: s.listRecentSecurityEvents(userID, 5),
		Policy: SecurityPolicyResp{
			PasswordMinLength:       policy.PasswordMinLength,
			PasswordRequireDigit:    policy.PasswordRequireDigit,
			PasswordRequireUpper:    policy.PasswordRequireUpper,
			PasswordHistoryLimit:    policy.PasswordHistoryLimit,
			PasswordExpireDays:      policy.PasswordExpireDays,
			MaxFailedAttempts:       policy.MaxFailedAttempts,
			LockMinutes:             policy.LockMinutes,
			SourceMaxFailedAttempts: policy.SourceMaxFailedAttempts,
			SourceWindowMinutes:     policy.SourceWindowMinutes,
			SourceLockMinutes:       policy.SourceLockMinutes,
			SessionIdleMinutes:      policy.SessionIdleMinutes,
			MaxActiveSessions:       policy.MaxActiveSessions,
			SessionRetentionDays:    policy.SessionRetentionDays,
			CaptchaEnabled:          policy.CaptchaEnabled,
			MFAEnabled:              policy.MFAEnabled,
			SSOEnabled:              policy.SSOEnabled,
		},
	}, nil
}

func (s *authOverviewService) listRecentSecurityEvents(userID uint64, limit int) []SecurityEventResp {
	if s.auth.db == nil || userID == 0 || limit <= 0 {
		return []SecurityEventResp{}
	}

	var events []SystemAuthSecurityEvent
	if err := s.auth.db.Where(userIDWhereClause, userID).
		Order("created_at desc, id desc").
		Limit(limit).
		Find(&events).Error; err != nil {
		return []SecurityEventResp{}
	}
	return toSecurityEventRespList(events)
}
