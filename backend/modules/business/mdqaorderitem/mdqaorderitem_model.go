package mdqaorderitem

import (
	"gorm.io/gorm"
	"time"
)

// Mdqaorderitem 订单明细模型
type Mdqaorderitem struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	ItemName  string         `gorm:"not null;size:255" json:"itemName"`
	Quantity  int64          `gorm:"not null" json:"quantity"`
	Enabled   bool           `json:"enabled"`
	Remark    string         `gorm:"type:text" json:"remark"`
	OrderId   int64          `gorm:"not null" json:"orderId"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 指定表名
func (Mdqaorderitem) TableName() string {
	return "biz_mdqa_order_item"
}
