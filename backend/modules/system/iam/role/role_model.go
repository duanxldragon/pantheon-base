package iam

import (
	"time"

	"gorm.io/gorm"
)

// SystemRole represents a system role with RBAC permissions.
type SystemRole struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	RoleName  string         `gorm:"size:64;not null" json:"roleName"`
	RoleKey   string         `gorm:"size:64;not null;uniqueIndex" json:"roleKey"`
	Sort      int            `gorm:"default:0" json:"sort"`
	Status    int            `gorm:"default:1" json:"status"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName returns the database table name for SystemRole.
func (SystemRole) TableName() string {
	return "system_role"
}
