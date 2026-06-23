package auth

import (
	"errors"
	"fmt"
	"strings"
	"time"

	user "pantheon-platform/backend/modules/system/iam/user"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func (s *AuthService) Login(req *LoginReq) (*user.SystemUser, error) {
	return s.LoginWithSource(req, "")
}

func (s *AuthService) LoginWithSource(req *LoginReq, sourceKey string) (*user.SystemUser, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}
	policy := s.getAuthRuntimePolicy()
	now := time.Now()
	if err := s.ensureSourceThrottleAllowed(sourceKey, policy, now); err != nil {
		return nil, err
	}

	currentUser, err := s.loadLoginUserWithSource(strings.TrimSpace(req.Username), sourceKey, policy, now)
	if err != nil {
		return nil, err
	}
	if err := s.ensureLoginUserAvailable(currentUser, sourceKey, policy, now); err != nil {
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(currentUser.Password), []byte(req.Password)); err != nil {
		return nil, s.handlePasswordMismatch(currentUser, sourceKey, policy, now)
	}
	if err := s.clearFailedLoginState(currentUser.ID); err != nil {
		return nil, err
	}

	return currentUser, nil
}

func (s *AuthService) ensureSourceThrottleAllowed(sourceKey string, policy authRuntimePolicy, now time.Time) error {
	blocked, err := s.checkSourceThrottle(sourceKey, policy, now)
	if err != nil {
		return err
	}
	if blocked {
		return errors.New(errAuthLoginSourceBlocked)
	}
	return nil
}

func (s *AuthService) loadLoginUserWithSource(username, sourceKey string, policy authRuntimePolicy, now time.Time) (*user.SystemUser, error) {
	if username == "" {
		_ = s.failLoginSourceBlocked(nil, sourceKey, policy, now)
		return nil, errors.New("user.login.error.not_found")
	}

	var currentUser user.SystemUser
	result := s.db.Where("username = ?", username).First(&currentUser)
	if result.Error == nil {
		return &currentUser, nil
	}
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		if err := s.failLoginSourceBlocked(nil, sourceKey, policy, now); err != nil {
			return nil, err
		}
		return nil, errors.New("user.login.error.not_found")
	}
	return nil, result.Error
}

func (s *AuthService) ensureLoginUserAvailable(currentUser *user.SystemUser, sourceKey string, policy authRuntimePolicy, now time.Time) error {
	if currentUser.Status == 2 {
		if err := s.failLoginSourceBlocked(currentUser, sourceKey, policy, now); err != nil {
			return err
		}
		return errors.New("user.login.error.disabled")
	}
	if currentUser.LoginLockedUntil != nil && currentUser.LoginLockedUntil.After(now) {
		if err := s.failLoginSourceBlocked(currentUser, sourceKey, policy, now); err != nil {
			return err
		}
		return errors.New("user.login.error.locked")
	}
	return nil
}

func (s *AuthService) handlePasswordMismatch(currentUser *user.SystemUser, sourceKey string, policy authRuntimePolicy, now time.Time) error {
	locked, err := s.recordFailedLoginAttempt(currentUser, policy)
	if err != nil {
		return err
	}
	blocked, err := s.recordSourceFailure(sourceKey, policy, now)
	if err != nil {
		return err
	}
	if blocked {
		s.recordSecurityEvent(SystemAuthSecurityEvent{
			UserID:     currentUser.ID,
			Username:   currentUser.Username,
			EventType:  "source_blocked",
			Severity:   "high",
			SourceKey:  sourceKey,
			MessageKey: "auth.security.event.source_blocked",
		})
		return errors.New(errAuthLoginSourceBlocked)
	}
	if locked {
		s.recordSecurityEvent(SystemAuthSecurityEvent{
			UserID:     currentUser.ID,
			Username:   currentUser.Username,
			EventType:  "account_locked",
			Severity:   "high",
			SourceKey:  sourceKey,
			MessageKey: "auth.security.event.account_locked",
		})
		return errors.New("user.login.error.locked")
	}
	s.recordSecurityEvent(SystemAuthSecurityEvent{
		UserID:     currentUser.ID,
		Username:   currentUser.Username,
		EventType:  "password_wrong",
		Severity:   "medium",
		SourceKey:  sourceKey,
		IP:         loginSourceIP(sourceKey),
		MessageKey: "auth.security.event.password_wrong",
	})
	return errors.New("user.login.error.password_wrong")
}

