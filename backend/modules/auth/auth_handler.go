package auth

import (
	"strings"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/impexp"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service *AuthService
}

func NewAuthHandler(s *AuthService) *AuthHandler {
	return &AuthHandler{service: s}
}

func (h *AuthHandler) LoginHandler(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, err.Error())
		return
	}

	ip := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	clientInfo := parseClientInfo(userAgent)

	sourceKey := buildLoginSourceKey(ip)
	currentUser, err := h.service.LoginWithSource(&req, sourceKey)
	if err != nil {
		h.service.RecordLoginLog(common.GetRequestID(c), strings.TrimSpace(req.Username), ip, clientInfo.Browser, clientInfo.OS, 0, err.Error())
		common.Fail(c, common.CodeUnauthorized, err.Error())
		return
	}

	roles, err := h.service.GetUserRoles(currentUser.ID)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}

	tokenPair, err := h.service.CreateSession(currentUser, roles, ip, userAgent)
	if err != nil {
		h.service.RecordLoginLog(common.GetRequestID(c), currentUser.Username, ip, clientInfo.Browser, clientInfo.OS, 0, err.Error())
		common.Fail(c, common.CodeError, err.Error())
		return
	}

	userInfo, err := h.service.GetCurrentUserInfo(currentUser.ID)
	if err != nil {
		h.service.RecordLoginLog(common.GetRequestID(c), currentUser.Username, ip, clientInfo.Browser, clientInfo.OS, 0, err.Error())
		common.Fail(c, common.CodeError, err.Error())
		return
	}

	h.service.RecordLoginLog(common.GetRequestID(c), currentUser.Username, ip, clientInfo.Browser, clientInfo.OS, 1, "auth.loginSuccess")

	common.Success(c, AuthTokenResp{
		Token:            tokenPair.AccessToken,
		AccessToken:      tokenPair.AccessToken,
		RefreshToken:     tokenPair.RefreshToken,
		TokenType:        tokenPair.TokenType,
		AccessExpiresAt:  tokenPair.AccessExpiresAt.Format("2006-01-02 15:04:05"),
		RefreshExpiresAt: tokenPair.RefreshExpiresAt.Format("2006-01-02 15:04:05"),
		SessionID:        tokenPair.SessionID,
		User:             userInfo,
	})
}

func (h *AuthHandler) RefreshTokenHandler(c *gin.Context) {
	var req RefreshTokenReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, err.Error())
		return
	}

	claims, err := common.ParseToken(req.RefreshToken, common.TokenTypeRefresh)
	if err != nil {
		common.Fail(c, common.CodeUnauthorized, err.Error())
		return
	}

	tokenPair, err := h.service.RefreshSession(claims, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		common.Fail(c, common.CodeUnauthorized, err.Error())
		return
	}

	common.Success(c, gin.H{
		"token":            tokenPair.AccessToken,
		"accessToken":      tokenPair.AccessToken,
		"refreshToken":     tokenPair.RefreshToken,
		"tokenType":        tokenPair.TokenType,
		"accessExpiresAt":  tokenPair.AccessExpiresAt.Format("2006-01-02 15:04:05"),
		"refreshExpiresAt": tokenPair.RefreshExpiresAt.Format("2006-01-02 15:04:05"),
		"sessionId":        tokenPair.SessionID,
	})
}
func (h *AuthHandler) GetCurrentUserInfo(c *gin.Context) {
	resp, err := h.service.GetCurrentUserInfo(common.GetUserID(c))
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, resp)
}
func (h *AuthHandler) UpdatePassword(c *gin.Context) {
	var req PasswordUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, err.Error())
		return
	}
	if err := h.service.UpdatePassword(common.GetUserID(c), c.GetString("sessionId"), &req); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"passwordUpdated": true})
}
func (h *AuthHandler) GetLoginLogList(c *gin.Context) {
	var query LoginLogQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, err.Error())
		return
	}
	resp, err := h.service.ListLoginLogs(&query)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, resp)
}
func (h *AuthHandler) ExportLoginLogs(c *gin.Context) {
	common.SetAuditMetadata(c, "audit.login_log.export.title", common.BusinessExport)

	var query LoginLogQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, err.Error())
		return
	}
	file, err := h.service.ExportLoginLogs(&query)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	if err := impexp.WriteCSV(c, *file); err != nil {
		common.Fail(c, common.CodeError, err.Error())
	}
}

