package auth

import (
	"sync"
	"time"

	"pantheon-platform/backend/pkg/authsession"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/platformprefs"

	"gorm.io/gorm"
)

type AuthService struct {
	db *gorm.DB

	// 账号安全策略缓存
	settingsMu    sync.RWMutex
	settingsCache map[string]int
	cleanupMu     sync.Mutex
	lastCleanupAt map[string]time.Time
}

type UserPreferenceUpdateResult struct {
	User      *UserInfoResp
	Previous  *platformprefs.PlatformPreference
	Current   *platformprefs.PlatformPreference
	Persisted string
}

type authRuntimePolicy struct {
	PasswordMinLength       int
	PasswordRequireDigit    bool
	PasswordRequireUpper    bool
	PasswordHistoryLimit    int
	PasswordExpireDays      int
	MaxFailedAttempts       int
	LockMinutes             int
	SourceMaxFailedAttempts int
	SourceWindowMinutes     int
	SourceLockMinutes       int
	SessionIdleMinutes      int
	MaxActiveSessions       int
	LoginLogRetentionDays   int
	SessionRetentionDays    int
	SecurityEventEnabled    bool
	CaptchaEnabled          bool
	MFAEnabled              bool
	SSOEnabled              bool
}

type adminSessionRow struct {
	SessionID        string     `gorm:"column:session_id"`
	UserID           uint64     `gorm:"column:user_id"`
	Username         string     `gorm:"column:username"`
	Nickname         string     `gorm:"column:nickname"`
	LastIP           string     `gorm:"column:last_ip"`
	UserAgent        string     `gorm:"column:user_agent"`
	RefreshExpiresAt time.Time  `gorm:"column:refresh_expires_at"`
	LastRefreshAt    *time.Time `gorm:"column:last_refresh_at"`
	LastActivityAt   *time.Time `gorm:"column:last_activity_at"`
	RevokedAt        *time.Time `gorm:"column:revoked_at"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
}

const (
	defaultPasswordMinLength       = 6
	defaultMaxFailedAttempts       = 5
	defaultLockMinutes             = 15
	defaultSourceMaxFailedAttempts = 20
	defaultSourceWindowMinutes     = 15
	defaultSourceLockMinutes       = 15
	defaultSessionIdleMinutes      = 30
	defaultMaxActiveSessions       = authsession.DefaultMaxActiveSessionsPerUser
	defaultLoginLogRetentionDays   = 90
	defaultSessionRetentionDays    = authsession.DefaultSessionRetentionDays
	autoCleanupMinInterval         = 15 * time.Minute
)

const (
	settingPasswordMinLengthKey       = "security.password_min_length"
	settingPasswordRequireDigitKey    = "security.password_require_digit"
	settingPasswordRequireUpperKey    = "security.password_require_uppercase"
	settingPasswordHistoryLimitKey    = "security.password_history_limit"
	settingPasswordExpireDaysKey      = "security.password_expire_days"
	settingMaxFailedAttemptsKey       = "login.max_failed_attempts"
	settingLockMinutesKey             = "login.lock_minutes"
	settingSourceMaxFailedAttemptsKey = "login.source_max_failed_attempts"
	settingSourceWindowMinutesKey     = "login.source_window_minutes"
	settingSourceLockMinutesKey       = "login.source_lock_minutes"
	settingSessionIdleMinutesKey      = "login.session_idle_minutes"
	settingMaxActiveSessionsKey       = "login.max_active_sessions_per_user"
	settingLoginLogRetentionDaysKey   = "audit.login_log_retention_days"
	settingSessionRetentionDaysKey    = "audit.session_retention_days"
	settingSecurityEventEnabledKey    = "login.security_event_enabled"
	settingCaptchaEnabledKey          = "login.captcha_enabled"
	settingMFAEnabledKey              = "login.mfa_enabled"
	settingSSOEnabledKey              = "login.sso_enabled"

	errAuthLoginSourceBlocked        = "auth.login.error.source_blocked"
	errSessionInvalid                = "session.invalid"
	errCurrentSessionRevokeForbidden = "auth.session.current_revoke_forbidden"

	userIDWhereClause        = "user_id = ?"
	settingKeyWhereClause    = "setting_key = ?"
	usernameLikeWhereClause  = "username LIKE ?"
	loginTimeDescOrderClause = "login_time desc, id desc"

	userIDAndFactorTypeEnabledWhereClause    = userIDWhereClause + " AND factor_type = ? AND enabled = ?"
	userIDAndFactorTypeWhereClause           = userIDWhereClause + " AND factor_type = ?"
	sessionIDAndUserIDWhereClause            = "session_id = ? AND " + userIDWhereClause
	sessionIDAndActiveUserIDWhereClause      = sessionIDAndUserIDWhereClause + " AND revoked_at IS NULL"
	otherActiveSessionsByUserWhereClause     = userIDWhereClause + " AND session_id <> ? AND revoked_at IS NULL"
	systemUserRoleUserIDAndStatusWhereClause = "system_user_role.user_id = ? AND system_role.status = ?"
	systemUserRoleUserIDAndPermsWhereClause  = "system_user_role.user_id = ? AND system_role_permission.permission_key <> ''"
	systemUserUsernameLikeWhereClause        = "system_user.username LIKE ?"

	touchSessionActivitySQL = `UPDATE system_user_session
SET last_activity_at = ?,
    last_ip = CASE WHEN ? <> '' THEN ? ELSE last_ip END,
    user_agent = CASE WHEN ? <> '' THEN ? ELSE user_agent END
WHERE session_id = ? AND user_id = ? AND revoked_at IS NULL
  AND (last_activity_at IS NULL OR last_activity_at < ?)`
)

// NewAuthService 构造函数
func NewAuthService(db *gorm.DB) *AuthService {
	s := &AuthService{
		db:            db,
		settingsCache: make(map[string]int),
		lastCleanupAt: make(map[string]time.Time),
	}
	// 启动时同步加载一次核心设置
	_ = s.ReloadSettings()
	return s
}

// Migrate 初始化认证域表结构。
func (s *AuthService) Migrate() error {
	if s.db == nil {
		return common.ErrDatabaseNotInitialized
	}
	if err := s.db.AutoMigrate(&SystemUserSession{}, &SystemLogLogin{}, &SystemLoginThrottle{}, &SystemAuthFactor{}, &SystemAuthMFAChallenge{}, &SystemAuthSecurityEvent{}, &SystemUserPasswordHistory{}); err != nil {
		return err
	}
	return nil
}
