package auth

import (
	"context"
	"errors"
	"net/netip"
	"sort"
	"strings"
	"time"
	"unicode"

	user "pantheon-platform/backend/modules/system/iam/user"
	"pantheon-platform/backend/pkg/authsession"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/database"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (s *AuthService) CreateSession(currentUser *user.SystemUser, roles []string, ip, userAgent string) (*common.TokenPair, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}
	policy := s.getAuthRuntimePolicy()
	now := time.Now()
	if err := s.governSessionInventory(now, policy); err != nil {
		return nil, err
	}
	if err := authsession.CleanupUserOverflowSessions(s.db, currentUser.ID, now, policy.SessionIdleMinutes, maxInt(policy.MaxActiveSessions-1, 0)); err != nil {
		return nil, err
	}

	session := SystemUserSession{
		SessionID:        uuid.NewString(),
		UserID:           currentUser.ID,
		RefreshJTI:       uuid.NewString(),
		RefreshExpiresAt: now.Add(common.RefreshTokenTTL),
		LastActivityAt:   &now,
		LastIP:           ip,
		UserAgent:        truncateString(userAgent, 255),
	}

	if err := s.db.Create(&session).Error; err != nil {
		return nil, err
	}
	return s.issueTokenPair(currentUser, roles, &session)
}

func (s *AuthService) RefreshSession(sessionID string, userID uint64, ip, userAgent string) (*common.TokenPair, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	var session SystemUserSession
	err := s.db.Where(sessionIDAndUserIDWhereClause, sessionID, userID).First(&session).Error
	if err != nil {
		return nil, err
	}
	if session.RevokedAt != nil || session.RefreshExpiresAt.Before(time.Now()) {
		return nil, errors.New("refresh_token.invalid")
	}

	var currentUser user.SystemUser
	if err := s.db.First(&currentUser, userID).Error; err != nil {
		return nil, err
	}
	roles, err := s.GetUserRoles(currentUser.ID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	session.RefreshJTI = uuid.NewString()
	session.RefreshExpiresAt = now.Add(common.RefreshTokenTTL)
	session.LastRefreshAt = &now
	session.LastActivityAt = &now
	session.LastIP = ip
	session.UserAgent = truncateString(userAgent, 255)
	if err := s.db.Save(&session).Error; err != nil {
		return nil, err
	}

	return s.issueTokenPair(&currentUser, roles, &session)
}

func (s *AuthService) RevokeSession(sessionID string) error {
	if s.db == nil || sessionID == "" {
		return nil
	}

	now := time.Now()
	return s.db.Model(&SystemUserSession{}).
		Where("session_id = ? AND revoked_at IS NULL", sessionID).
		Updates(map[string]interface{}{"revoked_at": &now}).Error
}

func (s *AuthService) TouchSessionActivity(sessionID string, userID uint64, ip, userAgent string) error {
	if s.db == nil || strings.TrimSpace(sessionID) == "" || userID == 0 {
		return nil
	}

	now := time.Now()
	clientIP := normalizeSessionClientIP(ip)
	agent := normalizeSessionUserAgent(userAgent)

	return s.db.Exec(
		touchSessionActivitySQL,
		now,
		clientIP,
		clientIP,
		agent,
		agent,
		sessionID,
		userID,
		now.Add(-1*time.Minute),
	).Error
}

func (s *AuthService) ListSessions(userID uint64, currentSessionID string) ([]SessionResp, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	now := time.Now()
	policy := s.getAuthRuntimePolicy()
	if err := s.governSessionInventory(now, policy); err != nil {
		return nil, err
	}

	var sessions []SystemUserSession
	if err := authsession.ApplyActiveScope(s.db, "", now, policy.SessionIdleMinutes).
		Where(userIDWhereClause, userID).
		Order("created_at desc").
		Find(&sessions).Error; err != nil {
		return nil, err
	}

	result := make([]SessionResp, 0, len(sessions))
	for _, item := range sessions {
		result = append(result, buildSessionResp(item, currentSessionID))
	}
	sort.SliceStable(result, func(i, j int) bool {
		if result[i].IsCurrent != result[j].IsCurrent {
			return result[i].IsCurrent
		}
		return result[i].CreatedAt > result[j].CreatedAt
	})
	return result, nil
}

func (s *AuthService) RevokeOwnedSession(userID uint64, currentSessionID, targetSessionID string) error {
	if s.db == nil {
		return common.ErrDatabaseNotInitialized
	}
	if strings.TrimSpace(targetSessionID) == "" {
		return errors.New(errSessionInvalid)
	}
	if targetSessionID == currentSessionID {
		return errors.New(errCurrentSessionRevokeForbidden)
	}

	var session SystemUserSession
	if err := s.db.Where(sessionIDAndUserIDWhereClause, targetSessionID, userID).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New(errSessionInvalid)
		}
		return err
	}
	if session.RevokedAt != nil {
		return nil
	}

	now := time.Now()
	return s.db.Model(&SystemUserSession{}).
		Where(sessionIDAndActiveUserIDWhereClause, targetSessionID, userID).
		Updates(map[string]interface{}{"revoked_at": &now}).Error
}