func (s *AuthService) clearFailedLoginState(userID uint64) error {
	if s.db == nil {
		return common.ErrDatabaseNotInitialized
	}
	return s.db.Model(&user.SystemUser{}).
		Where("id = ? AND (failed_login_attempts <> 0 OR login_locked_until IS NOT NULL)", userID).
		Updates(map[string]any{
			"failed_login_attempts": 0,
			"login_locked_until":    nil,
		}).Error
}

func (s *AuthService) Authenticate(req *LoginReq) (*user.SystemUser, error) {
	return s.Login(req)
}

func (s *AuthService) ListOwnLoginLogs(username string, query *LoginLogQuery) (*LoginLogPageResp, error) {
	if strings.TrimSpace(username) == "" {
		return nil, errors.New("token.invalid")
	}
	return s.listLoginLogs(&LoginLogQuery{
		Username: username,
		Status:   queryStatus(query),
		Page:     queryPage(query),
		PageSize: queryPageSize(query),
	})
}

func (s *AuthService) ListLoginLogs(query *LoginLogQuery) (*LoginLogPageResp, error) {
	s.ensureAutomaticLoginLogRetention()
	return s.listLoginLogs(query)
}

func (s *AuthService) listLoginLogs(query *LoginLogQuery) (*LoginLogPageResp, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}
	s.ensureAutomaticLoginLogRetention()

	var logs []SystemLogLogin
	db := s.db.Model(&SystemLogLogin{})
	page, pageSize := normalizePageQuery(queryPage(query), queryPageSize(query))
	if query != nil {
		if strings.TrimSpace(query.Username) != "" {
			db = db.Where(usernameLikeWhereClause, "%"+strings.TrimSpace(query.Username)+"%")
		}
		if query.Status != nil && (*query.Status == 0 || *query.Status == 1) {
			db = db.Where("status = ?", *query.Status)
		}
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}
	if err := db.Order(loginTimeDescOrderClause).Offset((page - 1) * pageSize).Limit(pageSize).Find(&logs).Error; err != nil {
		return nil, err
	}

	items := make([]LoginLogResp, 0, len(logs))
	for _, item := range logs {
		items = append(items, LoginLogResp{
			ID:            item.ID,
			Username:      item.Username,
			Ipaddr:        item.Ipaddr,
			LoginLocation: item.LoginLocation,
			Browser:       item.Browser,
			Os:            item.Os,
			Status:        item.Status,
			Msg:           item.Msg,
			LoginTime:     item.LoginTime.Format(time.RFC3339),
		})
	}
	return &LoginLogPageResp{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *AuthService) ExportLoginLogs(query *LoginLogQuery) (*impexp.CSVFile, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}
	s.ensureAutomaticLoginLogRetention()

	logs, err := s.listLoginLogsForExport(query)
	if err != nil {
		return nil, err
	}

	rows := make([][]string, 0, len(logs))
	for _, item := range logs {
		rows = append(rows, []string{
			item.Username,
			item.Ipaddr,
			item.LoginLocation,
			item.Browser,
			item.Os,
			fmt.Sprintf("%d", item.Status),
			item.Msg,
			item.LoginTime.Format(time.RFC3339),
		})
	}

	return &impexp.CSVFile{
		Filename: "system-login-log-export.csv",
		Headers:  []string{"username", "ipaddr", "loginLocation", "browser", "os", "status", "msg", "loginTime"},
		Rows:     rows,
	}, nil
}

