package logging

import (
	"testing"

	"go.uber.org/zap"
)

func TestInitLogger(t *testing.T) {
	tests := []struct {
		name    string
		env     string
		wantErr bool
	}{
		{
			name:    "development environment",
			env:     "development",
			wantErr: false,
		},
		{
			name:    "production environment",
			env:     "production",
			wantErr: false,
		},
		{
			name:    "empty environment defaults to development",
			env:     "",
			wantErr: false,
		},
		{
			name:    "unknown environment defaults to development",
			env:     "staging",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := InitLogger(tt.env)
			if (err != nil) != tt.wantErr {
				t.Errorf("InitLogger() error = %v, wantErr %v", err, tt.wantErr)
			}
			if Logger == nil {
				t.Error("InitLogger() Logger is nil")
			}
		})
	}
}

func TestLoggerMethods(t *testing.T) {
	// 初始化 logger
	if err := InitLogger("development"); err != nil {
		t.Fatalf("Failed to initialize logger: %v", err)
	}

	// 测试各个日志级别
	t.Run("Info", func(t *testing.T) {
		Info("test info message", zap.String("key", "value"))
	})

	t.Run("Warn", func(t *testing.T) {
		Warn("test warn message", zap.String("key", "value"))
	})

	t.Run("Error", func(t *testing.T) {
		Error("test error message", zap.String("key", "value"))
	})

	t.Run("Debug", func(t *testing.T) {
		Debug("test debug message", zap.String("key", "value"))
	})

	// 测试 Sync
	t.Run("Sync", func(t *testing.T) {
		Sync()
	})
}

func TestLoggerWithNilLogger(t *testing.T) {
	// 保存原始 Logger
	originalLogger := Logger
	defer func() { Logger = originalLogger }()

	// 设置 Logger 为 nil
	Logger = nil

	// 测试所有方法不应该 panic
	t.Run("Info with nil logger", func(t *testing.T) {
		Info("test")
	})

	t.Run("Warn with nil logger", func(t *testing.T) {
		Warn("test")
	})

	t.Run("Error with nil logger", func(t *testing.T) {
		Error("test")
	})

	t.Run("Debug with nil logger", func(t *testing.T) {
		Debug("test")
	})

	t.Run("Sync with nil logger", func(t *testing.T) {
		Sync()
	})
}
