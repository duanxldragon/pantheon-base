package middleware

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/database"

	"github.com/gin-gonic/gin"
)

// JWTAuthMiddleware 权限校验中间件
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			common.Fail(c, common.CodeUnauthorized, "token.missing")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			common.Fail(c, common.CodeUnauthorized, "token.format.error")
			c.Abort()
			return
		}

		claims, err := common.ParseToken(parts[1], common.TokenTypeAccess)
		if err != nil {
			switch {
			case errors.Is(err, common.ErrTokenExpired):
				common.Fail(c, common.CodeUnauthorized, "token.expired")
			case errors.Is(err, common.ErrTokenType):
				common.Fail(c, common.CodeUnauthorized, "token.type.invalid")
			default:
				common.Fail(c, common.CodeUnauthorized, "token.invalid")
			}
			c.Abort()
			return
		}

		if database.RDB != nil {
			key := fmt.Sprintf("blacklist:%d", claims.UserID)
			val, _ := database.RDB.Get(context.Background(), key).Result()
			if val != "" {
				common.Fail(c, common.CodeUnauthorized, "token.expired.force")
				c.Abort()
				return
			}
		}

		if database.DB != nil && claims.SessionID != "" {
			var count int64
			err := database.DB.Table("system_user_session").
				Where("session_id = ? AND user_id = ? AND revoked_at IS NULL AND refresh_expires_at > ?", claims.SessionID, claims.UserID, time.Now()).
				Count(&count).Error
			if err != nil || count == 0 {
				common.Fail(c, common.CodeUnauthorized, "session.invalid")
				c.Abort()
				return
			}
		}

		c.Set("userId", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("roleKeys", claims.RoleKeys)
		c.Set("sessionId", claims.SessionID)
		if len(claims.RoleKeys) > 0 {
			c.Set("roleKey", claims.RoleKeys[0])
		}

		c.Next()
	}
}