func (s *AuthService) CleanupLoginLogs(retentionDays int, startedAt, endedAt string) (int64, error) {
	if s.db == nil {
		return 0, common.ErrDatabaseNotInitialized
	}
	window, err := parseCleanupWindow(startedAt, endedAt, "auth.login_log.cleanup.range_invalid")
	if err != nil {
		return 0, err
	}
	db := s.db.Model(&SystemLogLogin{})
	if window != nil {
		db = db.Where("login_time >= ? AND login_time <= ?", window.StartedAt, window.EndedAt)
	} else {
		if !s.isAllowedLoginLogRetentionDays(retentionDays) {
			return 0, errors.New("auth.login_log.cleanup.days_invalid")
		}
		cutoff := time.Now().AddDate(0, 0, -retentionDays)
		db = db.Where("login_time < ?", cutoff)
	}
	result := db.Delete(&SystemLogLogin{})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func (s *AuthService) BatchDeleteLoginLogs(ids []uint64) (int64, error) {
	if s.db == nil {
		return 0, common.ErrDatabaseNotInitialized
	}

	normalized := normalizeUint64IDs(ids)
	if len(normalized) == 0 {
		return 0, errors.New("auth.login_log.delete.ids_required")
	}

	result := s.db.Where("id IN ?", normalized).Delete(&SystemLogLogin{})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func (s *AuthService) listLoginLogsForExport(query *LoginLogQuery) ([]SystemLogLogin, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}
	s.ensureAutomaticLoginLogRetention()

	var logs []SystemLogLogin
	db := s.db.Model(&SystemLogLogin{})
	if query != nil {
		if strings.TrimSpace(query.Username) != "" {
			db = db.Where(usernameLikeWhereClause, "%"+strings.TrimSpace(query.Username)+"%")
		}
		if query.Status != nil && (*query.Status == 0 || *query.Status == 1) {
			db = db.Where("status = ?", *query.Status)
		}
	}
	if err := db.Order(loginTimeDescOrderClause).Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (s *AuthService) RecordLoginLog(requestID, username, ip, browser, os string, status int, msg string) {
	if s.db == nil {
		return
	}
	s.ensureAutomaticLoginLogRetention()

	loginLog := SystemLogLogin{
		RequestID:     strings.TrimSpace(requestID),
		Username:      username,
		Ipaddr:        ip,
		Browser:       browser,
		Os:            os,
		Status:        status,
		Msg:           msg,
		LoginTime:     time.Now(),
		LoginLocation: common.GetLocationByIP(ip),
	}
	_ = s.db.Create(&loginLog).Error
}

func (s *AuthService) ensureAutomaticLoginLogRetention() {
	if s.db == nil {
		return
	}

	now := time.Now()
	s.cleanupMu.Lock()
	lastRun := s.lastCleanupAt["login_log_retention"]
	if !lastRun.IsZero() && now.Sub(lastRun) < autoCleanupMinInterval {
		s.cleanupMu.Unlock()
		return
	}
	s.lastCleanupAt["login_log_retention"] = now
	s.cleanupMu.Unlock()

	retentionDays := s.getSettingInt(settingLoginLogRetentionDaysKey, defaultLoginLogRetentionDays)
	if retentionDays <= 0 {
		retentionDays = defaultLoginLogRetentionDays
	}
	cutoff := now.AddDate(0, 0, -retentionDays)
	_ = s.db.Where("login_time < ?", cutoff).Delete(&SystemLogLogin{}).Error
}

func (s *AuthService) recordFailedLoginAttempt(currentUser *user.SystemUser, policy authRuntimePolicy) (bool, error) {
	if s.db == nil || currentUser == nil {
		return false, common.ErrDatabaseNotInitialized
	}

	nextAttempts := currentUser.FailedLoginAttempts + 1
	updates := map[string]any{
		"failed_login_attempts": nextAttempts,
	}
	if currentUser.LoginLockedUntil != nil && currentUser.LoginLockedUntil.Before(time.Now()) {
		updates["login_locked_until"] = nil
		currentUser.LoginLockedUntil = nil
	}

	if policy.MaxFailedAttempts > 0 && nextAttempts >= policy.MaxFailedAttempts {
		lockUntil := time.Now().Add(time.Duration(maxInt(policy.LockMinutes, 1)) * time.Minute)
		updates["failed_login_attempts"] = 0
		updates["login_locked_until"] = &lockUntil
		currentUser.FailedLoginAttempts = 0
		currentUser.LoginLockedUntil = &lockUntil
		if err := s.db.Model(currentUser).Updates(updates).Error; err != nil {
			return false, err
		}
		return true, nil
	}

	currentUser.FailedLoginAttempts = nextAttempts
	if err := s.db.Model(currentUser).Updates(updates).Error; err != nil {
		return false, err
	}
	return false, nil
}

func (s *AuthService) checkSourceThrottle(sourceKey string, policy authRuntimePolicy, now time.Time) (bool, error) {
	normalizedKey := strings.TrimSpace(sourceKey)
	if normalizedKey == "" || policy.SourceMaxFailedAttempts <= 0 {
		return false, nil
	}

	var throttle SystemLoginThrottle
	if err := s.db.Where("source_key = ?", normalizedKey).First(&throttle).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}

	if throttle.BlockedUntil != nil && throttle.BlockedUntil.After(now) {
		return true, nil
	}
	if s.isSourceThrottleWindowExpired(throttle.WindowStartedAt, policy, now) || (throttle.BlockedUntil != nil && !throttle.BlockedUntil.After(now)) {
		updates := map[string]any{
			"failure_count":     0,
			"window_started_at": nil,
			"blocked_until":     nil,
		}
		if err := s.db.Model(&throttle).Updates(updates).Error; err != nil {
			return false, err
		}
	}
	return false, nil
}

func (s *AuthService) failLoginSourceBlocked(currentUser *user.SystemUser, sourceKey string, policy authRuntimePolicy, now time.Time) error {
	blocked, err := s.recordSourceFailure(sourceKey, policy, now)
	if err != nil {
		return err
	}
	if blocked {
		if currentUser != nil {
			s.recordSecurityEvent(SystemAuthSecurityEvent{
				UserID:     currentUser.ID,
				Username:   currentUser.Username,
				EventType:  "source_blocked",
				Severity:   "high",
				SourceKey:  sourceKey,
				MessageKey: "auth.security.event.source_blocked",
			})
		}
		return errors.New(errAuthLoginSourceBlocked)
	}
	return nil
}

func (s *AuthService) recordSourceFailure(sourceKey string, policy authRuntimePolicy, now time.Time) (bool, error) {
	normalizedKey := strings.TrimSpace(sourceKey)
	if normalizedKey == "" || policy.SourceMaxFailedAttempts <= 0 {
		return false, nil
	}

	var throttle SystemLoginThrottle
	err := s.db.Where("source_key = ?", normalizedKey).First(&throttle).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return s.createSourceThrottleFailure(normalizedKey, policy, now)
	}
	if err != nil {
		return false, err
	}

	if sourceThrottleBlocked(throttle.BlockedUntil, now) {
		return true, nil
	}

	return s.updateSourceThrottleFailure(&throttle, policy, now)
}

