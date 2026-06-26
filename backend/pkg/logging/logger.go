// Package logging provides high-performance structured logging based on zap.
//
// Basic usage:
//
//	if err := logging.InitLogger("production"); err != nil {
//	    log.Fatal(err)
//	}
//	defer logging.Sync()
//
//	logging.Info("user login", zap.String("username", "alice"), zap.String("ip", "192.168.1.1"))
//	logging.Error("database error", zap.Error(err))
//
// Supports development (console output with colors) and production (JSON format) environments.
package logging

import (
	"context"
	"os"
	"strings"
	"unicode"

	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Logger is the global zap logger instance.
var Logger *zap.Logger

// InitLogger initializes the global structured logging system.
// Selects different log formats based on environment:
// - development: console format with colors, debug level
// - production: JSON format, output to stdout, info level
//
// Parameters:
//   - environment: environment identifier, supports "development", "production"
//
// Returns:
//   - error: returns error on initialization failure
func InitLogger(environment string) error {
	env := strings.ToLower(strings.TrimSpace(environment))

	var config zap.Config

	if env == "production" {
		// Production: JSON format, output to stdout
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
		// Development: console format with colors
		config = zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	}

	logger, err := config.Build(
		zap.AddCaller(),
		zap.AddCallerSkip(1), // Skip wrapper layers
	)
	if err != nil {
		return err
	}

	Logger = logger
	return nil
}

// Sync flushes the log buffer to ensure all logs are written.
// Should be called before program exit, typically with defer.
func Sync() {
	if Logger != nil {
		_ = Logger.Sync()
	}
}

// Info logs a message at Info level.
//
// Parameters:
//   - msg: log message
//   - fields: structured fields, e.g., zap.String("key", "value")
func Info(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Info(SanitizeLogValue(msg), sanitizeLogFields(fields)...)
	}
}

// Warn logs a message at Warn level (warnings).
func Warn(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Warn(SanitizeLogValue(msg), sanitizeLogFields(fields)...)
	}
}

// Error logs a message at Error level.
func Error(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Error(SanitizeLogValue(msg), sanitizeLogFields(fields)...)
	}
}

// Debug logs a message at Debug level.
func Debug(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Debug(SanitizeLogValue(msg), sanitizeLogFields(fields)...)
	}
}

// Fatal logs a message at Fatal level and exits the program (exit code 1).
func Fatal(msg string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Fatal(SanitizeLogValue(msg), sanitizeLogFields(fields)...)
	}
	os.Exit(1)
}

// SanitizeLogValue strips log-control characters from user-controlled values.
func SanitizeLogValue(value string) string {
	return strings.Map(func(r rune) rune {
		switch r {
		case '\n', '\r', '\u2028', '\u2029':
			return ' '
		}
		if unicode.IsControl(r) && r != '\t' {
			return -1
		}
		return r
	}, value)
}

func sanitizeLogFields(fields []zap.Field) []zap.Field {
	if len(fields) == 0 {
		return fields
	}
	sanitized := make([]zap.Field, len(fields))
	for i, field := range fields {
		field.Key = SanitizeLogValue(field.Key)
		switch field.Type {
		case zapcore.StringType:
			field.String = SanitizeLogValue(field.String)
		case zapcore.ErrorType:
			if err, ok := field.Interface.(error); ok && err != nil {
				field = zap.String(field.Key, SanitizeLogValue(err.Error()))
			}
		}
		sanitized[i] = field
	}
	return sanitized
}

// LogFromContext extracts trace ID from OpenTelemetry context and returns
// a logger with the trace_id field injected for log correlation.
func LogFromContext(ctx context.Context) *zap.Logger {
	if ctx == nil {
		ctx = context.Background()
	}
	span := trace.SpanFromContext(ctx)
	sc := span.SpanContext()
	if sc.HasTraceID() {
		return Logger.With(zap.String("trace_id", sc.TraceID().String()))
	}
	return Logger
}
