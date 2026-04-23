package system

import (
	"time"
)

// SystemI18n 国际化翻译模型
type SystemI18n struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	LangKey   string    `gorm:"size:128;not null;uniqueIndex:idx_key_lang" json:"langKey"`
	LangType  string    `gorm:"size:10;not null;uniqueIndex:idx_key_lang" json:"langType"` // zh-CN, en-US
	LangValue string    `gorm:"type:text" json:"langValue"`
	Module    string    `gorm:"size:64;default:'system'" json:"module"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (SystemI18n) TableName() string {
	return "system_i18n"
}
