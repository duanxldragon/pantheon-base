package host

import (
	"errors"
	"gorm.io/gorm"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/database"
	"strings"
	"time"
)

type CmdbHostService struct {
	db *gorm.DB
}

// NewCmdbHostService 构造函数
func NewCmdbHostService(db *gorm.DB) *CmdbHostService {
	return &CmdbHostService{db: db}
}

// Migrate 数据库迁移
func (s *CmdbHostService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	return s.db.AutoMigrate(&CmdbHost{})
}

// ListCmdbHosts 分页列表查询
func (s *CmdbHostService) ListCmdbHosts(query *CmdbHostListQuery, dataScope *common.DataScopeReq) (*CmdbHostListPageResp, error) {
	if query == nil {
		query = &CmdbHostListQuery{}
	}
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 10
	}
	var items []CmdbHost
	var total int64

	db := s.db.Model(&CmdbHost{}).Scopes(database.WithDataScope(dataScope))
	if query.HostCode != "" {
		db = db.Where("ho_t_code LIKE ?", "%"+query.HostCode+"%")
	}
	if query.Hostname != "" {
		db = db.Where("ho_tname LIKE ?", "%"+query.Hostname+"%")
	}
	if query.DisplayName != "" {
		db = db.Where("di_play_name LIKE ?", "%"+query.DisplayName+"%")
	}
	if query.OsName != "" {
		db = db.Where("o__name LIKE ?", "%"+query.OsName+"%")
	}
	if query.Status != "" {
		db = db.Where("_tatu_ LIKE ?", "%"+query.Status+"%")
	}
	if query.LifecycleStatus != "" {
		db = db.Where("lifecycle_statu_ LIKE ?", "%"+query.LifecycleStatus+"%")
	}
	if query.RegionCode != "" {
		db = db.Where("region_code LIKE ?", "%"+query.RegionCode+"%")
	}
	if query.IdcCode != "" {
		db = db.Where("idc_code LIKE ?", "%"+query.IdcCode+"%")
	}
	if query.ClusterName != "" {
		db = db.Where("clu_ter_name LIKE ?", "%"+query.ClusterName+"%")
	}
	if query.OwnerName != "" {
		db = db.Where("owner_name LIKE ?", "%"+query.OwnerName+"%")
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	// 分页和排序
	offset := (query.Page - 1) * query.PageSize
	orderBy := "id desc"
	sortFieldMap := map[string]string{
		"hostCode":        "ho_t_code",
		"hostname":        "ho_tname",
		"displayName":     "di_play_name",
		"ipAddress":       "ip_addre_",
		"sshPort":         "_h_port",
		"osFamily":        "o__family",
		"osName":          "o__name",
		"kernelVersion":   "kernel_ver_ion",
		"arch":            "arch",
		"environment":     "environment",
		"status":          "_tatu_",
		"lifecycleStatus": "lifecycle_statu_",
		"provider":        "provider",
		"regionCode":      "region_code",
		"idcCode":         "idc_code",
		"clusterName":     "clu_ter_name",
		"ownerUserId":     "owner_u_er_id",
		"ownerName":       "owner_name",
		"maintainerTeam":  "maintainer_team",
		"purpose":         "purpo_e",
		"lastCheckInAt":   "la_t_check_in_at",
		"lastInventoryAt": "la_t_inventory_at",
		"lastOperatedAt":  "la_t_operated_at",
		"remark":          "remark",
		"createdAt":       "created_at",
		"updatedAt":       "updated_at",
	}
	if column, ok := sortFieldMap[strings.TrimSpace(query.SortField)]; ok {
		orderBy = column + " desc"
		if strings.EqualFold(strings.TrimSpace(query.SortOrder), "asc") {
			orderBy = column + " asc"
		}
	}

	if err := db.Order(orderBy).Offset(offset).Limit(query.PageSize).Find(&items).Error; err != nil {
		return nil, err
	}

	// 转换为 DTO
	listResp := make([]CmdbHostListResp, len(items))
	for i, item := range items {
		listResp[i] = s.toListResp(item)
	}

	return &CmdbHostListPageResp{
		Items:    listResp,
		Total:    total,
		Page:     query.Page,
		PageSize: query.PageSize,
	}, nil
}

// GetCmdbHostDetail 详情查询
func (s *CmdbHostService) GetCmdbHostDetail(id uint64) (*CmdbHostDetailResp, error) {
	var item CmdbHost
	if err := s.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("cmdbhost.not_found")
		}
		return nil, err
	}
	detail := s.toDetailResp(item)
	return &detail, nil
}

// CreateCmdbHost 创建
func (s *CmdbHostService) CreateCmdbHost(req *CmdbHostCreateReq) (*CmdbHostListResp, error) {
	item := s.fromCreateReq(req)
	if err := s.db.Create(&item).Error; err != nil {
		return nil, err
	}
	resp := s.toListResp(item)
	return &resp, nil
}

