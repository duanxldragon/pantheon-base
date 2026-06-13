package auth

import (
	"pantheon-platform/backend/pkg/common"
	"errors"
	"strings"
	"time"

	user "pantheon-platform/backend/modules/system/iam/user"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type authLoginService struct {
	auth *AuthService
}

func newAuthLoginService(auth *AuthService) *authLoginService {
	return &authLoginService{auth: auth}
}

func (s *authLoginService) Login(req *LoginReq) (*user.SystemUser, error) {
	return s.LoginWithSource(req, "")
}

func (s *authLoginService) Authenticate(req *LoginReq) (*user.SystemUser, error) {
	return s.Login(req)
}

func (s *authLoginService) LoginWithSource(req *LoginReq, sourceKey string) (*user.SystemUser, error) {
	if s.auth.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}
	policy := s.auth.getAuthRuntimePolicy()
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

func (s *authLoginService) ensureSourceThrottleAllowed(sourceKey string, policy authRuntimePolicy, now time.Time) error {
	blocked, err := s.checkSourceThrottle(sourceKey, policy, now)
	if err != nil {
		return err
	}
	if blocked {
		return errors.New(errAuthLoginSourceBlocked)
	}
	return nil
}

func (s *authLoginService) loadLoginUserWithSource(username, sourceKey string, policy authRuntimePolicy, now time.Time) (*user.SystemUser, error) {
	if username == "" {
		_ = s.failLoginSourceBlocked(nil, sourceKey, policy, now)
		return nil, errors.New("user.login.error.not_found")
	}

	var currentUser user.SystemUser
	result := s.auth.db.Where("username = ?", username).First(&currentUser)
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

func (s *authLoginService) ensureLoginUserAvailable(currentUser *user.SystemUser, sourceKey string, policy authRuntimePolicy, now time.Time) error {
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

func (s *authLoginService) handlePasswordMismatch(currentUser *user.SystemUser, sourceKey string, policy authRuntimePolicy, now time.Time) error {
	locked, err := s.recordFailedLoginAttempt(currentUser, policy)
	if err != nil {
		return err
	}
	blocked, err := s.recordSourceFailure(sourceKey, policy, now)
	if err != nil {
		return err
	}
	if blocked {
		s.auth.recordSecurityEvent(SystemAuthSecurityEvent{
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
		s.auth.recordSecurityEvent(SystemAuthSecurityEvent{
			UserID:     currentUser.ID,
			Username:   currentUser.Username,
			EventType:  "account_locked",
			Severity:   "high",
			SourceKey:  sourceKey,
			MessageKey: "auth.security.event.account_locked",
		})
		return errors.New("user.login.error.locked")
	}
	s.auth.recordSecurityEvent(SystemAuthSecurityEvent{
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

func (s *authLoginService) recordFailedLoginAttempt(currentUser *user.SystemUser, policy authRuntimePolicy) (bool, error) {
	if s.auth.db == nil || currentUser == nil {
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
		if err := s.auth.db.Model(currentUser).Updates(updates).Error; err != nil {
			return false, err
		}
		return true, nil
	}

	currentUser.FailedLoginAttempts = nextAttempts
	if err := s.auth.db.Model(currentUser).Updates(updates).Error; err != nil {
		return false, err
	}
	return false, nil
}

func (s *authLoginService) checkSourceThrottle(sourceKey string, policy authRuntimePolicy, now time.Time) (bool, error) {
	normalizedKey := strings.TrimSpace(sourceKey)
	if normalizedKey == "" || policy.SourceMaxFailedAttempts <= 0 {
		return false, nil
	}

	var throttle SystemLoginThrottle
	if err := s.auth.db.Where("source_key = ?", normalizedKey).First(&throttle).Error; err != nil {
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
		if err := s.auth.db.Model(&throttle).Updates(updates).Error; err != nil {
			return false, err
		}
	}
	return false, nil
}

func (s *authLoginService) failLoginSourceBlocked(currentUser *user.SystemUser, sourceKey string, policy authRuntimePolicy, now time.Time) error {
	blocked, err := s.recordSourceFailure(sourceKey, policy, now)
	if err != nil {
		return err
	}
	if blocked {
		if currentUser != nil {
			s.auth.recordSecurityEvent(SystemAuthSecurityEvent{
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

func (s *authLoginService) recordSourceFailure(sourceKey string, policy authRuntimePolicy, now time.Time) (bool, error) {
	normalizedKey := strings.TrimSpace(sourceKey)
	if normalizedKey == "" || policy.SourceMaxFailedAttempts <= 0 {
		return false, nil
	}

	var throttle SystemLoginThrottle
	err := s.auth.db.Where("source_key = ?", normalizedKey).First(&throttle).Error
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

func (s *authLoginService) createSourceThrottleFailure(sourceKey string, policy authRuntimePolicy, now time.Time) (bool, error) {
	throttle := SystemLoginThrottle{
		SourceKey:       sourceKey,
		FailureCount:    1,
		WindowStartedAt: &now,
		LastAttemptAt:   &now,
		BlockedUntil:    sourceThrottleBlockedUntil(policy, now, policy.SourceMaxFailedAttempts <= 1),
	}
	if err := s.auth.db.Create(&throttle).Error; err != nil {
		return false, err
	}
	return sourceThrottleBlocked(throttle.BlockedUntil, now), nil
}

func (s *authLoginService) updateSourceThrottleFailure(throttle *SystemLoginThrottle, policy authRuntimePolicy, now time.Time) (bool, error) {
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

	if err := s.auth.db.Model(&throttle).Updates(map[string]any{
		"failure_count":     throttle.FailureCount,
		"window_started_at": throttle.WindowStartedAt,
		"last_attempt_at":   throttle.LastAttemptAt,
		"blocked_until":     throttle.BlockedUntil,
	}).Error; err != nil {
		return false, err
	}
	return sourceThrottleBlocked(throttle.BlockedUntil, now), nil
}

func (s *authLoginService) isSourceThrottleWindowExpired(windowStartedAt *time.Time, policy authRuntimePolicy, now time.Time) bool {
	if windowStartedAt == nil {
		return true
	}
	windowMinutes := maxInt(policy.SourceWindowMinutes, 1)
	return windowStartedAt.Add(time.Duration(windowMinutes) * time.Minute).Before(now)
}

func (s *authLoginService) clearFailedLoginState(userID uint64) error {
	if s.auth.db == nil {
		return common.ErrDatabaseNotInitialized
	}
	return s.auth.db.Model(&user.SystemUser{}).
		Where("id = ? AND (failed_login_attempts <> 0 OR login_locked_until IS NOT NULL)", userID).
		Updates(map[string]any{
			"failed_login_attempts": 0,
			"login_locked_until":    nil,
		}).Error
}
