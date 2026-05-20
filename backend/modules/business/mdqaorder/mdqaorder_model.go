package mdqaorder

import (
	"time"
	"gorm.io/gorm"
)

// Mdqaorder 主从订单模型
type Mdqaorder struct {
	ID uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"not null;size:255" json:"name"`
	Status string `gorm:"not null;size:50" json:"status"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 指定表名
func (Mdqaorder) TableName() string {
	return "biz_mdqa_order"
}
