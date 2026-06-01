package org

import (
	"time"

	"gorm.io/gorm"
)

type SystemPost struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	DeptID    uint64         `gorm:"default:0;index;index:idx_system_post_dept_deleted,priority:1;index:idx_system_post_dept_status_deleted,priority:1" json:"deptId"`
	PostCode  string         `gorm:"size:64;not null;uniqueIndex" json:"postCode"`
	PostName  string         `gorm:"size:64;not null" json:"postName"`
	Sort      int            `gorm:"default:0" json:"sort"`
	Status    int            `gorm:"default:1;index:idx_system_post_dept_status_deleted,priority:2" json:"status"`
	Remark    string         `gorm:"size:255" json:"remark"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index;index:idx_system_post_dept_deleted,priority:2;index:idx_system_post_dept_status_deleted,priority:3" json:"-"`
}

func (SystemPost) TableName() string {
	return "system_post"
}
