package auth

// LoginReq 登录请求 DTO
type LoginReq struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RefreshTokenReq 刷新令牌请求 DTO
type RefreshTokenReq struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// PasswordUpdateReq 当前登录用户修改密码请求 DTO
type PasswordUpdateReq struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

// UserInfoResp 当前登录主体信息 DTO
type UserInfoResp struct {
	ID       uint64   `json:"id"`
	Username string   `json:"username"`
	Nickname string   `json:"nickname"`
	Avatar   string   `json:"avatar"`
	Email    string   `json:"email"`
	Phone    string   `json:"phone"`
	Roles    []string `json:"roles"`
	Perms    []string `json:"perms"`
}

type ClientInfoResp struct {
	Browser   string `json:"browser"`
	OS        string `json:"os"`
	Device    string `json:"device"`
	UserAgent string `json:"userAgent"`
}

// AuthTokenResp 认证返回 DTO
type AuthTokenResp struct {
	Token            string        `json:"token"`
	AccessToken      string        `json:"accessToken"`
	RefreshToken     string        `json:"refreshToken"`
	TokenType        string        `json:"tokenType"`
	AccessExpiresAt  string        `json:"accessExpiresAt"`
	RefreshExpiresAt string        `json:"refreshExpiresAt"`
	SessionID        string        `json:"sessionId"`
	User             *UserInfoResp `json:"user"`
}

// SessionResp 当前用户会话信息 DTO
type SessionResp struct {
	SessionID        string  `json:"sessionId"`
	IsCurrent        bool    `json:"isCurrent"`
	LastIP           string  `json:"lastIp"`
	Browser          string  `json:"browser"`
	OS               string  `json:"os"`
	Device           string  `json:"device"`
	UserAgent        string  `json:"userAgent"`
	RefreshExpiresAt string  `json:"refreshExpiresAt"`
	LastRefreshAt    *string `json:"lastRefreshAt"`
	RevokedAt        *string `json:"revokedAt"`
	CreatedAt        string  `json:"createdAt"`
}

type SecurityOverviewResp struct {
	User               *UserInfoResp `json:"user"`
	CurrentSession     *SessionResp  `json:"currentSession"`
	ActiveSessionCount int64         `json:"activeSessionCount"`
	LastLoginAt        *string       `json:"lastLoginAt"`
}

// LoginLogQuery 登录日志查询
type LoginLogQuery struct {
	Username string `form:"username" json:"username"`
	Status   *int   `form:"status" json:"status"`
	Page     int    `form:"page" json:"page"`
	PageSize int    `form:"pageSize" json:"pageSize"`
}

// LoginLogResp 登录日志 DTO
type LoginLogResp struct {
	ID            uint64 `json:"id"`
	Username      string `json:"username"`
	Ipaddr        string `json:"ipaddr"`
	LoginLocation string `json:"loginLocation"`
	Browser       string `json:"browser"`
	Os            string `json:"os"`
	Status        int    `json:"status"`
	Msg           string `json:"msg"`
	LoginTime     string `json:"loginTime"`
}

type LoginLogPageResp struct {
	Items    []LoginLogResp `json:"items"`
	Total    int64          `json:"total"`
	Page     int            `json:"page"`
	PageSize int            `json:"pageSize"`
}

// AdminSessionQuery 管理员会话查询
type AdminSessionQuery struct {
	Username string `form:"username" json:"username"`
	Page     int    `form:"page" json:"page"`
	PageSize int    `form:"pageSize" json:"pageSize"`
}

// AdminSessionResp 管理员会话 DTO
type AdminSessionResp struct {
	SessionID        string  `json:"sessionId"`
	UserID           uint64  `json:"userId"`
	Username         string  `json:"username"`
	Nickname         string  `json:"nickname"`
	LastIP           string  `json:"lastIp"`
	Browser          string  `json:"browser"`
	OS               string  `json:"os"`
	Device           string  `json:"device"`
	UserAgent        string  `json:"userAgent"`
	RefreshExpiresAt string  `json:"refreshExpiresAt"`
	LastRefreshAt    *string `json:"lastRefreshAt"`
	RevokedAt        *string `json:"revokedAt"`
	CreatedAt        string  `json:"createdAt"`
}

type AdminSessionPageResp struct {
	Items    []AdminSessionResp `json:"items"`
	Total    int64              `json:"total"`
	Page     int                `json:"page"`
	PageSize int                `json:"pageSize"`
}
