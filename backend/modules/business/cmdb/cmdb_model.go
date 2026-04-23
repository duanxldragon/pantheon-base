package cmdb

import (
	"time"

	"gorm.io/gorm"
)

type BizCMDBType struct {
	ID        uint64 `gorm:"primaryKey;autoIncrement"`
	TypeCode  string `gorm:"size:64;not null;index"`
	TypeName  string `gorm:"size:128;not null"`
	Category  string `gorm:"size:64"`
	Status    int    `gorm:"default:1"`
	Remark    string `gorm:"size:255"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (BizCMDBType) TableName() string {
	return "biz_cmdb_type"
}

type BizCMDBItem struct {
	ID          uint64 `gorm:"primaryKey;autoIncrement"`
	TypeID      uint64 `gorm:"not null;index"`
	ItemCode    string `gorm:"size:128;not null;index"`
	ItemName    string `gorm:"size:128;not null"`
	Environment string `gorm:"size:32;index"`
	Status      string `gorm:"size:32;default:active;index"`
	OwnerUserID uint64 `gorm:"default:0;index"`
	OwnerDeptID uint64 `gorm:"default:0;index"`
	Endpoint    string `gorm:"size:255"`
	Description string `gorm:"type:text"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

func (BizCMDBItem) TableName() string {
	return "biz_cmdb_item"
}

type BizCMDBRelation struct {
	ID           uint64 `gorm:"primaryKey;autoIncrement"`
	SourceItemID uint64 `gorm:"not null;index:idx_cmdb_relation_source;index:idx_cmdb_relation_unique,unique"`
	TargetItemID uint64 `gorm:"not null;index:idx_cmdb_relation_target;index:idx_cmdb_relation_unique,unique"`
	RelationType string `gorm:"size:64;not null;index:idx_cmdb_relation_unique,unique"`
	Remark       string `gorm:"size:255"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index;index:idx_cmdb_relation_unique,unique"`
}

func (BizCMDBRelation) TableName() string {
	return "biz_cmdb_relation"
}