func (s *AuthService) CleanupHistoricSessions(retentionDays int, startedAt, endedAt string) (int64, error) {
	if s.db == nil {
		return 0, common.ErrDatabaseNotInitialized
	}
	window, err := parseCleanupWindow(startedAt, endedAt, "auth.session.cleanup.range_invalid")
	if err != nil {
		return 0, err
	}

	now := time.Now()
	policy := s.getAuthRuntimePolicy()
	if err := s.governSessionInventory(now, policy); err != nil {
		return 0, err
	}

	db := s.db.Table("system_user_session").Where("revoked_at IS NOT NULL")
	if window != nil {
		db = db.Where("revoked_at >= ? AND revoked_at <= ?", window.StartedAt, window.EndedAt)
	} else {
		if !s.isAllowedSessionCleanupRetentionDays(retentionDays) {
			return 0, errors.New("auth.session.cleanup.days_invalid")
		}
		cutoff := now.AddDate(0, 0, -retentionDays)
		db = db.Where("revoked_at < ?", cutoff)
	}
	result := db.Delete(nil)
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func (s *AuthService) BatchRevokeSessions(currentSessionID string, sessionIDs []string) (int64, error) {
	if s.db == nil {
		return 0, common.ErrDatabaseNotInitialized
	}

	normalized := normalizeSessionIDs(sessionIDs)
	if len(normalized) == 0 {
		return 0, errors.New(errSessionInvalid)
	}
	for _, sessionID := range normalized {
		if sessionID == currentSessionID {
			return 0, errors.New(errCurrentSessionRevokeForbidden)
		}
	}

	now := time.Now()
	result := s.db.Model(&SystemUserSession{}).
		Where("session_id IN ? AND revoked_at IS NULL", normalized).
		Updates(map[string]interface{}{"revoked_at": &now})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func (s *AuthService) ListAllSessions(query *AdminSessionQuery) (*AdminSessionPageResp, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	now := time.Now()
	policy := s.getAuthRuntimePolicy()
	if err := s.governSessionInventory(now, policy); err != nil {
		return nil, err
	}

	page, pageSize := normalizePageQuery(queryPageFromAdminSession(query), queryPageSizeFromAdminSession(query))
	db := s.db.Table("system_user_session").
		Select("system_user_session.session_id, system_user_session.user_id, system_user.username, system_user.nickname, system_user_session.last_ip, system_user_session.user_agent, system_user_session.refresh_expires_at, system_user_session.last_refresh_at, system_user_session.last_activity_at, system_user_session.revoked_at, system_user_session.created_at").
		Joins("LEFT JOIN system_user ON system_user.id = system_user_session.user_id")
	db = applyAdminSessionFilters(db, query, now, policy)

	var rows []adminSessionRow
	if err := db.Order("system_user_session.created_at desc").Scan(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]AdminSessionResp, 0, len(rows))
	var activeCount int64
	var revokedCount int64
	for _, row := range rows {
		clientInfo := parseClientInfo(row.UserAgent)
		if !matchesAdminSessionFilters(query, clientInfo) {
			continue
		}
		if row.RevokedAt == nil {
			activeCount++
		} else {
			revokedCount++
		}
		items = append(items, buildAdminSessionResp(row, clientInfo))
	}

	total := int64(len(items))
	start := (page - 1) * pageSize
	if start > len(items) {
		start = len(items)
	}
	end := start + pageSize
	if end > len(items) {
		end = len(items)
	}

	return &AdminSessionPageResp{
		Items:        items[start:end],
		Total:        total,
		ActiveCount:  activeCount,
		RevokedCount: revokedCount,
		Page:         page,
		PageSize:     pageSize,
	}, nil
}

func (s *AuthService) RevokeAnySession(currentSessionID, targetSessionID string) error {
	if s.db == nil {
		return common.ErrDatabaseNotInitialized
	}
	if strings.TrimSpace(targetSessionID) == "" {
		return errors.New(errSessionInvalid)
	}
	if targetSessionID == currentSessionID {
		return errors.New(errCurrentSessionRevokeForbidden)
	}

	now := time.Now()
	return s.db.Model(&SystemUserSession{}).
		Where("session_id = ? AND revoked_at IS NULL", targetSessionID).
		Updates(map[string]interface{}{"revoked_at": &now}).Error
}

func (s *AuthService) governSessionInventory(now time.Time, policy authRuntimePolicy) error {
	if err := authsession.CleanupInactiveSessions(s.db, now, policy.SessionIdleMinutes); err != nil {
		return err
	}
	return authsession.PurgeHistoricSessions(s.db, now, policy.SessionRetentionDays)
}

func (s *AuthService) issueTokenPair(currentUser *user.SystemUser, roles []string, session *SystemUserSession) (*common.TokenPair, error) {
	accessToken := common.NewAccessToken()
	refreshToken := common.NewRefreshToken()

	now := time.Now()
	accessTTL := common.AccessTokenTTL
	refreshTTL := common.RefreshTokenTTL

	accessData := &common.TokenSessionData{
		UserID:         currentUser.ID,
		Username:       currentUser.Username,
		RoleKeys:       roles,
		SessionID:      session.SessionID,
		LastActivityAt: now.Unix(),
	}
	if err := common.TokenStoreSession(context.Background(), database.RDB, accessToken, accessData, accessTTL); err != nil {
		return nil, err
	}

	if err := common.TokenStoreRefresh(context.Background(), database.RDB, refreshToken, currentUser.ID, session.SessionID, refreshTTL); err != nil {
		return nil, err
	}

	session.RefreshExpiresAt = now.Add(refreshTTL)

	return &common.TokenPair{
		AccessToken:      accessToken,
		RefreshToken:     refreshToken,
		TokenType:        common.TokenTypeAccess,
		AccessExpiresAt:  now.Add(accessTTL),
		RefreshExpiresAt: now.Add(refreshTTL),
		SessionID:        session.SessionID,
	}, nil
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

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
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
