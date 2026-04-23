package auth

import (
	"errors"
	"time"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service *AuthService
}

const timeFormat = time.RFC3339

func NewAuthHandler(s *AuthService) *AuthHandler {
	return &AuthHandler{service: s}
}

// LoginHandler 登录接口处理
func (h *AuthHandler) LoginHandler(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	clientInfo := parseClientInfo(c.Request.UserAgent())

	currentUser, err := h.service.Authenticate(&req)
	if err != nil {
		h.service.RecordLoginLog(req.Username, c.ClientIP(), clientInfo.Browser, clientInfo.OS, 0, err.Error())
		common.Fail(c, common.CodeUnauthorized, err.Error())
		return
	}

	h.service.RecordLoginLog(currentUser.Username, c.ClientIP(), clientInfo.Browser, clientInfo.OS, 1, "auth.loginSuccess")

	roles, err := h.service.GetUserRoles(currentUser.ID)
	if err != nil {
		common.Fail(c, common.CodeError, "role.fetch.error")
		return
	}
	perms, err := h.service.GetUserPerms(currentUser.ID)
	if err != nil {
		common.Fail(c, common.CodeError, "perm.fetch.error")
		return
	}

	tokenPair, err := h.service.CreateSession(currentUser, roles, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		common.Fail(c, common.CodeError, "token.generate.fail")
		return
	}

	common.Success(c, AuthTokenResp{
		Token:            tokenPair.AccessToken,
		AccessToken:      tokenPair.AccessToken,
		RefreshToken:     tokenPair.RefreshToken,
		TokenType:        tokenPair.TokenType,
		AccessExpiresAt:  tokenPair.AccessExpiresAt.Format(timeFormat),
		RefreshExpiresAt: tokenPair.RefreshExpiresAt.Format(timeFormat),
		SessionID:        tokenPair.SessionID,
		User: &UserInfoResp{
			ID:       currentUser.ID,
			Username: currentUser.Username,
			Nickname: currentUser.Nickname,
			Avatar:   currentUser.Avatar,
			Email:    currentUser.Email,
			Phone:    currentUser.Phone,
			Roles:    roles,
			Perms:    perms,
		},
	})
}

// RefreshTokenHandler 刷新 access token
func (h *AuthHandler) RefreshTokenHandler(c *gin.Context) {
	var req RefreshTokenReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	claims, err := common.ParseToken(req.RefreshToken, common.TokenTypeRefresh)
	if err != nil {
		if errors.Is(err, common.ErrTokenExpired) {
			common.Fail(c, common.CodeUnauthorized, "refresh_token.expired")
			return
		}
		common.Fail(c, common.CodeUnauthorized, "refresh_token.invalid")
		return
	}

	tokenPair, err := h.service.RefreshSession(claims, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		common.Fail(c, common.CodeUnauthorized, err.Error())
		return
	}

	common.Success(c, gin.H{
		"token":            tokenPair.AccessToken,
		"accessToken":      tokenPair.AccessToken,
		"refreshToken":     tokenPair.RefreshToken,
		"tokenType":        tokenPair.TokenType,
		"accessExpiresAt":  tokenPair.AccessExpiresAt.Format(timeFormat),
		"refreshExpiresAt": tokenPair.RefreshExpiresAt.Format(timeFormat),
		"sessionId":        tokenPair.SessionID,
	})
}

// LogoutHandler 注销当前会话
func (h *AuthHandler) LogoutHandler(c *gin.Context) {
	sessionID, _ := c.Get("sessionId")
	if sessionIDString, ok := sessionID.(string); ok {
		_ = h.service.RevokeSession(sessionIDString)
	}
	common.Success(c, gin.H{"loggedOut": true})
}

// GetCurrentUserInfo 获取当前登录主体信息
func (h *AuthHandler) GetCurrentUserInfo(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		common.Fail(c, common.CodeUnauthorized, "token.invalid")
		return
	}

	info, err := h.service.GetCurrentUserInfo(userID)
	if err != nil {
		common.Fail(c, common.CodeError, "user.info.error")
		return
	}
	common.Success(c, info)
}

