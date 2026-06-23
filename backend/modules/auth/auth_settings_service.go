package auth

import (
	"context"
	"encoding/json"
	"sort"
	"strconv"
	"strings"

	"pantheon-platform/backend/pkg/database"
)

func (s *AuthService) ReloadSettings() error {
	policy := authRuntimePolicy{
		PasswordMinLength:       s.fetchSettingIntFromDB(settingPasswordMinLengthKey, defaultPasswordMinLength),
		PasswordRequireDigit:    s.fetchSettingBoolFromDB(settingPasswordRequireDigitKey, false),
		PasswordRequireUpper:    s.fetchSettingBoolFromDB(settingPasswordRequireUpperKey, false),
		PasswordHistoryLimit:    s.fetchSettingIntFromDB(settingPasswordHistoryLimitKey, 0),
		PasswordExpireDays:      s.fetchSettingIntFromDB(settingPasswordExpireDaysKey, 0),
		MaxFailedAttempts:       s.fetchSettingIntFromDB(settingMaxFailedAttemptsKey, defaultMaxFailedAttempts),
		LockMinutes:             s.fetchSettingIntFromDB(settingLockMinutesKey, defaultLockMinutes),
		SourceMaxFailedAttempts: s.fetchSettingIntFromDB(settingSourceMaxFailedAttemptsKey, defaultSourceMaxFailedAttempts),
		SourceWindowMinutes:     s.fetchSettingIntFromDB(settingSourceWindowMinutesKey, defaultSourceWindowMinutes),
		SourceLockMinutes:       s.fetchSettingIntFromDB(settingSourceLockMinutesKey, defaultSourceLockMinutes),
		SessionIdleMinutes:      s.fetchSettingIntFromDB(settingSessionIdleMinutesKey, defaultSessionIdleMinutes),
		MaxActiveSessions:       s.fetchSettingIntFromDB(settingMaxActiveSessionsKey, defaultMaxActiveSessions),
		LoginLogRetentionDays:   s.fetchSettingIntFromDB(settingLoginLogRetentionDaysKey, defaultLoginLogRetentionDays),
		SessionRetentionDays:    s.fetchSettingIntFromDB(settingSessionRetentionDaysKey, defaultSessionRetentionDays),
		SecurityEventEnabled:    s.fetchSettingBoolFromDB(settingSecurityEventEnabledKey, true),
		CaptchaEnabled:          s.fetchSettingBoolFromDB(settingCaptchaEnabledKey, false),
		MFAEnabled:              s.fetchSettingBoolFromDB(settingMFAEnabledKey, false),
		SSOEnabled:              s.fetchSettingBoolFromDB(settingSSOEnabledKey, false),
	}

	s.settingsMu.Lock()
	s.settingsCache[settingPasswordMinLengthKey] = policy.PasswordMinLength
	s.settingsCache[settingPasswordRequireDigitKey] = boolToInt(policy.PasswordRequireDigit)
	s.settingsCache[settingPasswordRequireUpperKey] = boolToInt(policy.PasswordRequireUpper)
	s.settingsCache[settingPasswordHistoryLimitKey] = policy.PasswordHistoryLimit
	s.settingsCache[settingPasswordExpireDaysKey] = policy.PasswordExpireDays
	s.settingsCache[settingMaxFailedAttemptsKey] = policy.MaxFailedAttempts
	s.settingsCache[settingLockMinutesKey] = policy.LockMinutes
	s.settingsCache[settingSourceMaxFailedAttemptsKey] = policy.SourceMaxFailedAttempts
	s.settingsCache[settingSourceWindowMinutesKey] = policy.SourceWindowMinutes
	s.settingsCache[settingSourceLockMinutesKey] = policy.SourceLockMinutes
	s.settingsCache[settingSessionIdleMinutesKey] = policy.SessionIdleMinutes
	s.settingsCache[settingMaxActiveSessionsKey] = policy.MaxActiveSessions
	s.settingsCache[settingLoginLogRetentionDaysKey] = policy.LoginLogRetentionDays
	s.settingsCache[settingSessionRetentionDaysKey] = policy.SessionRetentionDays
	s.settingsCache[settingSecurityEventEnabledKey] = boolToInt(policy.SecurityEventEnabled)
	s.settingsCache[settingCaptchaEnabledKey] = boolToInt(policy.CaptchaEnabled)
	s.settingsCache[settingMFAEnabledKey] = boolToInt(policy.MFAEnabled)
	s.settingsCache[settingSSOEnabledKey] = boolToInt(policy.SSOEnabled)
	s.settingsMu.Unlock()

	return nil
}

func (s *AuthService) WatchSettings() {
	if database.RDB == nil {
		return
	}
	pubsub := database.RDB.Subscribe(context.TODO(), "settings:refresh")
	go func() {
		defer pubsub.Close()
		ch := pubsub.Channel()
		for range ch {
			_ = s.ReloadSettings()
		}
	}()
}

