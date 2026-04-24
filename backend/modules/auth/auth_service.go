package auth

import (
	"errors"
	"fmt"
	"strconv"
	"sort"
	"strings"
	"time"

	user "pantheon-platform/backend/modules/system/user"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db *gorm.DB
}

type authRuntimePolicy struct {
	PasswordMinLength int
	MaxFailedAttempts int
	LockMinutes       int
}

const (
	defaultPasswordMinLength = 6
	defaultMaxFailedAttempts = 5
	defaultLockMinutes       = 15
)

// NewAuthService 构造函数
func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

// Migrate 初始化认证域表结构，并在 SQLite 开发库中修复历史时间列类型漂移。
func (s *AuthService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	if err := s.db.AutoMigrate(&SystemUserSession{}, &SystemLogLogin{}); err != nil {
		return err
	}
	return repairSQLiteTemporalTables(s.db,
		sqliteTemporalTableRepair{
			tableName: "system_user_session",
			createSQL: `CREATE TABLE system_user_session (
session_id TEXT PRIMARY KEY,
user_id INTEGER NOT NULL,
refresh_jti TEXT NOT NULL,
refresh_expires_at DATETIME NOT NULL,
last_refresh_at DATETIME NULL,
last_ip TEXT NULL,
user_agent TEXT NULL,
revoked_at DATETIME NULL,
created_at DATETIME NULL,
updated_at DATETIME NULL
)`,
			copySQL: `INSERT INTO __pantheon_repair_system_user_session (
session_id, user_id, refresh_jti, refresh_expires_at, last_refresh_at, last_ip, user_agent, revoked_at, created_at, updated_at
)
SELECT
session_id,
user_id,
refresh_jti,
refresh_expires_at,
last_refresh_at,
last_ip,
user_agent,
revoked_at,
created_at,
updated_at
FROM system_user_session`,
			indexSQL: []string{
				"CREATE INDEX idx_system_user_session_user_id ON system_user_session(user_id)",
			},
			columnTypes: map[string]string{
				"refresh_expires_at": "DATETIME",
				"last_refresh_at":    "DATETIME",
				"revoked_at":         "DATETIME",
				"created_at":         "DATETIME",
				"updated_at":         "DATETIME",
			},
		},
		sqliteTemporalTableRepair{
			tableName: "system_log_login",
			createSQL: `CREATE TABLE system_log_login (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT NULL,
ipaddr TEXT NULL,
login_location TEXT NULL,
browser TEXT NULL,
os TEXT NULL,
status INTEGER DEFAULT 1,
msg TEXT NULL,
login_time DATETIME NULL
)`,
			copySQL: `INSERT INTO __pantheon_repair_system_log_login (
id, username, ipaddr, login_location, browser, os, status, msg, login_time
)
SELECT
id,
username,
ipaddr,
login_location,
browser,
os,
status,
msg,
login_time
FROM system_log_login`,
			columnTypes: map[string]string{
				"login_time": "DATETIME",
			},
		},
	)
}

// Authenticate 用户认证
func (s *AuthService) Authenticate(req *LoginReq) (*user.SystemUser, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}
	policy := s.getAuthRuntimePolicy()

	var currentUser user.SystemUser
	result := s.db.Where("username = ?", req.Username).First(&currentUser)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("user.login.error.not_found")
		}
		return nil, result.Error
	}

	if currentUser.Status == 2 {
		return nil, errors.New("user.login.error.disabled")
	}
	if currentUser.LoginLockedUntil != nil && currentUser.LoginLockedUntil.After(time.Now()) {
		return nil, errors.New("user.login.error.locked")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(currentUser.Password), []byte(req.Password)); err != nil {
		locked, markErr := s.recordFailedLoginAttempt(&currentUser, policy)
		if markErr != nil {
			return nil, markErr
		}
		if locked {
			return nil, errors.New("user.login.error.locked")
		}
		return nil, errors.New("user.login.error.password_wrong")
	}
	if err := s.clearFailedLoginState(currentUser.ID); err != nil {
		return nil, err
	}

	return &currentUser, nil
}