func (s *AuthService) createSourceThrottleFailure(sourceKey string, policy authRuntimePolicy, now time.Time) (bool, error) {
	throttle := SystemLoginThrottle{
		SourceKey:       sourceKey,
		FailureCount:    1,
		WindowStartedAt: &now,
		LastAttemptAt:   &now,
		BlockedUntil:    sourceThrottleBlockedUntil(policy, now, policy.SourceMaxFailedAttempts <= 1),
	}
	if err := s.db.Create(&throttle).Error; err != nil {
		return false, err
	}
	return sourceThrottleBlocked(throttle.BlockedUntil, now), nil
}

func (s *AuthService) updateSourceThrottleFailure(throttle *SystemLoginThrottle, policy authRuntimePolicy, now time.Time) (bool, error) {
	windowStartedAt := throttle.WindowStartedAt
	if s.isSourceThrottleWindowExpired(windowStartedAt, policy, now) || windowStartedAt == nil {
		windowStartedAt = &now
		throttle.FailureCount, throttle.BlockedUntil = 0, nil
	}

	throttle.FailureCount++
	throttle.WindowStartedAt = windowStartedAt
	throttle.LastAttemptAt = &now

	if throttle.FailureCount >= policy.SourceMaxFailedAttempts {
		throttle.BlockedUntil = sourceThrottleBlockedUntil(policy, now, true)
	}

	if err := s.db.Model(&throttle).Updates(map[string]any{
		"failure_count":     throttle.FailureCount,
		"window_started_at": throttle.WindowStartedAt,
		"last_attempt_at":   throttle.LastAttemptAt,
		"blocked_until":     throttle.BlockedUntil,
	}).Error; err != nil {
		return false, err
	}
	return sourceThrottleBlocked(throttle.BlockedUntil, now), nil
}

func (s *AuthService) isSourceThrottleWindowExpired(windowStartedAt *time.Time, policy authRuntimePolicy, now time.Time) bool {
	if windowStartedAt == nil {
		return true
	}
	windowMinutes := maxInt(policy.SourceWindowMinutes, 1)
	return windowStartedAt.Add(time.Duration(windowMinutes) * time.Minute).Before(now)
}

func loginSourceIP(sourceKey string) string {
	trimmed := strings.TrimSpace(sourceKey)
	if strings.HasPrefix(trimmed, "ip:") {
		return strings.TrimSpace(strings.TrimPrefix(trimmed, "ip:"))
	}
	return ""
}

func sourceThrottleBlocked(blockedUntil *time.Time, now time.Time) bool {
	return blockedUntil != nil && blockedUntil.After(now)
}

func sourceThrottleBlockedUntil(policy authRuntimePolicy, now time.Time, shouldBlock bool) *time.Time {
	if !shouldBlock {
		return nil
	}
	blockedUntil := now.Add(time.Duration(maxInt(policy.SourceLockMinutes, 1)) * time.Minute)
	return &blockedUntil
}

func queryPage(query *LoginLogQuery) int {
	if query == nil {
		return 1
	}
	return query.Page
}

func queryPageSize(query *LoginLogQuery) int {
	if query == nil {
		return 10
	}
	return query.PageSize
}

func queryStatus(query *LoginLogQuery) *int {
	if query == nil {
		return nil
	}
	return query.Status
}