// GetSecurityOverview 获取当前账号安全概览
func (h *AuthHandler) GetSecurityOverview(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		common.Fail(c, common.CodeUnauthorized, "token.invalid")
		return
	}

	usernameValue, _ := c.Get("username")
	username, _ := usernameValue.(string)
	sessionID, _ := c.Get("sessionId")
	currentSessionID, _ := sessionID.(string)

	info, err := h.service.GetSecurityOverview(userID, username, currentSessionID)
	if err != nil {
		common.Fail(c, common.CodeError, "auth.security.overview.error")
		return
	}
	common.Success(c, info)
}

// UpdatePassword 修改当前登录用户密码
func (h *AuthHandler) UpdatePassword(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		common.Fail(c, common.CodeUnauthorized, "token.invalid")
		return
	}

	var req PasswordUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	sessionID, _ := c.Get("sessionId")
	currentSessionID, _ := sessionID.(string)
	if err := h.service.UpdatePassword(userID, currentSessionID, &req); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"passwordUpdated": true})
}

// GetSessions 获取当前用户会话列表
func (h *AuthHandler) GetSessions(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		common.Fail(c, common.CodeUnauthorized, "token.invalid")
		return
	}

	sessionID, _ := c.Get("sessionId")
	currentSessionID, _ := sessionID.(string)
	sessions, err := h.service.ListSessions(userID, currentSessionID)
	if err != nil {
		common.Fail(c, common.CodeError, "auth.session.list.error")
		return
	}
	common.Success(c, sessions)
}

// RevokeSession 吊销指定会话
func (h *AuthHandler) RevokeSession(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		common.Fail(c, common.CodeUnauthorized, "token.invalid")
		return
	}

	sessionID, _ := c.Get("sessionId")
	currentSessionID, _ := sessionID.(string)
	targetSessionID := c.Param("id")
	if err := h.service.RevokeOwnedSession(userID, currentSessionID, targetSessionID); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"revoked": true})
}

// GetOwnLoginLogs 获取当前用户登录日志
func (h *AuthHandler) GetOwnLoginLogs(c *gin.Context) {
	usernameValue, ok := c.Get("username")
	if !ok {
		common.Fail(c, common.CodeUnauthorized, "token.invalid")
		return
	}
	username, _ := usernameValue.(string)

	var query LoginLogQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	page, err := h.service.ListOwnLoginLogs(username, &query)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, page)
}

// GetLoginLogList 管理员查询登录日志
func (h *AuthHandler) GetLoginLogList(c *gin.Context) {
	var query LoginLogQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	page, err := h.service.ListLoginLogs(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "auth.login_log.list.error")
		return
	}
	common.Success(c, page)
}

func (h *AuthHandler) ExportLoginLogs(c *gin.Context) {
	common.SetAuditMetadata(c, "导出登录日志", common.BusinessExport)

	var query LoginLogQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	file, err := h.service.ExportLoginLogs(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "auth.login_log.export.error")
		return
	}
	if err := impexp.WriteCSV(c, *file); err != nil {
		common.Fail(c, common.CodeError, "auth.login_log.export.error")
	}
}

// GetSessionList 管理员查询全局会话
func (h *AuthHandler) GetSessionList(c *gin.Context) {
	var query AdminSessionQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}
	page, err := h.service.ListAllSessions(&query)
	if err != nil {
		common.Fail(c, common.CodeError, "auth.session.list.error")
		return
	}
	common.Success(c, page)
}

// RevokeAnySession 管理员吊销任意会话
func (h *AuthHandler) RevokeAnySession(c *gin.Context) {
	sessionID, _ := c.Get("sessionId")
	currentSessionID, _ := sessionID.(string)
	targetSessionID := c.Param("id")
	if err := h.service.RevokeAnySession(currentSessionID, targetSessionID); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"revoked": true})
}

func getUserIDFromContext(c *gin.Context) (uint64, bool) {
	userIDValue, ok := c.Get("userId")
	if !ok {
		return 0, false
	}
	userID, ok := userIDValue.(uint64)
	return userID, ok
}