// GetUserRoles 获取用户角色标识
func (s *AuthService) GetUserRoles(userID uint64) ([]string, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var roles []string
	err := s.db.Table("system_role").
		Select("system_role.role_key").
		Joins("JOIN system_user_role ON system_user_role.role_id = system_role.id").
		Where("system_user_role.user_id = ? AND system_role.status = ?", userID, 1).
		Pluck("system_role.role_key", &roles).Error
	if err != nil {
		return nil, err
	}
	return roles, nil
}

// GetUserPerms 获取用户按钮/接口权限标识
func (s *AuthService) GetUserPerms(userID uint64) ([]string, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var permissionKeys []string
	err := s.db.Table("system_role_permission").
		Select("DISTINCT system_role_permission.permission_key").
		Joins("JOIN system_user_role ON system_user_role.role_id = system_role_permission.role_id").
		Where("system_user_role.user_id = ? AND system_role_permission.permission_key <> ''", userID).
		Pluck("system_role_permission.permission_key", &permissionKeys).Error
	if err != nil {
		return nil, err
	}
	return mergePermissionKeys(permissionKeys), nil
}

// GetCurrentUserInfo 获取当前登录主体信息
func (s *AuthService) GetCurrentUserInfo(userID uint64) (*UserInfoResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
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
		ID:       currentUser.ID,
		Username: currentUser.Username,
		Nickname: currentUser.Nickname,
		Avatar:   currentUser.Avatar,
		Email:    currentUser.Email,
		Phone:    currentUser.Phone,
		Roles:    roles,
		Perms:    perms,
	}, nil
}

// UpdatePassword 修改当前登录用户密码
func (s *AuthService) UpdatePassword(userID uint64, currentSessionID string, req *PasswordUpdateReq) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}

	oldPassword := strings.TrimSpace(req.OldPassword)
	newPassword := strings.TrimSpace(req.NewPassword)
	if len(newPassword) < s.getAuthRuntimePolicy().PasswordMinLength {
		return errors.New("user.update.error.password_too_short")
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

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&currentUser).Update("password", string(passwordHash)).Error; err != nil {
			return err
		}
		if strings.TrimSpace(currentSessionID) == "" {
			return nil
		}
		now := time.Now()
		return tx.Model(&SystemUserSession{}).
			Where("user_id = ? AND session_id <> ? AND revoked_at IS NULL", userID, currentSessionID).
			Updates(map[string]interface{}{
				"revoked_at": &now,
			}).Error
	})
}

// CreateSession 创建登录会话并签发 token pair
func (s *AuthService) CreateSession(currentUser *user.SystemUser, roles []string, ip string, userAgent string) (*common.TokenPair, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	session := SystemUserSession{
		SessionID:        uuid.NewString(),
		UserID:           currentUser.ID,
		RefreshJTI:       uuid.NewString(),
		RefreshExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		LastIP:           ip,
		UserAgent:        truncateString(userAgent, 255),
	}

	if err := s.db.Create(&session).Error; err != nil {
		return nil, err
	}
	return s.issueTokenPair(currentUser, roles, &session)
}

