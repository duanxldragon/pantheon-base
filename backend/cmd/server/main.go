package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/modules/auth"
	"pantheon-platform/backend/modules/business"
	"pantheon-platform/backend/modules/lowcode"
	"pantheon-platform/backend/modules/platform"
	"pantheon-platform/backend/modules/system"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/database"
	"pantheon-platform/backend/pkg/logging"
	"pantheon-platform/backend/pkg/telemetry"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.uber.org/zap"
)

// main is the entry point for the Pantheon Base server.
// It initializes core infrastructure (logging, tracing, database, Redis, Casbin)
// and registers all API modules before starting the HTTP server.
func main() {
	// 0. Initialize structured logging
	env := os.Getenv("PANTHEON_ENV")
	if env == "" {
		env = "development"
	}

	if err := logging.InitLogger(env); err != nil {
		slog.Error("Failed to initialize logger", "error", err)
		os.Exit(1)
	}
	defer logging.Sync()

	logging.Info("Starting Pantheon Base",
		zap.String("version", "0.8.3"),
		zap.String("environment", env),
	)

	// 0b. Initialize OpenTelemetry tracing
	otlpEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otlpEndpoint != "" {
		_, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		tp, err := telemetry.InitTracer("pantheon-base", otlpEndpoint)
		if err != nil {
			logging.Error("Failed to initialize tracer", zap.Error(err))
		} else {
			defer func() {
				shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer shutdownCancel()
				if err := tp.Shutdown(shutdownCtx); err != nil {
					logging.Error("Error shutting down tracer", zap.Error(err))
				}
			}()
			logging.Info("OpenTelemetry tracer initialized", zap.String("endpoint", otlpEndpoint))
		}
	}

	// 1. Initialize core services
	common.InitLocationService()
	if err := common.InitSecurityConfig(); err != nil {
		logging.Error("Security configuration invalid", zap.Error(err))
		os.Exit(1)
	}

	// 1b. Run database migrations
	dsn := os.Getenv("PANTHEON_DSN")
	if dsn == "" {
		logging.Fatal("PANTHEON_DSN is required")
	}
	database.InitDB(dsn)

	// 1b. Database migrations: use golang-migrate by default; AutoMigrate available in dev mode
	if database.ShouldAutoMigrate() {
		slog.Info("PANTHEON_AUTO_MIGRATE=true: using GORM AutoMigrate (dev mode)")
		// AutoMigrate is handled by each module's Migrate() method during registration
	} else {
		if err := database.RunMigrations(dsn); err != nil {
			slog.Error("database migration failed", "error", err)
			os.Exit(1)
		}
	}

	// 2. Initialize Redis (default localhost)
	if redisAddr := os.Getenv("PANTHEON_REDIS_ADDR"); redisAddr != "" {
		database.InitRedis(redisAddr, os.Getenv("PANTHEON_REDIS_PASSWORD"), 0)
	}

	database.InitCasbin(database.DB)

	// 3. Initialize Gin router with security middleware
	r := gin.Default()
	r.Use(middleware.SecurityHeadersMiddleware())
	r.Use(middleware.CSPMiddleware()) // Content-Security-Policy
	r.Use(middleware.BodySizeLimit(middleware.DefaultMaxBodyBytes))
	r.Use(middleware.CORSMiddleware())
	r.Use(otelgin.Middleware("pantheon-base")) // OpenTelemetry tracing
	r.Use(middleware.PrometheusMiddleware())    // Prometheus metrics collection
	r.Use(middleware.RequestContextMiddleware(), middleware.OperationLogMiddleware(database.DB))
	r.Use(middleware.CSRFMiddleware())

	// 3. Register Prometheus metrics endpoint
	// Production requires explicit token or public flag
	if shouldExposeMetrics(env) {
		r.GET("/metrics", metricsAccessMiddleware(), gin.WrapH(promhttp.Handler()))
	} else {
		logging.Warn("Prometheus metrics endpoint disabled; set PANTHEON_METRICS_BEARER_TOKEN or PANTHEON_METRICS_PUBLIC=true to expose it")
	}

	// 4. Register base platform modules
	api := r.Group("/api/v1")
	platform.RegisterPlatformRoutes(api, database.DB)
	lowcode.InitLowcodeModule(api, database.DB)
	system.InitSystemModule(api, database.DB)
	auth.InitAuthModule(api, database.DB)
	business.InitBusinessModules(api, database.DB)

	// 5. Start HTTP server
	port := os.Getenv("PANTHEON_PORT")
	if port == "" {
		port = "8080"
	}
	slog.Info("starting server", "port", port)
	server := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("failed to run server", "error", err)
		os.Exit(1)
	}
}

// shouldExposeMetrics determines if the Prometheus metrics endpoint should be exposed.
// Returns false if PANTHEON_METRICS_ENABLED=false, true for non-production environments,
// or true if a bearer token is configured or PANTHEON_METRICS_PUBLIC=true.
func shouldExposeMetrics(env string) bool {
	if envFlag("PANTHEON_METRICS_ENABLED") == "false" {
		return false
	}
	if !strings.EqualFold(strings.TrimSpace(env), "production") {
		return true
	}
	if strings.TrimSpace(os.Getenv("PANTHEON_METRICS_BEARER_TOKEN")) != "" {
		return true
	}
	return envFlag("PANTHEON_METRICS_PUBLIC") == "true"
}

// metricsAccessMiddleware validates Bearer token for /metrics endpoint access.
// Returns 401 Unauthorized if token is required but missing or invalid.
func metricsAccessMiddleware() gin.HandlerFunc {
	expectedToken := strings.TrimSpace(os.Getenv("PANTHEON_METRICS_BEARER_TOKEN"))
	return func(c *gin.Context) {
		if expectedToken == "" {
			c.Next()
			return
		}
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if header != "Bearer "+expectedToken {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		c.Next()
	}
}

func envFlag(name string) string {
	switch strings.ToLower(strings.TrimSpace(os.Getenv(name))) {
	case "1", "true", "yes", "on":
		return "true"
	case "0", "false", "no", "off":
		return "false"
	default:
		return ""
	}
}