// UpdateCmdbHost 更新
func (s *CmdbHostService) UpdateCmdbHost(id uint64, req *CmdbHostUpdateReq) (*CmdbHostListResp, error) {
	var item CmdbHost
	if err := s.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("cmdbhost.not_found")
		}
		return nil, err
	}

	// 更新字段
	if req.HostCode != nil {
		item.HostCode = *req.HostCode
	}
	if req.Hostname != nil {
		item.Hostname = *req.Hostname
	}
	if req.DisplayName != nil {
		item.DisplayName = *req.DisplayName
	}
	if req.IpAddress != nil {
		item.IpAddress = *req.IpAddress
	}
	if req.SshPort != nil {
		item.SshPort = *req.SshPort
	}
	if req.OsFamily != nil {
		item.OsFamily = *req.OsFamily
	}
	if req.OsName != nil {
		item.OsName = *req.OsName
	}
	if req.KernelVersion != nil {
		item.KernelVersion = *req.KernelVersion
	}
	if req.Arch != nil {
		item.Arch = *req.Arch
	}
	if req.Environment != nil {
		item.Environment = *req.Environment
	}
	if req.Status != nil {
		item.Status = *req.Status
	}
	if req.LifecycleStatus != nil {
		item.LifecycleStatus = *req.LifecycleStatus
	}
	if req.Provider != nil {
		item.Provider = *req.Provider
	}
	if req.RegionCode != nil {
		item.RegionCode = *req.RegionCode
	}
	if req.IdcCode != nil {
		item.IdcCode = *req.IdcCode
	}
	if req.ClusterName != nil {
		item.ClusterName = *req.ClusterName
	}
	if req.OwnerUserId != nil {
		item.OwnerUserId = *req.OwnerUserId
	}
	if req.OwnerName != nil {
		item.OwnerName = *req.OwnerName
	}
	if req.MaintainerTeam != nil {
		item.MaintainerTeam = *req.MaintainerTeam
	}
	if req.Purpose != nil {
		item.Purpose = *req.Purpose
	}
	if req.LastCheckInAt != nil {
		item.LastCheckInAt = *req.LastCheckInAt
	}
	if req.LastInventoryAt != nil {
		item.LastInventoryAt = *req.LastInventoryAt
	}
	if req.LastOperatedAt != nil {
		item.LastOperatedAt = *req.LastOperatedAt
	}
	if req.Remark != nil {
		item.Remark = *req.Remark
	}

	if err := s.db.Save(&item).Error; err != nil {
		return nil, err
	}
	resp := s.toListResp(item)
	return &resp, nil
}

// DeleteCmdbHost 删除(软删除)
func (s *CmdbHostService) DeleteCmdbHost(id uint64) error {
	result := s.db.Delete(&CmdbHost{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("cmdbhost.not_found")
	}
	return nil
}

// ========== DTO 转换方法 ==========

func (s *CmdbHostService) toListResp(item CmdbHost) CmdbHostListResp {
	return CmdbHostListResp{
		ID:              item.ID,
		HostCode:        item.HostCode,
		Hostname:        item.Hostname,
		DisplayName:     item.DisplayName,
		IpAddress:       item.IpAddress,
		SshPort:         item.SshPort,
		OsFamily:        item.OsFamily,
		OsName:          item.OsName,
		KernelVersion:   item.KernelVersion,
		Arch:            item.Arch,
		Environment:     item.Environment,
		Status:          item.Status,
		LifecycleStatus: item.LifecycleStatus,
		Provider:        item.Provider,
		RegionCode:      item.RegionCode,
		IdcCode:         item.IdcCode,
		ClusterName:     item.ClusterName,
		OwnerUserId:     item.OwnerUserId,
		OwnerName:       item.OwnerName,
		MaintainerTeam:  item.MaintainerTeam,
		Purpose:         item.Purpose,
		LastCheckInAt:   item.LastCheckInAt,
		LastInventoryAt: item.LastInventoryAt,
		LastOperatedAt:  item.LastOperatedAt,
		Remark:          item.Remark,
		CreatedAt:       item.CreatedAt.Format(time.RFC3339),
	}
}

func (s *CmdbHostService) toDetailResp(item CmdbHost) CmdbHostDetailResp {
	return CmdbHostDetailResp{
		ID:              item.ID,
		HostCode:        item.HostCode,
		Hostname:        item.Hostname,
		DisplayName:     item.DisplayName,
		IpAddress:       item.IpAddress,
		SshPort:         item.SshPort,
		OsFamily:        item.OsFamily,
		OsName:          item.OsName,
		KernelVersion:   item.KernelVersion,
		Arch:            item.Arch,
		Environment:     item.Environment,
		Status:          item.Status,
		LifecycleStatus: item.LifecycleStatus,
		Provider:        item.Provider,
		RegionCode:      item.RegionCode,
		IdcCode:         item.IdcCode,
		ClusterName:     item.ClusterName,
		OwnerUserId:     item.OwnerUserId,
		OwnerName:       item.OwnerName,
		MaintainerTeam:  item.MaintainerTeam,
		Purpose:         item.Purpose,
		LastCheckInAt:   item.LastCheckInAt,
		LastInventoryAt: item.LastInventoryAt,
		LastOperatedAt:  item.LastOperatedAt,
		Remark:          item.Remark,
		CreatedAt:       item.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       item.UpdatedAt.Format(time.RFC3339),
	}
}

func (s *CmdbHostService) fromCreateReq(req *CmdbHostCreateReq) CmdbHost {
	return CmdbHost{
		HostCode:        req.HostCode,
		Hostname:        req.Hostname,
		DisplayName:     req.DisplayName,
		IpAddress:       req.IpAddress,
		SshPort:         req.SshPort,
		OsFamily:        req.OsFamily,
		OsName:          req.OsName,
		KernelVersion:   req.KernelVersion,
		Arch:            req.Arch,
		Environment:     req.Environment,
		Status:          req.Status,
		LifecycleStatus: req.LifecycleStatus,
		Provider:        req.Provider,
		RegionCode:      req.RegionCode,
		IdcCode:         req.IdcCode,
		ClusterName:     req.ClusterName,
		OwnerUserId:     req.OwnerUserId,
		OwnerName:       req.OwnerName,
		MaintainerTeam:  req.MaintainerTeam,
		Purpose:         req.Purpose,
		LastCheckInAt:   req.LastCheckInAt,
		LastInventoryAt: req.LastInventoryAt,
		LastOperatedAt:  req.LastOperatedAt,
		Remark:          req.Remark,
	}
}