// RefreshSession 轮换 refresh token 并返回新的 token pair
func (s *AuthService) RefreshSession(claims *common.CustomClaims, ip string, userAgent string) (*common.TokenPair, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var session SystemUserSession
	err := s.db.Where("session_id = ? AND user_id = ?", claims.SessionID, claims.UserID).First(&session).Error
	if err != nil {
		return nil, err
	}
	if session.RevokedAt != nil || session.RefreshExpiresAt.Before(time.Now()) {
		return nil, errors.New("refresh_token.invalid")
	}
	if session.RefreshJTI != claims.ID {
		return nil, errors.New("refresh_token.rotated")
	}

	var currentUser user.SystemUser
	if err := s.db.First(&currentUser, claims.UserID).Error; err != nil {
		return nil, err
	}
	roles, err := s.GetUserRoles(currentUser.ID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	session.RefreshJTI = uuid.NewString()
	session.RefreshExpiresAt = now.Add(7 * 24 * time.Hour)
	session.LastRefreshAt = &now
	session.LastIP = ip
	session.UserAgent = truncateString(userAgent, 255)
	if err := s.db.Save(&session).Error; err != nil {
		return nil, err
	}

	return s.issueTokenPair(&currentUser, roles, &session)
}

// RevokeSession 吊销会话
func (s *AuthService) RevokeSession(sessionID string) error {
	if s.db == nil || sessionID == "" {
		return nil
	}

	now := time.Now()
	return s.db.Model(&SystemUserSession{}).
		Where("session_id = ? AND revoked_at IS NULL", sessionID).
		Updates(map[string]interface{}{"revoked_at": &now}).Error
}

// ListSessions 获取当前用户会话列表
func (s *AuthService) ListSessions(userID uint64, currentSessionID string) ([]SessionResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var sessions []SystemUserSession
	if err := s.db.
		Where("user_id = ? AND revoked_at IS NULL AND refresh_expires_at > ?", userID, time.Now()).
		Order("created_at desc").
		Find(&sessions).Error; err != nil {
		return nil, err
	}

	result := make([]SessionResp, 0, len(sessions))
	for _, item := range sessions {
		result = append(result, buildSessionResp(item, currentSessionID))
	}
	sort.SliceStable(result, func(i, j int) bool {
		return result[i].IsCurrent && !result[j].IsCurrent
	})
	return result, nil
}

// GetSecurityOverview 获取当前账号安全概览
func (s *AuthService) GetSecurityOverview(userID uint64, username string, currentSessionID string) (*SecurityOverviewResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
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
	if err := s.db.Model(&SystemUserSession{}).
		Where("user_id = ? AND revoked_at IS NULL AND refresh_expires_at > ?", userID, time.Now()).
		Count(&activeSessionCount).Error; err != nil {
		return nil, err
	}

	var lastLoginAt *string
	var lastLogin SystemLogLogin
	err = s.db.Where("username = ? AND status = ?", username, 1).
		Order("login_time desc, id desc").
		First(&lastLogin).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if err == nil {
		formatted := lastLogin.LoginTime.Format(time.RFC3339)
		lastLoginAt = &formatted
	}

	return &SecurityOverviewResp{
		User:               info,
		CurrentSession:     currentSession,
		ActiveSessionCount: activeSessionCount,
		LastLoginAt:        lastLoginAt,
	}, nil
}

// RevokeOwnedSession 吊销当前用户的指定会话
func (s *AuthService) RevokeOwnedSession(userID uint64, currentSessionID string, targetSessionID string) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	if strings.TrimSpace(targetSessionID) == "" {
		return errors.New("session.invalid")
	}
	if targetSessionID == currentSessionID {
		return errors.New("auth.session.current_revoke_forbidden")
	}

	var session SystemUserSession
	if err := s.db.Where("session_id = ? AND user_id = ?", targetSessionID, userID).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("session.invalid")
		}
		return err
	}
	if session.RevokedAt != nil {
		return nil
	}

	now := time.Now()
	return s.db.Model(&SystemUserSession{}).
		Where("session_id = ? AND user_id = ? AND revoked_at IS NULL", targetSessionID, userID).
		Updates(map[string]interface{}{"revoked_at": &now}).Error
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
	return s.listLoginLogs(query)
}

