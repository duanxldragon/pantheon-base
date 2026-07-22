package platform

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"

	"pantheon-base/pkg/common"
	"pantheon-base/pkg/database"
	"pantheon-base/pkg/logging"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type healthDependency struct {
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}

type healthResp struct {
	Status       string                      `json:"status"`
	Service      string                      `json:"service"`
	Timestamp    string                      `json:"timestamp"`
	RequestID    string                      `json:"requestId,omitempty"`
	Dependencies map[string]healthDependency `json:"dependencies"`
}

const healthFailureLogInterval = time.Minute

var healthFailureLogState = struct {
	sync.Mutex
	lastLogged map[string]time.Time
}{lastLogged: make(map[string]time.Time)}

func sanitizeHealthError(err error, messageKey string) string {
	if err == nil {
		return ""
	}
	return messageKey
}

func classifyHealthDependencyError(err error) string {
	switch {
	case errors.Is(err, context.DeadlineExceeded):
		return "timeout"
	case errors.Is(err, sql.ErrConnDone):
		return "connection_closed"
	case errors.Is(err, driver.ErrBadConn):
		return "connection_unusable"
	}

	var networkError net.Error
	if errors.As(err, &networkError) {
		if networkError.Timeout() {
			return "timeout"
		}
		return "network"
	}
	return "unavailable"
}

func logHealthDependencyFailure(dependency, requestID string, err error) {
	now := time.Now()
	healthFailureLogState.Lock()
	lastLogged := healthFailureLogState.lastLogged[dependency]
	if now.Sub(lastLogged) < healthFailureLogInterval {
		healthFailureLogState.Unlock()
		return
	}
	healthFailureLogState.lastLogged[dependency] = now
	healthFailureLogState.Unlock()

	logging.Error(
		"Health dependency check failed",
		zap.String("dependency", dependency),
		zap.String("requestId", requestID),
		zap.String("errorType", fmt.Sprintf("%T", err)),
		zap.String("reason", classifyHealthDependencyError(err)),
	)
}

func RegisterHealthRoutes(r *gin.RouterGroup, db *gorm.DB) {
	r.GET("/health", func(c *gin.Context) {
		resp := healthResp{
			Status:    "ok",
			Service:   "pantheon-platform",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			RequestID: common.GetRequestID(c),
			Dependencies: map[string]healthDependency{
				"database": {Status: "ok"},
				"redis":    {Status: "disabled"},
			},
		}

		if db == nil {
			resp.Status = "degraded"
			resp.Dependencies["database"] = healthDependency{Status: "down", Message: "database.not_initialized"}
		} else if sqlDB, err := db.DB(); err != nil {
			resp.Status = "degraded"
			resp.Dependencies["database"] = healthDependency{Status: "down", Message: sanitizeHealthError(err, "database.unavailable")}
			logHealthDependencyFailure("database", resp.RequestID, err)
		} else if err := sqlDB.PingContext(c.Request.Context()); err != nil {
			resp.Status = "degraded"
			resp.Dependencies["database"] = healthDependency{Status: "down", Message: sanitizeHealthError(err, "database.unavailable")}
			logHealthDependencyFailure("database", resp.RequestID, err)
		}

		if database.RDB != nil {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
			defer cancel()
			if err := database.RDB.Ping(ctx).Err(); err != nil {
				resp.Status = "degraded"
				resp.Dependencies["redis"] = healthDependency{Status: "down", Message: sanitizeHealthError(err, "redis.unavailable")}
				logHealthDependencyFailure("redis", resp.RequestID, err)
			} else {
				resp.Dependencies["redis"] = healthDependency{Status: "ok"}
			}
		}

		statusCode := http.StatusOK
		if resp.Status != "ok" {
			statusCode = http.StatusServiceUnavailable
		}
		common.SuccessWithStatus(c, statusCode, resp)
	})
}
