package host

import (
	"gorm.io/gorm"
	"time"
)

// CmdbHost 主机管理模型
type CmdbHost struct {
	ID              uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	HostCode        string         `gorm:"uniqueIndex;not null;size:255" json:"hostCode"`
	Hostname        string         `gorm:"not null;size:255" json:"hostname"`
	DisplayName     string         `gorm:"not null;size:255" json:"displayName"`
	IpAddress       string         `gorm:"uniqueIndex;not null;size:255" json:"ipAddress"`
	SshPort         int64          `gorm:"not null" json:"sshPort"`
	OsFamily        string         `gorm:"not null;size:255" json:"osFamily"`
	OsName          string         `gorm:"not null;size:255" json:"osName"`
	KernelVersion   string         `gorm:"not null;size:255" json:"kernelVersion"`
	Arch            string         `gorm:"not null;size:255" json:"arch"`
	Environment     string         `gorm:"not null;size:50" json:"environment"`
	Status          string         `gorm:"not null;size:50" json:"status"`
	LifecycleStatus string         `gorm:"not null;size:255" json:"lifecycleStatus"`
	Provider        string         `gorm:"not null;size:255" json:"provider"`
	RegionCode      string         `gorm:"not null;size:255" json:"regionCode"`
	IdcCode         string         `gorm:"not null;size:255" json:"idcCode"`
	ClusterName     string         `gorm:"not null;size:255" json:"clusterName"`
	OwnerUserId     int64          `gorm:"not null" json:"ownerUserId"`
	OwnerName       string         `gorm:"not null;size:255" json:"ownerName"`
	MaintainerTeam  string         `gorm:"not null;size:255" json:"maintainerTeam"`
	Purpose         string         `gorm:"not null;size:255" json:"purpose"`
	LastCheckInAt   time.Time      `json:"lastCheckInAt"`
	LastInventoryAt time.Time      `json:"lastInventoryAt"`
	LastOperatedAt  time.Time      `json:"lastOperatedAt"`
	Remark          string         `gorm:"not null;size:255" json:"remark"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 指定表名
func (CmdbHost) TableName() string {
	return "biz_cmdb_host"
}
