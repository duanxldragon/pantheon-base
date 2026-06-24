package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"pantheon-platform/backend/internal/middleware"
	"pantheon-platform/backend/modules/auth"
	"pantheon-platform/backend/modules/business"
	"pantheon-platform/backend/modules/dashboard"
	"pantheon-platform/backend/modules/platform"
	"pantheon-platform/backend/modules/system"
	"pantheon-platform/backend/pkg/common"
	commonsecurity "pantheon-platform/backend/pkg/common/security"
	"pantheon-platform/backend/pkg/database"
	"pantheon-platform/backend/pkg/logging"
	"pantheon-platform/backend/pkg/telemetry"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.uber.org/zap"
)

func main() {
	// 0. 初始化结构化日志
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

	// 0b. 初始化 OpenTelemetry 追踪
	otlpEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otlpEndpoint != "" {
		tp, err := telemetry.InitTracer("pantheon-base", otlpEndpoint)
		if err != nil {
			logging.Error("Failed to initialize tracer", zap.Error(err))
		} else {
			defer func() {
				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancel()
				if err := tp.Shutdown(ctx); err != nil {
					logging.Error("Error shutting down tracer", zap.Error(err))
				}
			}()
			logging.Info("OpenTelemetry tracer initialized", zap.String("endpoint", otlpEndpoint))
		}
	}

	// 1. 初始化核心基础能力
	common.InitLocationService()
	if err := commonsecurity.InitSecurityConfig(); err != nil {
		logging.Error("Security configuration invalid", zap.Error(err))
		os.Exit(1)
	}

	// 1. 初始化数据库
	dsn := os.Getenv("PANTHEON_DSN")
	if dsn == "" {
		logging.Fatal("PANTHEON_DSN is required")
	}
	database.InitDB(dsn)

	// 1b. 数据库迁移：默认使用版本化迁移(golang-migrate)，开发模式可启用 AutoMigrate
	if database.ShouldAutoMigrate() {
		slog.Info("PANTHEON_AUTO_MIGRATE=true: using GORM AutoMigrate (dev mode)")
		// AutoMigrate 由各模块的 Migrate() 方法在注册时自动执行
	} else {
		if err := database.RunMigrations(dsn); err != nil {
			slog.Error("database migration failed", "error", err)
			os.Exit(1)
		}
	}

	// 2. 初始化 Redis (默认本地地址)
	if redisAddr := os.Getenv("PANTHEON_REDIS_ADDR"); redisAddr != "" {
		database.InitRedis(redisAddr, os.Getenv("PANTHEON_REDIS_PASSWORD"), 0)
	}

	database.InitCasbin(database.DB)

	// 3. 初始化 Gin
	r := gin.Default()
	r.Use(middleware.SecurityHeadersMiddleware())
	r.Use(middleware.CSPMiddleware()) // Content-Security-Policy
	r.Use(middleware.BodySizeLimit(middleware.DefaultMaxBodyBytes))
	r.Use(middleware.CORSMiddleware())
	r.Use(otelgin.Middleware("pantheon-base")) // OpenTelemetry 追踪
	r.Use(middleware.PrometheusMiddleware())   // Prometheus 指标采集
	r.Use(middleware.RequestContextMiddleware(), middleware.OperationLogMiddleware(database.DB))
	r.Use(middleware.CSRFMiddleware())

	// 3. 注册 Prometheus metrics 端点（不需要认证）
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// 4. 注册底座模块
	api := r.Group("/api/v1")
	platform.InitPlatformModule(api, database.DB)
	dashboard.InitDashboardModule(api, database.DB)
	system.InitSystemModule(api, database.DB)
	auth.InitAuthModule(api, database.DB)
	business.InitBusinessModules(api, database.DB)

	// 5. 启动服务器
	port := os.Getenv("PANTHEON_PORT")
	if port == "" {
		port = "8080"
	}
	slog.Info("starting server", "port", port)
	if err := r.Run(":" + port); err != nil {
		slog.Error("failed to run server", "error", err)
		os.Exit(1)
	}
}
