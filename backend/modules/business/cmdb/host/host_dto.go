package host

import (
	"time"
)

// CmdbHostListResp 列表页返回 DTO
type CmdbHostListResp struct {
	ID              uint64    `json:"id"`
	HostCode        string    `json:"hostCode"`
	Hostname        string    `json:"hostname"`
	DisplayName     string    `json:"displayName"`
	IpAddress       string    `json:"ipAddress"`
	SshPort         int64     `json:"sshPort"`
	OsFamily        string    `json:"osFamily"`
	OsName          string    `json:"osName"`
	KernelVersion   string    `json:"kernelVersion"`
	Arch            string    `json:"arch"`
	Environment     string    `json:"environment"`
	Status          string    `json:"status"`
	LifecycleStatus string    `json:"lifecycleStatus"`
	Provider        string    `json:"provider"`
	RegionCode      string    `json:"regionCode"`
	IdcCode         string    `json:"idcCode"`
	ClusterName     string    `json:"clusterName"`
	OwnerUserId     int64     `json:"ownerUserId"`
	OwnerName       string    `json:"ownerName"`
	MaintainerTeam  string    `json:"maintainerTeam"`
	Purpose         string    `json:"purpose"`
	LastCheckInAt   time.Time `json:"lastCheckInAt"`
	LastInventoryAt time.Time `json:"lastInventoryAt"`
	LastOperatedAt  time.Time `json:"lastOperatedAt"`
	Remark          string    `json:"remark"`
	CreatedAt       string    `json:"createdAt"`
}

// CmdbHostListPageResp 分页响应
type CmdbHostListPageResp struct {
	Items    []CmdbHostListResp `json:"items"`
	Total    int64              `json:"total"`
	Page     int                `json:"page"`
	PageSize int                `json:"pageSize"`
}

// CmdbHostDetailResp 详情返回 DTO
type CmdbHostDetailResp struct {
	ID              uint64    `json:"id"`
	HostCode        string    `json:"hostCode"`
	Hostname        string    `json:"hostname"`
	DisplayName     string    `json:"displayName"`
	IpAddress       string    `json:"ipAddress"`
	SshPort         int64     `json:"sshPort"`
	OsFamily        string    `json:"osFamily"`
	OsName          string    `json:"osName"`
	KernelVersion   string    `json:"kernelVersion"`
	Arch            string    `json:"arch"`
	Environment     string    `json:"environment"`
	Status          string    `json:"status"`
	LifecycleStatus string    `json:"lifecycleStatus"`
	Provider        string    `json:"provider"`
	RegionCode      string    `json:"regionCode"`
	IdcCode         string    `json:"idcCode"`
	ClusterName     string    `json:"clusterName"`
	OwnerUserId     int64     `json:"ownerUserId"`
	OwnerName       string    `json:"ownerName"`
	MaintainerTeam  string    `json:"maintainerTeam"`
	Purpose         string    `json:"purpose"`
	LastCheckInAt   time.Time `json:"lastCheckInAt"`
	LastInventoryAt time.Time `json:"lastInventoryAt"`
	LastOperatedAt  time.Time `json:"lastOperatedAt"`
	Remark          string    `json:"remark"`
	CreatedAt       string    `json:"createdAt"`
	UpdatedAt       string    `json:"updatedAt"`
}

// CmdbHostListQuery 查询参数
type CmdbHostListQuery struct {
	HostCode        string `form:"hostCode" json:"hostCode"`
	Hostname        string `form:"hostname" json:"hostname"`
	DisplayName     string `form:"displayName" json:"displayName"`
	OsName          string `form:"osName" json:"osName"`
	Status          string `form:"status" json:"status"`
	LifecycleStatus string `form:"lifecycleStatus" json:"lifecycleStatus"`
	RegionCode      string `form:"regionCode" json:"regionCode"`
	IdcCode         string `form:"idcCode" json:"idcCode"`
	ClusterName     string `form:"clusterName" json:"clusterName"`
	OwnerName       string `form:"ownerName" json:"ownerName"`
	Page            int    `form:"page" json:"page"`
	PageSize        int    `form:"pageSize" json:"pageSize"`
	SortField       string `form:"sortField" json:"sortField"`
	SortOrder       string `form:"sortOrder" json:"sortOrder"`
}

// CmdbHostCreateReq 创建请求
type CmdbHostCreateReq struct {
	HostCode        string    `json:"hostCode" binding:"required"`
	Hostname        string    `json:"hostname" binding:"required"`
	DisplayName     string    `json:"displayName" binding:"required"`
	IpAddress       string    `json:"ipAddress" binding:"required"`
	SshPort         int64     `json:"sshPort" binding:"required"`
	OsFamily        string    `json:"osFamily" binding:"required"`
	OsName          string    `json:"osName" binding:"required"`
	KernelVersion   string    `json:"kernelVersion" binding:"required"`
	Arch            string    `json:"arch" binding:"required"`
	Environment     string    `json:"environment" binding:"required"`
	Status          string    `json:"status" binding:"required"`
	LifecycleStatus string    `json:"lifecycleStatus" binding:"required"`
	Provider        string    `json:"provider" binding:"required"`
	RegionCode      string    `json:"regionCode" binding:"required"`
	IdcCode         string    `json:"idcCode" binding:"required"`
	ClusterName     string    `json:"clusterName" binding:"required"`
	OwnerUserId     int64     `json:"ownerUserId" binding:"required"`
	OwnerName       string    `json:"ownerName" binding:"required"`
	MaintainerTeam  string    `json:"maintainerTeam" binding:"required"`
	Purpose         string    `json:"purpose" binding:"required"`
	LastCheckInAt   time.Time `json:"lastCheckInAt"`
	LastInventoryAt time.Time `json:"lastInventoryAt"`
	LastOperatedAt  time.Time `json:"lastOperatedAt"`
	Remark          string    `json:"remark" binding:"required"`
}

// CmdbHostUpdateReq 更新请求
type CmdbHostUpdateReq struct {
	HostCode        *string    `json:"hostCode"`
	Hostname        *string    `json:"hostname"`
	DisplayName     *string    `json:"displayName"`
	IpAddress       *string    `json:"ipAddress"`
	SshPort         *int64     `json:"sshPort"`
	OsFamily        *string    `json:"osFamily"`
	OsName          *string    `json:"osName"`
	KernelVersion   *string    `json:"kernelVersion"`
	Arch            *string    `json:"arch"`
	Environment     *string    `json:"environment"`
	Status          *string    `json:"status"`
	LifecycleStatus *string    `json:"lifecycleStatus"`
	Provider        *string    `json:"provider"`
	RegionCode      *string    `json:"regionCode"`
	IdcCode         *string    `json:"idcCode"`
	ClusterName     *string    `json:"clusterName"`
	OwnerUserId     *int64     `json:"ownerUserId"`
	OwnerName       *string    `json:"ownerName"`
	MaintainerTeam  *string    `json:"maintainerTeam"`
	Purpose         *string    `json:"purpose"`
	LastCheckInAt   *time.Time `json:"lastCheckInAt"`
	LastInventoryAt *time.Time `json:"lastInventoryAt"`
	LastOperatedAt  *time.Time `json:"lastOperatedAt"`
	Remark          *string    `json:"remark"`
}
