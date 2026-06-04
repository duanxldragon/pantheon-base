package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/netip"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode"

	user "pantheon-platform/backend/modules/system/iam/user"
	"pantheon-platform/backend/pkg/authsession"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/database"
	"pantheon-platform/backend/pkg/impexp"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthService struct {
	db        *gorm.DB
	logins    *authLoginService
	mfa       *authMFAService
	passwords *authPasswordService
	sessions  *authSessionService
	overview  *authOverviewService

	// 核心安全策略缓存
	settingsMu    sync.RWMutex
	settingsCache map[string]int
	cleanupMu     sync.Mutex
	lastCleanupAt map[string]time.Time
}

type UserPreferenceUpdateResult struct {
	User      *UserInfoResp
	Previous  *user.UserPlatformPreferenceResp
	Current   *user.UserPlatformPreferenceResp
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

	errDatabaseNotInitialized        = "database.not_initialized"
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
	s.logins = newAuthLoginService(s)
	s.mfa = newAuthMFAService(s)
	s.passwords = newAuthPasswordService(s)
	s.sessions = newAuthSessionService(s)
	s.overview = newAuthOverviewService(s)
	// 启动时同步加载一次核心设置
	_ = s.ReloadSettings()
	return s
}

// ReloadSettings 重新加载核心安全策略缓存
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

// WatchSettings 监听配置刷新信号 (跨模块/实例同步)
func (s *AuthService) WatchSettings() {
	if database.RDB == nil {
		return
	}
	pubsub := database.RDB.Subscribe(context.Background(), "settings:refresh")
	go func() {
		defer pubsub.Close()
		ch := pubsub.Channel()
		for range ch {
			_ = s.ReloadSettings()
		}
	}()
}

// Migrate 初始化认证域表结构。
func (s *AuthService) Migrate() error {
	if s.db == nil {
		return errors.New(errDatabaseNotInitialized)
	}
	if err := s.db.AutoMigrate(&SystemUserSession{}, &SystemLogLogin{}, &SystemLoginThrottle{}, &SystemAuthFactor{}, &SystemAuthMFAChallenge{}, &SystemAuthSecurityEvent{}, &SystemUserPasswordHistory{}); err != nil {
		return err
	}
	return nil
}

// VerifyPasswordForOperation 敏感操作前的密码二次验证
func (s *AuthService) VerifyPasswordForOperation(userID uint64, sessionID, password string) (string, error) {
	return s.passwords.VerifyPasswordForOperation(userID, sessionID, password)
}

// Login 用户登录
func (s *AuthService) Login(req *LoginReq) (*user.SystemUser, error) {
	return s.logins.Login(req)
}

func (s *AuthService) LoginWithSource(req *LoginReq, sourceKey string) (*user.SystemUser, error) {
	return s.logins.LoginWithSource(req, sourceKey)
}

func (s *AuthService) Authenticate(req *LoginReq) (*user.SystemUser, error) {
	return s.logins.Authenticate(req)
}

func (s *AuthService) CreateMFAChallenge(currentUser *user.SystemUser) (*MFAChallengeResp, error) {
	return s.mfa.CreateMFAChallenge(currentUser)
}

func (s *AuthService) VerifyMFAChallenge(req *MFAVerifyReq, ip, userAgent string) (*AuthTokenResp, error) {
	return s.mfa.VerifyMFAChallenge(req, ip, userAgent)
}

// GetUserRoles 获取用户角色标识
func (s *AuthService) GetUserRoles(userID uint64) ([]string, error) {
	if s.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
	}

	var roles []string
	err := s.db.Table("system_role").
		Select("system_role.role_key").
		Joins("JOIN system_user_role ON system_user_role.role_id = system_role.id").
		Where(systemUserRoleUserIDAndStatusWhereClause, userID, 1).
		Pluck("system_role.role_key", &roles).Error
	if err != nil {
		return nil, err
	}
	return roles, nil
}

