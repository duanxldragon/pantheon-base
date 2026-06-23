package auth

import (
	"errors"
	"strings"
	"time"
	"unicode"

	user "pantheon-platform/backend/modules/system/iam/user"
	"pantheon-platform/backend/pkg/authsession"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/database"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func (s *AuthService) VerifyPasswordForOperation(userID uint64, sessionID, password string) (string, error) {
	if s.db == nil {
		return "", common.ErrDatabaseNotInitialized
	}
	if strings.TrimSpace(sessionID) == "" {
		return "", errors.New("auth.operation.verification_mismatch")
	}

	var currentUser user.SystemUser
	if err := s.db.First(&currentUser, userID).Error; err != nil {
		return "", err
	}

	// 校验密码
	if err := bcrypt.CompareHashAndPassword([]byte(currentUser.Password), []byte(password)); err != nil {
		return "", errors.New("auth.password.verify_failed")
	}

	// 生成操作令牌 (Operation Token)，有效期 5 分钟
	token, err := common.GenerateOperationToken(userID, sessionID, "secure_action", 5*time.Minute, database.RDB)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *AuthService) UpdatePassword(userID uint64, currentSessionID string, req *PasswordUpdateReq) error {
	if s.db == nil {
		return common.ErrDatabaseNotInitialized
	}

	oldPassword := strings.TrimSpace(req.OldPassword)
	newPassword := strings.TrimSpace(req.NewPassword)
	policy := s.getAuthRuntimePolicy()
	if len(newPassword) < policy.PasswordMinLength {
		return errors.New("user.update.error.password_too_short")
	}
	if !passwordMatchesComplexity(newPassword, policy) {
		return errors.New("user.update.error.password_weak")
	}

	var currentUser user.SystemUser
	if err := s.db.First(&currentUser, userID).Error; err != nil {
		return err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(currentUser.Password), []byte(oldPassword)); err != nil {
		return errors.New("user.password.error.old_password_invalid")
	}
	if oldPassword == newPassword {
		return errors.New("user.password.error.same_as_old")
	}
	if err := s.ensurePasswordNotRecentlyUsed(currentUser.ID, newPassword, currentUser.Password, policy); err != nil {
		return err
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.persistPasswordUpdate(currentUser, userID, currentSessionID, string(passwordHash), policy.PasswordHistoryLimit > 0)
}

func (s *AuthService) GetSecurityOverview(userID uint64, username, currentSessionID string) (*SecurityOverviewResp, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}
	policy := s.getAuthRuntimePolicy()
	now := time.Now()
	if err := s.governSessionInventory(now, policy); err != nil {
		return nil, err
	}

	info, err := s.GetCurrentUserInfo(userID)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(username) == "" {
		username = info.Username
	}

	sessions, err := s.ListSessions(userID, currentSessionID)
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

	var activeSessionCount int64
	if err := authsession.ApplyActiveScope(s.db.Model(&SystemUserSession{}), "", now, policy.SessionIdleMinutes).
		Where(userIDWhereClause, userID).
		Count(&activeSessionCount).Error; err != nil {
		return nil, err
	}

	var lastLoginAt *string
	var lastLogin SystemLogLogin
	err = s.db.Where("username = ? AND status = ?", username, 1).
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
		PasswordExpired:      s.isPasswordExpired(userID, policy, now),
		PasswordExpiresAt:    s.passwordExpiresAt(userID, policy),
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

func (s *AuthService) ListSecurityEvents(query *SecurityEventQuery) (*SecurityEventPageResp, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	page, pageSize := normalizeSecurityEventPageQuery(query)
	db := applySecurityEventFilters(s.db.Model(&SystemAuthSecurityEvent{}), query)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}
	var events []SystemAuthSecurityEvent
	if err := db.Order("created_at desc, id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&events).Error; err != nil {
		return nil, err
	}
	return &SecurityEventPageResp{
		Items:    toSecurityEventRespList(events),
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *AuthService) AcknowledgeSecurityEvent(eventID, actorID uint64, actorUsername, note string) error {
	if s.db == nil {
		return common.ErrDatabaseNotInitialized
	}
	note = strings.TrimSpace(note)
	if note == "" {
		return errors.New("auth.security_event.acknowledge.note_required")
	}

	result := s.db.Model(&SystemAuthSecurityEvent{}).
		Where("id = ?", eventID).
		Updates(map[string]interface{}{
			"acknowledged_at":      time.Now(),
			"acknowledged_by":      actorID,
			"acknowledged_by_user": strings.TrimSpace(actorUsername),
			"acknowledgement_note": note,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *AuthService) ensurePasswordNotRecentlyUsed(userID uint64, newPassword, currentPasswordHash string, policy authRuntimePolicy) error {
	if policy.PasswordHistoryLimit <= 0 {
		return nil
	}
	if bcrypt.CompareHashAndPassword([]byte(currentPasswordHash), []byte(newPassword)) == nil {
		return errors.New("user.password.error.reused")
	}

	var rows []SystemUserPasswordHistory
	if err := s.db.Where(userIDWhereClause, userID).
		Order("changed_at desc, id desc").
		Limit(policy.PasswordHistoryLimit).
		Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		if bcrypt.CompareHashAndPassword([]byte(row.PasswordHash), []byte(newPassword)) == nil {
			return errors.New("user.password.error.reused")
		}
	}
	return nil
}

func (s *AuthService) recordSecurityEvent(event SystemAuthSecurityEvent) {
	if s.db == nil || !s.getAuthRuntimePolicy().SecurityEventEnabled {
		return
	}
	if strings.TrimSpace(event.EventType) == "" || strings.TrimSpace(event.MessageKey) == "" {
		return
	}
	if strings.TrimSpace(event.Severity) == "" {
		event.Severity = "medium"
	}
	event.SourceKey = strings.TrimSpace(event.SourceKey)
	event.Username = strings.TrimSpace(event.Username)
	_ = s.db.Create(&event).Error
}

func (s *AuthService) listRecentSecurityEvents(userID uint64, limit int) []SecurityEventResp {
	if s.db == nil || userID == 0 || limit <= 0 {
		return []SecurityEventResp{}
	}
	var events []SystemAuthSecurityEvent
	if err := s.db.Where(userIDWhereClause, userID).Order("created_at desc, id desc").Limit(limit).Find(&events).Error; err != nil {
		return []SecurityEventResp{}
	}
	return toSecurityEventRespList(events)
}

func (s *AuthService) passwordExpiresAt(userID uint64, policy authRuntimePolicy) *string {
	if policy.PasswordExpireDays <= 0 {
		return nil
	}
	changedAt := s.passwordLastChangedAt(userID)
	if changedAt.IsZero() {
		return nil
	}
	expiresAt := changedAt.AddDate(0, 0, policy.PasswordExpireDays).Format(time.RFC3339)
	return &expiresAt
}

func (s *AuthService) isPasswordExpired(userID uint64, policy authRuntimePolicy, now time.Time) bool {
	expiresAt := s.passwordExpiresAt(userID, policy)
	if expiresAt == nil {
		return false
	}
	parsed, err := time.Parse(time.RFC3339, *expiresAt)
	if err != nil {
		return false
	}
	return !parsed.After(now)
}

func (s *AuthService) passwordLastChangedAt(userID uint64) time.Time {
	var row SystemUserPasswordHistory
	if err := s.db.Where(userIDWhereClause, userID).Order("changed_at desc, id desc").First(&row).Error; err == nil {
		return row.ChangedAt
	}
	var currentUser user.SystemUser
	if err := s.db.First(&currentUser, userID).Error; err == nil {
		if !currentUser.UpdatedAt.IsZero() {
			return currentUser.UpdatedAt
		}
		return currentUser.CreatedAt
	}
	return time.Time{}
}

func (s *AuthService) persistPasswordUpdate(currentUser user.SystemUser, userID uint64, currentSessionID, passwordHash string, keepHistory bool) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if keepHistory {
			if err := tx.Create(&SystemUserPasswordHistory{
				UserID:       currentUser.ID,
				PasswordHash: currentUser.Password,
				ChangedAt:    time.Now(),
			}).Error; err != nil {
				return err
			}
		}
		if err := tx.Model(&currentUser).Update("password", passwordHash).Error; err != nil {
			return err
		}
		return revokeOtherUserSessions(tx, userID, currentSessionID)
	})
}