func (h *AuthHandler) CleanupLoginLogs(c *gin.Context) {
	common.SetAuditMetadata(c, "audit.login_log.cleanup.title", common.BusinessClean)

	var req LoginLogCleanupReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	clearedCount, err := h.service.CleanupLoginLogs(req.RetentionDays)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, LoginLogCleanupResp{ClearedCount: clearedCount})
}

func (h *AuthHandler) CleanupHistoricSessions(c *gin.Context) {
	common.SetAuditMetadata(c, "auth.session.cleanup.title", common.BusinessClean)

	var req SessionCleanupReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	clearedCount, err := h.service.CleanupHistoricSessions(req.RetentionDays)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, SessionCleanupResp{ClearedCount: clearedCount})
}

func (h *AuthHandler) BatchDeleteLoginLogs(c *gin.Context) {
	common.SetAuditMetadata(c, "audit.login_log.batch_delete.title", common.BusinessDelete)

	var req LoginLogBatchDeleteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, "param.invalid")
		return
	}

	deletedCount, err := h.service.BatchDeleteLoginLogs(req.IDs)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"deletedCount": deletedCount})
}
func (h *AuthHandler) GetSessionList(c *gin.Context) {
	var query AdminSessionQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, err.Error())
		return
	}
	resp, err := h.service.ListAllSessions(&query)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, resp)
}
func (h *AuthHandler) RevokeAnySession(c *gin.Context) {
	common.SetAuditMetadata(c, "auth.session.revoke.title", common.BusinessForce)

	if err := h.service.RevokeAnySession(c.GetString("sessionId"), strings.TrimSpace(c.Param("id"))); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"revoked": true})
}
func (h *AuthHandler) GetSecurityOverview(c *gin.Context) {
	resp, err := h.service.GetSecurityOverview(common.GetUserID(c), c.GetString("username"), c.GetString("sessionId"))
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, resp)
}

func (h *AuthHandler) VerifyOperationPassword(c *gin.Context) {
	var req struct {
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.CodeParamInvalid, err.Error())
		return
	}
	token, err := h.service.VerifyPasswordForOperation(common.GetUserID(c), req.Password)
	if err != nil {
		common.Fail(c, common.CodeUnauthorized, err.Error())
		return
	}
	common.Success(c, gin.H{"operationToken": token})
}

func (h *AuthHandler) TouchActivity(c *gin.Context) {
	if err := h.service.TouchSessionActivity(c.GetString("sessionId"), common.GetUserID(c), c.ClientIP(), c.GetHeader("User-Agent")); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"touched": true})
}

func (h *AuthHandler) LogoutHandler(c *gin.Context) {
	if err := h.service.RevokeSession(c.GetString("sessionId")); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"loggedOut": true})
}
func (h *AuthHandler) GetSessions(c *gin.Context) {
	resp, err := h.service.ListSessions(common.GetUserID(c), c.GetString("sessionId"))
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, resp)
}
func (h *AuthHandler) RevokeSession(c *gin.Context) {
	if err := h.service.RevokeSession(strings.TrimSpace(c.Param("id"))); err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, gin.H{"revoked": true})
}
func (h *AuthHandler) GetOwnLoginLogs(c *gin.Context) {
	var query LoginLogQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		common.Fail(c, common.CodeParamInvalid, err.Error())
		return
	}
	resp, err := h.service.ListOwnLoginLogs(c.GetString("username"), &query)
	if err != nil {
		common.Fail(c, common.CodeError, err.Error())
		return
	}
	common.Success(c, resp)
}

func buildLoginSourceKey(ip string) string {
	trimmed := strings.TrimSpace(ip)
	if trimmed == "" {
		return "ip:unknown"
	}
	return "ip:" + trimmed
}