// GetUserPerms 获取用户按钮/接口权限标识
func (s *AuthService) GetUserPerms(userID uint64) ([]string, error) {
	if s.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
	}

	var permissionKeys []string
	err := s.db.Table("system_role_permission").
		Select("DISTINCT system_role_permission.permission_key").
		Joins("JOIN system_user_role ON system_user_role.role_id = system_role_permission.role_id").
		Where(systemUserRoleUserIDAndPermsWhereClause, userID).
		Pluck("system_role_permission.permission_key", &permissionKeys).Error
	if err != nil {
		return nil, err
	}
	return mergePermissionKeys(permissionKeys), nil
}

// GetCurrentUserInfo 获取当前登录主体信息
func (s *AuthService) GetCurrentUserInfo(userID uint64) (*UserInfoResp, error) {
	if s.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
	}

	var currentUser user.SystemUser
	if err := s.db.First(&currentUser, userID).Error; err != nil {
		return nil, err
	}

	roles, err := s.GetUserRoles(currentUser.ID)
	if err != nil {
		return nil, err
	}
	perms, err := s.GetUserPerms(currentUser.ID)
	if err != nil {
		return nil, err
	}

	return &UserInfoResp{
		ID:          currentUser.ID,
		Username:    currentUser.Username,
		Nickname:    currentUser.Nickname,
		Avatar:      currentUser.Avatar,
		Email:       currentUser.Email,
		Phone:       currentUser.Phone,
		Roles:       roles,
		Perms:       perms,
		Preferences: user.ParseUserPlatformPreferences(currentUser.PreferenceJSON),
	}, nil
}

func (s *AuthService) UpdateCurrentUserPreferences(userID uint64, req *UserPlatformPreferenceUpdateReq) (*UserPreferenceUpdateResult, error) {
	if s.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
	}

	var currentUser user.SystemUser
	if err := s.db.First(&currentUser, userID).Error; err != nil {
		return nil, err
	}

	previousPreferences := user.ParseUserPlatformPreferences(currentUser.PreferenceJSON)
	nextPreferences := user.NormalizeUserPlatformPreferences(&user.UserPlatformPreferenceResp{
		Theme:       req.Theme,
		Language:    req.Language,
		LayoutMode:  req.LayoutMode,
		DensityMode: req.DensityMode,
	})
	preferenceJSON, err := user.MarshalUserPlatformPreferences(nextPreferences)
	if err != nil {
		return nil, err
	}

	if preferenceJSON != currentUser.PreferenceJSON {
		if err := s.db.Model(&user.SystemUser{}).
			Where("id = ?", userID).
			Update("preference_json", preferenceJSON).Error; err != nil {
			return nil, err
		}
	}

	userInfo, err := s.GetCurrentUserInfo(userID)
	if err != nil {
		return nil, err
	}

	return &UserPreferenceUpdateResult{
		User:      userInfo,
		Previous:  previousPreferences,
		Current:   nextPreferences,
		Persisted: preferenceJSON,
	}, nil
}

// UpdatePassword 修改当前登录用户密码
func (s *AuthService) UpdatePassword(userID uint64, currentSessionID string, req *PasswordUpdateReq) error {
	return s.passwords.UpdatePassword(userID, currentSessionID, req)
}

// CreateSession 创建登录会话并签发 token pair
func (s *AuthService) CreateSession(currentUser *user.SystemUser, roles []string, ip, userAgent string) (*common.TokenPair, error) {
	return s.sessions.CreateSession(currentUser, roles, ip, userAgent)
}

// RefreshSession 轮换 refresh token 并返回新的 token pair
func (s *AuthService) RefreshSession(claims *common.CustomClaims, ip, userAgent string) (*common.TokenPair, error) {
	return s.sessions.RefreshSession(claims, ip, userAgent)
}

// RevokeSession 吊销会话
func (s *AuthService) RevokeSession(sessionID string) error {
	return s.sessions.RevokeSession(sessionID)
}

func (s *AuthService) TouchSessionActivity(sessionID string, userID uint64, ip, userAgent string) error {
	return s.sessions.TouchSessionActivity(sessionID, userID, ip, userAgent)
}

// ListSessions 获取当前用户会话列表
func (s *AuthService) ListSessions(userID uint64, currentSessionID string) ([]SessionResp, error) {
	return s.sessions.ListSessions(userID, currentSessionID)
}