func applySecurityEventFilters(db *gorm.DB, query *SecurityEventQuery) *gorm.DB {
	if query == nil {
		return db
	}
	if strings.TrimSpace(query.Username) != "" {
		db = db.Where(usernameLikeWhereClause, "%"+strings.TrimSpace(query.Username)+"%")
	}
	if strings.TrimSpace(query.EventType) != "" {
		db = db.Where("event_type = ?", strings.TrimSpace(query.EventType))
	}
	if strings.TrimSpace(query.Severity) != "" {
		db = db.Where("severity = ?", strings.TrimSpace(query.Severity))
	}
	if query.Acknowledged == nil {
		return db
	}
	if *query.Acknowledged {
		return db.Where("acknowledged_at IS NOT NULL")
	}
	return db.Where("acknowledged_at IS NULL")
}

func passwordMatchesComplexity(password string, policy authRuntimePolicy) bool {
	if !policy.PasswordRequireDigit && !policy.PasswordRequireUpper {
		return true
	}
	hasDigit := false
	hasUpper := false
	for _, r := range password {
		if unicode.IsDigit(r) {
			hasDigit = true
		}
		if unicode.IsUpper(r) {
			hasUpper = true
		}
	}
	if policy.PasswordRequireDigit && !hasDigit {
		return false
	}
	if policy.PasswordRequireUpper && !hasUpper {
		return false
	}
	return true
}

func toSecurityEventRespList(events []SystemAuthSecurityEvent) []SecurityEventResp {
	result := make([]SecurityEventResp, 0, len(events))
	for _, item := range events {
		result = append(result, SecurityEventResp{
			ID:                  item.ID,
			UserID:              item.UserID,
			Username:            item.Username,
			EventType:           item.EventType,
			Severity:            item.Severity,
			SourceKey:           item.SourceKey,
			IP:                  item.IP,
			UserAgent:           item.UserAgent,
			MessageKey:          item.MessageKey,
			Metadata:            item.Metadata,
			AcknowledgedAt:      formatNullableTime(item.AcknowledgedAt),
			AcknowledgedBy:      item.AcknowledgedBy,
			AcknowledgedByUser:  item.AcknowledgedByUser,
			AcknowledgementNote: item.AcknowledgementNote,
			CreatedAt:           item.CreatedAt.Format(time.RFC3339),
		})
	}
	return result
}

func normalizeSecurityEventPageQuery(query *SecurityEventQuery) (int, int) {
	if query == nil {
		return 1, 10
	}
	return normalizePageQuery(query.Page, query.PageSize)
}
