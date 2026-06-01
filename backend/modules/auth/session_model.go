package auth

import "time"

// SystemUserSession 登录会话模型
type SystemUserSession struct {
	SessionID        string     `gorm:"primaryKey;size:64" json:"sessionId"`
	UserID           uint64     `gorm:"index;not null;index:idx_system_user_session_user_revoked,priority:1" json:"userId"`
	RefreshJTI       string     `gorm:"size:64;not null" json:"refreshJti"`
	RefreshExpiresAt time.Time  `json:"refreshExpiresAt"`
	LastRefreshAt    *time.Time `json:"lastRefreshAt"`
	LastActivityAt   *time.Time `json:"lastActivityAt"`
	LastIP           string     `gorm:"size:128" json:"lastIp"`
	UserAgent        string     `gorm:"size:255" json:"userAgent"`
	RevokedAt        *time.Time `gorm:"index:idx_system_user_session_user_revoked,priority:2" json:"revokedAt"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

func (SystemUserSession) TableName() string {
	return "system_user_session"
}