// GetSecurityOverview 获取当前账号安全概览
func (s *AuthService) GetSecurityOverview(userID uint64, username, currentSessionID string) (*SecurityOverviewResp, error) {
	return s.overview.GetSecurityOverview(userID, username, currentSessionID)
}

// RevokeOwnedSession 吊销当前用户的指定会话
func (s *AuthService) RevokeOwnedSession(userID uint64, currentSessionID, targetSessionID string) error {
	return s.sessions.RevokeOwnedSession(userID, currentSessionID, targetSessionID)
}

// ListOwnLoginLogs 获取当前用户登录日志
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

// ListLoginLogs 获取管理员登录日志
func (s *AuthService) ListLoginLogs(query *LoginLogQuery) (*LoginLogPageResp, error) {
	s.ensureAutomaticLoginLogRetention()
	return s.listLoginLogs(query)
}

func (s *AuthService) ListSecurityEvents(query *SecurityEventQuery) (*SecurityEventPageResp, error) {
	if s.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
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

func (s *AuthService) ExportLoginLogs(query *LoginLogQuery) (*impexp.CSVFile, error) {
	if s.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
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
		return 0, errors.New(errDatabaseNotInitialized)
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

func (s *AuthService) CleanupHistoricSessions(retentionDays int, startedAt, endedAt string) (int64, error) {
	return s.sessions.CleanupHistoricSessions(retentionDays, startedAt, endedAt)
}

func (s *AuthService) BatchRevokeSessions(currentSessionID string, sessionIDs []string) (int64, error) {
	return s.sessions.BatchRevokeSessions(currentSessionID, sessionIDs)
}

func (s *AuthService) AcknowledgeSecurityEvent(eventID, actorID uint64, actorUsername, note string) error {
	if s.db == nil {
		return errors.New(errDatabaseNotInitialized)
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

func (s *AuthService) BatchDeleteLoginLogs(ids []uint64) (int64, error) {
	if s.db == nil {
		return 0, errors.New(errDatabaseNotInitialized)
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

func (s *AuthService) listLoginLogs(query *LoginLogQuery) (*LoginLogPageResp, error) {
	if s.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
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

func (s *AuthService) listLoginLogsForExport(query *LoginLogQuery) ([]SystemLogLogin, error) {
	if s.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
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

// ListAllSessions 获取管理员会话列表
func (s *AuthService) ListAllSessions(query *AdminSessionQuery) (*AdminSessionPageResp, error) {
	return s.sessions.ListAllSessions(query)
}

func applyAdminSessionFilters(db *gorm.DB, query *AdminSessionQuery, now time.Time, policy authRuntimePolicy) *gorm.DB {
	if query == nil {
		return db
	}
	if strings.TrimSpace(query.Username) != "" {
		db = db.Where(systemUserUsernameLikeWhereClause, "%"+strings.TrimSpace(query.Username)+"%")
	}
	if strings.TrimSpace(query.LastIP) != "" {
		db = db.Where("system_user_session.last_ip LIKE ?", "%"+strings.TrimSpace(query.LastIP)+"%")
	}
	if query.Status == nil {
		return db
	}
	if *query.Status == 1 {
		return authsession.ApplyActiveScope(db, "system_user_session", now, policy.SessionIdleMinutes)
	}
	if *query.Status == 2 {
		return db.Where("system_user_session.revoked_at IS NOT NULL")
	}
	return db
}

func matchesAdminSessionFilters(query *AdminSessionQuery, clientInfo ClientInfoResp) bool {
	if query == nil {
		return true
	}
	if strings.TrimSpace(query.Browser) != "" && !strings.EqualFold(strings.TrimSpace(query.Browser), clientInfo.Browser) {
		return false
	}
	if strings.TrimSpace(query.OS) != "" && !strings.EqualFold(strings.TrimSpace(query.OS), clientInfo.OS) {
		return false
	}
	if strings.TrimSpace(query.Device) != "" && !strings.EqualFold(strings.TrimSpace(query.Device), clientInfo.Device) {
		return false
	}
	return true
}

func buildAdminSessionResp(row adminSessionRow, clientInfo ClientInfoResp) AdminSessionResp {
	return AdminSessionResp{
		SessionID:        row.SessionID,
		UserID:           row.UserID,
		Username:         row.Username,
		Nickname:         row.Nickname,
		LastIP:           row.LastIP,
		Browser:          clientInfo.Browser,
		OS:               clientInfo.OS,
		Device:           clientInfo.Device,
		UserAgent:        clientInfo.UserAgent,
		RefreshExpiresAt: row.RefreshExpiresAt.Format(time.RFC3339),
		LastRefreshAt:    formatNullableTime(row.LastRefreshAt),
		LastActivityAt:   formatNullableTime(row.LastActivityAt),
		RevokedAt:        formatNullableTime(row.RevokedAt),
		CreatedAt:        row.CreatedAt.Format(time.RFC3339),
	}
}

// RevokeAnySession 管理员吊销任意会话
func (s *AuthService) RevokeAnySession(currentSessionID, targetSessionID string) error {
	return s.sessions.RevokeAnySession(currentSessionID, targetSessionID)
}

// RecordLoginLog 记录登录日志
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
		SourceMaxFailedAttempts: maxInt(s.settingsCache[settingSourceMaxFailedAttemptsKey], defaultSourceMaxFailedAttempts),
		SourceWindowMinutes:     maxInt(s.settingsCache[settingSourceWindowMinutesKey], defaultSourceWindowMinutes),
		SourceLockMinutes:       maxInt(s.settingsCache[settingSourceLockMinutesKey], defaultSourceLockMinutes),
		SessionIdleMinutes:      s.settingsCache[settingSessionIdleMinutesKey],
		MaxActiveSessions:       maxInt(s.settingsCache[settingMaxActiveSessionsKey], defaultMaxActiveSessions),
		LoginLogRetentionDays:   maxInt(s.settingsCache[settingLoginLogRetentionDaysKey], defaultLoginLogRetentionDays),
		SessionRetentionDays:    maxInt(s.settingsCache[settingSessionRetentionDaysKey], defaultSessionRetentionDays),
		SecurityEventEnabled:    s.settingsCache[settingSecurityEventEnabledKey] == 1,
		CaptchaEnabled:          s.settingsCache[settingCaptchaEnabledKey] == 1,
		MFAEnabled:              s.settingsCache[settingMFAEnabledKey] == 1,
		SSOEnabled:              s.settingsCache[settingSSOEnabledKey] == 1,
	}
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

func (s *AuthService) governSessionInventory(now time.Time, policy authRuntimePolicy) error {
	if err := authsession.CleanupInactiveSessions(s.db, now, policy.SessionIdleMinutes); err != nil {
		return err
	}
	return authsession.PurgeHistoricSessions(s.db, now, policy.SessionRetentionDays)
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

func loginSourceIP(sourceKey string) string {
	trimmed := strings.TrimSpace(sourceKey)
	if strings.HasPrefix(trimmed, "ip:") {
		return strings.TrimSpace(strings.TrimPrefix(trimmed, "ip:"))
	}
	return ""
}

type cleanupWindow struct {
	StartedAt time.Time
	EndedAt   time.Time
}

func parseCleanupWindow(startedAt, endedAt, invalidErr string) (*cleanupWindow, error) {
	startedAt = strings.TrimSpace(startedAt)
	endedAt = strings.TrimSpace(endedAt)
	if startedAt == "" && endedAt == "" {
		return nil, nil
	}
	if startedAt == "" || endedAt == "" {
		return nil, errors.New(invalidErr)
	}
	start, err := time.Parse(time.RFC3339, startedAt)
	if err != nil {
		return nil, errors.New(invalidErr)
	}
	end, err := time.Parse(time.RFC3339, endedAt)
	if err != nil {
		return nil, errors.New(invalidErr)
	}
	if end.Before(start) {
		return nil, errors.New(invalidErr)
	}
	return &cleanupWindow{StartedAt: start, EndedAt: end}, nil
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

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func (s *AuthService) issueTokenPair(currentUser *user.SystemUser, roles []string, session *SystemUserSession) (*common.TokenPair, error) {
	accessJTI := uuid.NewString()
	pair, err := common.GenerateTokenPair(currentUser.ID, currentUser.Username, roles, session.SessionID, accessJTI, session.RefreshJTI)
	if err != nil {
		return nil, err
	}
	session.RefreshExpiresAt = pair.RefreshExpiresAt
	return pair, nil
}

func revokeOtherUserSessions(tx *gorm.DB, userID uint64, currentSessionID string) error {
	if strings.TrimSpace(currentSessionID) == "" {
		return nil
	}

	now := time.Now()
	return tx.Model(&SystemUserSession{}).
		Where(otherActiveSessionsByUserWhereClause, userID, currentSessionID).
		Updates(map[string]interface{}{"revoked_at": &now}).Error
}

func truncateString(value string, length int) string {
	if len(value) <= length {
		return value
	}
	return value[:length]
}

func normalizeSessionClientIP(ip string) string {
	ip = strings.TrimSpace(ip)
	if ip == "" {
		return ""
	}
	addr, err := netip.ParseAddr(ip)
	if err != nil {
		return ""
	}
	return addr.String()
}

func normalizeSessionUserAgent(userAgent string) string {
	userAgent = strings.TrimSpace(userAgent)
	if userAgent == "" {
		return ""
	}
	cleaned := strings.Map(func(r rune) rune {
		if unicode.IsPrint(r) {
			return r
		}
		return -1
	}, userAgent)
	return truncateString(cleaned, 255)
}

func mergePermissionKeys(groups ...[]string) []string {
	result := make([]string, 0)
	seen := make(map[string]struct{})
	for _, group := range groups {
		for _, item := range group {
			key := strings.TrimSpace(item)
			if key == "" {
				continue
			}
			if _, ok := seen[key]; ok {
				continue
			}
			seen[key] = struct{}{}
			result = append(result, key)
		}
	}
	return result
}

func buildSessionResp(item SystemUserSession, currentSessionID string) SessionResp {
	clientInfo := parseClientInfo(item.UserAgent)

	return SessionResp{
		SessionID:        item.SessionID,
		IsCurrent:        item.SessionID == currentSessionID,
		LastIP:           item.LastIP,
		Browser:          clientInfo.Browser,
		OS:               clientInfo.OS,
		Device:           clientInfo.Device,
		UserAgent:        clientInfo.UserAgent,
		RefreshExpiresAt: item.RefreshExpiresAt.Format(time.RFC3339),
		LastRefreshAt:    formatNullableTime(item.LastRefreshAt),
		LastActivityAt:   formatNullableTime(item.LastActivityAt),
		RevokedAt:        formatNullableTime(item.RevokedAt),
		CreatedAt:        item.CreatedAt.Format(time.RFC3339),
	}
}

func formatNullableTime(value *time.Time) *string {
	if value == nil {
		return nil
	}
	formatted := value.Format(time.RFC3339)
	return &formatted
}

func normalizePageQuery(page, pageSize int) (int, int) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return page, pageSize
}

func normalizeSecurityEventPageQuery(query *SecurityEventQuery) (int, int) {
	if query == nil {
		return 1, 10
	}
	return normalizePageQuery(query.Page, query.PageSize)
}

func normalizeUint64IDs(ids []uint64) []uint64 {
	if len(ids) == 0 {
		return nil
	}

	seen := make(map[uint64]struct{}, len(ids))
	result := make([]uint64, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		result = append(result, id)
	}
	return result
}

func normalizeSessionIDs(ids []string) []string {
	if len(ids) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(ids))
	result := make([]string, 0, len(ids))
	for _, id := range ids {
		normalized := strings.TrimSpace(id)
		if normalized == "" {
			continue
		}
		if _, ok := seen[normalized]; ok {
			continue
		}
		seen[normalized] = struct{}{}
		result = append(result, normalized)
	}
	return result
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

func queryPageFromAdminSession(query *AdminSessionQuery) int {
	if query == nil {
		return 1
	}
	return query.Page
}

func queryPageSizeFromAdminSession(query *AdminSessionQuery) int {
	if query == nil {
		return 10
	}
	return query.PageSize
}
