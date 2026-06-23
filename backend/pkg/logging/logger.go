// Package logging 提供基于 zap 的高性能结构化日志功能
//
// 基本用法:
//
//	if err := logging.InitLogger("production"); err != nil {
//	    log.Fatal(err)
//	}
//	defer logging.Sync()
//
//	logging.Info("user login", zap.String("username", "alice"), zap.String("ip", "192.168.1.1"))
//	logging.Error("database error", zap.Error(err))
package logging

import (
	"os"
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Logger 是全局 zap logger 实例
var Logger *zap.Logger

// InitLogger 初始化全局结构化日志系统
// 根据环境配置选择不同的日志格式：
// - development: 控制台格式，彩色输出，debug 级别
// - production: JSON 格式，输出到 stdout，info 级别
//
// 参数:
//
//	environment: 环境标识，支持 "development", "production"
//
// 返回:
//
//	error: 初始化失败时返回错误
func InitLogger(environment string) error {
	env := strings.ToLower(strings.TrimSpace(environment))

	var config zap.Config

	if env == "production" {
		// 生产环境：JSON 格式，输出到文件和 stdout
		config = zap.Config{
			Level:            zap.NewAtomicLevelAt(zap.InfoLevel),
			Encoding:         "json",
			OutputPaths:      []string{"stdout"},
			ErrorOutputPaths: []string{"stderr"},
			EncoderConfig: zapcore.EncoderConfig{
				TimeKey:        "timestamp",
				LevelKey:       "level",
				NameKey:        "logger",
				CallerKey:      "caller",
				MessageKey:     "message",
				StacktraceKey:  "stacktrace",
				LineEnding:     zapcore.DefaultLineEnding,
				EncodeLevel:    zapcore.LowercaseLevelEncoder,
				EncodeTime:     zapcore.ISO8601TimeEncoder,
				EncodeDuration: zapcore.SecondsDurationEncoder,
				EncodeCaller:   zapcore.ShortCallerEncoder,
			},
		}
	} else {
		// 开发环境：控制台格式，彩色输出
		config = zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	}

	logger, err := config.Build(
		zap.AddCaller(),
		zap.AddCallerSkip(1), // 跳过封装层
	)
	if err != nil {
		return err
	}

	Logger = logger
	return nil
}

// Sync 刷新日志缓冲区，确保所有日志写入完成
// 应在程序退出前调用，通常使用 defer
func Sync() {
	if Logger != nil {
		_ = Logger.Sync()
	}
}

// Info 记录 Info 级别的结构化日志
//
// 参数:
//
//	msg: 日志消息
//	fields: 结构化字段，如 zap.String("key", "value")
func Info(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Info(msg, fields...)
	}
}

// Warn 记录 Warn 级别的警告日志
func Warn(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Warn(msg, fields...)
	}
}

// Error 记录 Error 级别的错误日志
func Error(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Error(msg, fields...)
	}
}

// Debug 记录 Debug 级别的调试日志
func Debug(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Debug(msg, fields...)
	}
}

// Fatal 记录 Fatal 级别日志并退出程序（exit code 1）
func Fatal(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Fatal(msg, fields...)
	}
	os.Exit(1)
}