func (s *AuthService) ExportLoginLogs(query *LoginLogQuery) (*impexp.CSVFile, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

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

func (s *AuthService) listLoginLogs(query *LoginLogQuery) (*LoginLogPageResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var logs []SystemLogLogin
	db := s.db.Model(&SystemLogLogin{})
	page, pageSize := normalizePageQuery(queryPage(query), queryPageSize(query))
	if query != nil {
		if strings.TrimSpace(query.Username) != "" {
			db = db.Where("username LIKE ?", fmt.Sprintf("%%%s%%", strings.TrimSpace(query.Username)))
		}
		if query.Status != nil && (*query.Status == 0 || *query.Status == 1) {
			db = db.Where("status = ?", *query.Status)
		}
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}
	if err := db.Order("login_time desc, id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&logs).Error; err != nil {
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
		return nil, errors.New("database.not_initialized")
	}

	var logs []SystemLogLogin
	db := s.db.Model(&SystemLogLogin{})
	if query != nil {
		if strings.TrimSpace(query.Username) != "" {
			db = db.Where("username LIKE ?", fmt.Sprintf("%%%s%%", strings.TrimSpace(query.Username)))
		}
		if query.Status != nil && (*query.Status == 0 || *query.Status == 1) {
			db = db.Where("status = ?", *query.Status)
		}
	}
	if err := db.Order("login_time desc, id desc").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

// ListAllSessions 获取管理员会话列表
func (s *AuthService) ListAllSessions(query *AdminSessionQuery) (*AdminSessionPageResp, error) {
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	type sessionRow struct {
		SessionID        string     `gorm:"column:session_id"`
		UserID           uint64     `gorm:"column:user_id"`
		Username         string     `gorm:"column:username"`
		Nickname         string     `gorm:"column:nickname"`
		LastIP           string     `gorm:"column:last_ip"`
		UserAgent        string     `gorm:"column:user_agent"`
		RefreshExpiresAt time.Time  `gorm:"column:refresh_expires_at"`
		LastRefreshAt    *time.Time `gorm:"column:last_refresh_at"`
		RevokedAt        *time.Time `gorm:"column:revoked_at"`
		CreatedAt        time.Time  `gorm:"column:created_at"`
	}

	page, pageSize := normalizePageQuery(queryPageFromAdminSession(query), queryPageSizeFromAdminSession(query))
	db := s.db.Table("system_user_session").
		Select("system_user_session.session_id, system_user_session.user_id, system_user.username, system_user.nickname, system_user_session.last_ip, system_user_session.user_agent, system_user_session.refresh_expires_at, system_user_session.last_refresh_at, system_user_session.revoked_at, system_user_session.created_at").
		Joins("LEFT JOIN system_user ON system_user.id = system_user_session.user_id")
	if query != nil && strings.TrimSpace(query.Username) != "" {
		db = db.Where("system_user.username LIKE ?", fmt.Sprintf("%%%s%%", strings.TrimSpace(query.Username)))
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var rows []sessionRow
	if err := db.Order("system_user_session.created_at desc").Offset((page - 1) * pageSize).Limit(pageSize).Scan(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]AdminSessionResp, 0, len(rows))
	for _, row := range rows {
		clientInfo := parseClientInfo(row.UserAgent)
		items = append(items, AdminSessionResp{
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
			RevokedAt:        formatNullableTime(row.RevokedAt),
			CreatedAt:        row.CreatedAt.Format(time.RFC3339),
		})
	}
	return &AdminSessionPageResp{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

// RevokeAnySession 管理员吊销任意会话
func (s *AuthService) RevokeAnySession(currentSessionID string, targetSessionID string) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	if strings.TrimSpace(targetSessionID) == "" {
		return errors.New("session.invalid")
	}
	if targetSessionID == currentSessionID {
		return errors.New("auth.session.current_revoke_forbidden")
	}

	now := time.Now()
	return s.db.Model(&SystemUserSession{}).
		Where("session_id = ? AND revoked_at IS NULL", targetSessionID).
		Updates(map[string]interface{}{"revoked_at": &now}).Error
}

// RecordLoginLog 记录登录日志
func (s *AuthService) RecordLoginLog(username, ip, browser, os string, status int, msg string) {
	if s.db == nil {
		return
	}

	loginLog := SystemLogLogin{
		Username:      username,
		Ipaddr:        ip,
		Browser:       browser,
		Os:            os,
		Status:        status,
		Msg:           msg,
		LoginTime:     time.Now(),
		LoginLocation: "Local",
	}
	go s.db.Create(&loginLog)
}

func (s *AuthService) getAuthRuntimePolicy() authRuntimePolicy {
	return authRuntimePolicy{
		PasswordMinLength: s.getSettingInt("security.password_min_length", defaultPasswordMinLength),
		MaxFailedAttempts: s.getSettingInt("login.max_failed_attempts", defaultMaxFailedAttempts),
		LockMinutes:       s.getSettingInt("login.lock_minutes", defaultLockMinutes),
	}
}

func (s *AuthService) getSettingInt(settingKey string, fallback int) int {
	if s.db == nil {
		return fallback
	}

	var rawValue string
	err := s.db.Table("system_setting").
		Select("setting_value").
		Where("setting_key = ?", settingKey).
		Limit(1).
		Pluck("setting_value", &rawValue).Error
	if err != nil {
		lowerError := strings.ToLower(err.Error())
		if strings.Contains(lowerError, "no such table") || strings.Contains(lowerError, "doesn't exist") {
			return fallback
		}
		return fallback
	}

	value, err := strconv.Atoi(strings.TrimSpace(rawValue))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

func (s *AuthService) recordFailedLoginAttempt(currentUser *user.SystemUser, policy authRuntimePolicy) (bool, error) {
	if s.db == nil || currentUser == nil {
		return false, errors.New("database.not_initialized")
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

func (s *AuthService) clearFailedLoginState(userID uint64) error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	return s.db.Model(&user.SystemUser{}).
		Where("id = ? AND (failed_login_attempts <> 0 OR login_locked_until IS NOT NULL)", userID).
		Updates(map[string]any{
			"failed_login_attempts": 0,
			"login_locked_until":    nil,
		}).Error
}

func maxInt(a int, b int) int {
	if a > b {
		return a
	}
	return b
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

func truncateString(value string, length int) string {
	if len(value) <= length {
		return value
	}
	return value[:length]
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

func normalizePageQuery(page int, pageSize int) (int, int) {
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

type sqliteTemporalTableRepair struct {
	tableName   string
	createSQL   string
	copySQL     string
	indexSQL    []string
	columnTypes map[string]string
}

func repairSQLiteTemporalTables(db *gorm.DB, repairs ...sqliteTemporalTableRepair) error {
	if db == nil || db.Dialector.Name() != "sqlite" {
		return nil
	}
	for _, repair := range repairs {
		needsRepair, err := sqliteTableNeedsRepair(db, repair.tableName, repair.columnTypes)
		if err != nil || !needsRepair {
			if err != nil {
				return err
			}
			continue
		}
		if err := rebuildSQLiteTable(db, repair); err != nil {
			return err
		}
	}
	return nil
}

func sqliteTableNeedsRepair(db *gorm.DB, tableName string, columnTypes map[string]string) (bool, error) {
	if !db.Migrator().HasTable(tableName) {
		return false, nil
	}
	rows, err := db.Raw(fmt.Sprintf("PRAGMA table_info(%s)", tableName)).Rows()
	if err != nil {
		return false, err
	}
	defer rows.Close()

	seen := make(map[string]bool, len(columnTypes))
	for rows.Next() {
		var cid int
		var name string
		var dataType string
		var notNull int
		var defaultValue interface{}
		var pk int
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &defaultValue, &pk); err != nil {
			return false, err
		}
		expectedType, ok := columnTypes[name]
		if !ok {
			continue
		}
		seen[name] = true
		if !strings.EqualFold(strings.TrimSpace(dataType), expectedType) {
			return true, nil
		}
	}
	for name := range columnTypes {
		if !seen[name] {
			return true, nil
		}
	}
	return false, nil
}

func rebuildSQLiteTable(db *gorm.DB, repair sqliteTemporalTableRepair) error {
	tempTableName := "__pantheon_repair_" + repair.tableName
	statements := []string{
		fmt.Sprintf("DROP TABLE IF EXISTS %s", tempTableName),
		strings.Replace(repair.createSQL, repair.tableName, tempTableName, 1),
	}
	if db.Migrator().HasTable(repair.tableName) {
		statements = append(statements, repair.copySQL)
		statements = append(statements,
			fmt.Sprintf("DROP TABLE %s", repair.tableName),
			fmt.Sprintf("ALTER TABLE %s RENAME TO %s", tempTableName, repair.tableName),
		)
	} else {
		statements = append(statements,
			fmt.Sprintf("ALTER TABLE %s RENAME TO %s", tempTableName, repair.tableName),
		)
	}
	statements = append(statements, repair.indexSQL...)

	return db.Transaction(func(tx *gorm.DB) error {
		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