func (s *AuthService) getAuthRuntimePolicy() authRuntimePolicy {
	s.settingsMu.RLock()
	defer s.settingsMu.RUnlock()

	return authRuntimePolicy{
		PasswordMinLength:       s.settingsCache[settingPasswordMinLengthKey],
		PasswordRequireDigit:    s.settingsCache[settingPasswordRequireDigitKey] == 1,
		PasswordRequireUpper:    s.settingsCache[settingPasswordRequireUpperKey] == 1,
		PasswordHistoryLimit:    s.settingsCache[settingPasswordHistoryLimitKey],
		PasswordExpireDays:      s.settingsCache[settingPasswordExpireDaysKey],
		MaxFailedAttempts:       s.settingsCache[settingMaxFailedAttemptsKey],
		LockMinutes:             s.settingsCache[settingLockMinutesKey],
		SourceMaxFailedAttempts: fallbackPositiveInt(s.settingsCache[settingSourceMaxFailedAttemptsKey], defaultSourceMaxFailedAttempts),
		SourceWindowMinutes:     fallbackPositiveInt(s.settingsCache[settingSourceWindowMinutesKey], defaultSourceWindowMinutes),
		SourceLockMinutes:       fallbackPositiveInt(s.settingsCache[settingSourceLockMinutesKey], defaultSourceLockMinutes),
		SessionIdleMinutes:      fallbackPositiveInt(s.settingsCache[settingSessionIdleMinutesKey], defaultSessionIdleMinutes),
		MaxActiveSessions:       fallbackPositiveInt(s.settingsCache[settingMaxActiveSessionsKey], defaultMaxActiveSessions),
		LoginLogRetentionDays:   fallbackPositiveInt(s.settingsCache[settingLoginLogRetentionDaysKey], defaultLoginLogRetentionDays),
		SessionRetentionDays:    fallbackPositiveInt(s.settingsCache[settingSessionRetentionDaysKey], defaultSessionRetentionDays),
		SecurityEventEnabled:    s.settingsCache[settingSecurityEventEnabledKey] == 1,
		CaptchaEnabled:          s.settingsCache[settingCaptchaEnabledKey] == 1,
		MFAEnabled:              s.settingsCache[settingMFAEnabledKey] == 1,
		SSOEnabled:              s.settingsCache[settingSSOEnabledKey] == 1,
	}
}

func (s *AuthService) getSettingInt(settingKey string, fallback int) int {
	s.settingsMu.RLock()
	if val, ok := s.settingsCache[settingKey]; ok {
		s.settingsMu.RUnlock()
		return val
	}
	s.settingsMu.RUnlock()

	return s.fetchSettingIntFromDB(settingKey, fallback)
}

func (s *AuthService) fetchSettingIntFromDB(settingKey string, fallback int) int {
	if s.db == nil {
		return fallback
	}

	var rawValue string
	err := s.db.Table("system_setting").
		Select("setting_value").
		Where(settingKeyWhereClause, settingKey).
		Limit(1).
		Pluck("setting_value", &rawValue).Error
	if err != nil {
		return fallback
	}

	value, err := strconv.Atoi(strings.TrimSpace(rawValue))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

func (s *AuthService) fetchSettingBoolFromDB(settingKey string, fallback bool) bool {
	if s.db == nil {
		return fallback
	}

	var rawValue string
	err := s.db.Table("system_setting").
		Select("setting_value").
		Where(settingKeyWhereClause, settingKey).
		Limit(1).
		Pluck("setting_value", &rawValue).Error
	if err != nil {
		return fallback
	}

	parsed, err := strconv.ParseBool(strings.TrimSpace(rawValue))
	if err != nil {
		return fallback
	}
	return parsed
}

func (s *AuthService) getRetentionOptionsFromSetting(settingKey string, fallback []int) []int {
	if s.db == nil {
		return fallback
	}

	var row struct {
		SettingValue string `gorm:"column:setting_value"`
	}
	if err := s.db.Table("system_setting").Select("setting_value").Where(settingKeyWhereClause, settingKey).Take(&row).Error; err != nil {
		return fallback
	}

	var values []int
	if err := json.Unmarshal([]byte(strings.TrimSpace(row.SettingValue)), &values); err != nil {
		return fallback
	}

	normalized := make([]int, 0, len(values))
	seen := make(map[int]struct{}, len(values))
	for _, value := range values {
		if value <= 0 {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		normalized = append(normalized, value)
	}
	if len(normalized) == 0 {
		return fallback
	}

	sort.Ints(normalized)
	return normalized
}

func (s *AuthService) isAllowedLoginLogRetentionDays(retentionDays int) bool {
	for _, allowed := range s.getLoginLogRetentionOptions() {
		if allowed == retentionDays {
			return true
		}
	}
	return false
}

func (s *AuthService) getLoginLogRetentionOptions() []int {
	return s.getRetentionOptionsFromSetting("audit.login_log_retention_options", []int{1, 7, 30})
}

func (s *AuthService) isAllowedSessionCleanupRetentionDays(retentionDays int) bool {
	for _, allowed := range s.getSessionCleanupRetentionOptions() {
		if allowed == retentionDays {
			return true
		}
	}
	return false
}

func (s *AuthService) getSessionCleanupRetentionOptions() []int {
	return s.getRetentionOptionsFromSetting("audit.session_cleanup_retention_options", []int{1, 7, 30})
}

func fallbackPositiveInt(value, fallback int) int {
	if value > 0 {
		return value
	}
	return fallback
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}
