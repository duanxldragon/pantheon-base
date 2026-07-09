package middleware

import (
	"time"

	"pantheon-platform/backend/pkg/logging"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

// StructuredLoggingMiddleware 结构化日志中间件
func StructuredLoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		method := logging.SanitizeLogValue(c.Request.Method)
		path := logging.SanitizeLogValue(c.Request.URL.Path)
		query := logging.SanitizeLogValue(c.Request.URL.RawQuery)
		clientIP := logging.SanitizeLogValue(c.ClientIP())

		c.Next()

		end := time.Now()
		latency := end.Sub(start)

		// Inject trace ID from OpenTelemetry context for log correlation
		span := trace.SpanFromContext(c.Request.Context())
		sc := span.SpanContext()
		traceID := ""
		if sc.HasTraceID() {
			traceID = sc.TraceID().String()
		}

		if len(c.Errors) > 0 {
			// 记录错误
			for _, e := range c.Errors.Errors() {
				logging.Error("HTTP Request Error",
					zap.String("method", method),
					zap.String("path", path),
					zap.String("query", query),
					zap.Int("status", c.Writer.Status()),
					zap.Duration("latency", latency),
					zap.String("ip", clientIP),
					zap.String("trace_id", traceID),
					zap.String("error", logging.SanitizeLogValue(e)),
				)
			}
		} else {
			// 记录正常请求
			logging.Info("HTTP Request",
				zap.String("method", method),
				zap.String("path", path),
				zap.String("query", query),
				zap.Int("status", c.Writer.Status()),
				zap.Duration("latency", latency),
				zap.String("ip", clientIP),
				zap.String("trace_id", traceID),
			)
		}
	}
}
