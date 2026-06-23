package middleware

import (
	"pantheon-platform/backend/pkg/logging"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// StructuredLoggingMiddleware 结构化日志中间件
func StructuredLoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		end := time.Now()
		latency := end.Sub(start)

		if len(c.Errors) > 0 {
			// 记录错误
			for _, e := range c.Errors.Errors() {
				logging.Error("HTTP Request Error",
					zap.String("method", c.Request.Method),
					zap.String("path", path),
					zap.String("query", query),
					zap.Int("status", c.Writer.Status()),
					zap.Duration("latency", latency),
					zap.String("ip", c.ClientIP()),
					zap.String("user_agent", c.Request.UserAgent()),
					zap.String("error", e),
				)
			}
		} else {
			// 记录正常请求
			logging.Info("HTTP Request",
				zap.String("method", c.Request.Method),
				zap.String("path", path),
				zap.String("query", query),
				zap.Int("status", c.Writer.Status()),
				zap.Duration("latency", latency),
				zap.String("ip", c.ClientIP()),
				zap.String("user_agent", c.Request.UserAgent()),
			)
		}
	}
}
