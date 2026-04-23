package system

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"pantheon-platform/backend/pkg/database"
)

type I18nService struct {
	db *gorm.DB
}

func NewI18nService(db *gorm.DB) *I18nService {
	return &I18nService{db: db}
}

// GetLangPack 获取指定语言的全量翻译包
func (s *I18nService) GetLangPack(langType string) (map[string]string, error) {
	// 1. 尝试从 Redis 获取 (缓存 Key: i18n:zh-CN)
	cacheKey := fmt.Sprintf("i18n:%s", langType)
	if database.RDB != nil {
		cached, _ := database.RDB.Get(context.Background(), cacheKey).Result()
		if cached != "" {
			var pack map[string]string
			if err := json.Unmarshal([]byte(cached), &pack); err == nil {
				return pack, nil
			}
		}
	}

	// 2. 缓存失效，从数据库加载
	if s.db == nil {
		return nil, errors.New("database.not_initialized")
	}

	var translations []SystemI18n
	if err := s.db.Where("lang_type = ?", langType).Find(&translations).Error; err != nil {
		return nil, err
	}

	pack := make(map[string]string)
	for _, t := range translations {
		pack[t.LangKey] = t.LangValue
	}

	// 3. 异步同步回 Redis，有效期 24 小时
	if database.RDB != nil {
		go func() {
			data, _ := json.Marshal(pack)
			database.RDB.Set(context.Background(), cacheKey, string(data), 24*time.Hour)
		}()
	}

	return pack, nil
}
