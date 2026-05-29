package mdqaorder

import (
	"errors"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/database"

	"gorm.io/gorm"
	"strings"
	"time"
)

type MdqaorderService struct {
	db *gorm.DB
}

// NewMdqaorderService 构造函数
func NewMdqaorderService(db *gorm.DB) *MdqaorderService {
	return &MdqaorderService{db: db}
}

// Migrate 数据库迁移
func (s *MdqaorderService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	if err := s.db.AutoMigrate(&Mdqaorder{}); err != nil {
		return err
	}
	return nil
}

// ListMdqaorders 分页列表查询
func (s *MdqaorderService) ListMdqaorders(query *MdqaorderListQuery, dataScope *common.DataScopeReq) (*MdqaorderListPageResp, error) {
	if query == nil {
		query = &MdqaorderListQuery{}
	}
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 10
	}
	var items []Mdqaorder
	var total int64

	db := s.db.Model(&Mdqaorder{}).Scopes(database.WithDataScope(dataScope))
	if query.Name != "" {
		db = db.Where("name LIKE ?", "%"+query.Name+"%")
	}
	if query.Status != "" {
		db = db.Where("status LIKE ?", "%"+query.Status+"%")
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	// 分页和排序
	offset := (query.Page - 1) * query.PageSize
	orderBy := "id desc"
	sortFieldMap := map[string]string{
		"name":      "name",
		"status":    "status",
		"createdAt": "created_at",
		"updatedAt": "updated_at",
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
	listResp := make([]MdqaorderListResp, len(items))
	for i, item := range items {
		listResp[i] = s.toListResp(item)
	}

	return &MdqaorderListPageResp{
		Items:    listResp,
		Total:    total,
		Page:     query.Page,
		PageSize: query.PageSize,
	}, nil
}

// ListMdqaorderOptions 关系选择器选项
func (s *MdqaorderService) ListMdqaorderOptions() ([]MdqaorderOptionItem, error) {
	var items []Mdqaorder
	if err := s.db.Model(&Mdqaorder{}).Order("id desc").Limit(100).Find(&items).Error; err != nil {
		return nil, err
	}
	options := make([]MdqaorderOptionItem, len(items))
	for i, item := range items {
		options[i] = MdqaorderOptionItem{
			Label: item.Name,
			Value: item.ID,
			ID:    item.ID,
			Name:  item.Name,
		}
	}
	return options, nil
}

// GetMdqaorderDetail 详情查询
func (s *MdqaorderService) GetMdqaorderDetail(id uint64) (*MdqaorderDetailResp, error) {
	var item Mdqaorder
	if err := s.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("mdqaorder.not_found")
		}
		return nil, err
	}
	detail := s.toDetailResp(item)
	return &detail, nil
}

// CreateMdqaorder 创建
func (s *MdqaorderService) CreateMdqaorder(req *MdqaorderCreateReq) (*MdqaorderListResp, error) {
	item := s.fromCreateReq(req)
	if err := s.db.Create(&item).Error; err != nil {
		return nil, err
	}
	resp := s.toListResp(item)
	return &resp, nil
}

// UpdateMdqaorder 更新
func (s *MdqaorderService) UpdateMdqaorder(id uint64, req *MdqaorderUpdateReq) (*MdqaorderListResp, error) {
	var item Mdqaorder
	if err := s.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("mdqaorder.not_found")
		}
		return nil, err
	}

	// 更新字段
	if req.Name != nil {
		item.Name = *req.Name
	}
	if req.Status != nil {
		item.Status = *req.Status
	}

	if err := s.db.Save(&item).Error; err != nil {
		return nil, err
	}
	resp := s.toListResp(item)
	return &resp, nil
}

// DeleteMdqaorder 删除(软删除)
func (s *MdqaorderService) DeleteMdqaorder(id uint64) error {
	result := s.db.Delete(&Mdqaorder{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("mdqaorder.not_found")
	}
	return nil
}

// ========== DTO 转换方法 ==========

func (s *MdqaorderService) toListResp(item Mdqaorder) MdqaorderListResp {
	return MdqaorderListResp{
		ID:        item.ID,
		Name:      item.Name,
		Status:    item.Status,
		CreatedAt: item.CreatedAt.Format(time.RFC3339),
	}
}

func (s *MdqaorderService) toDetailResp(item Mdqaorder) MdqaorderDetailResp {
	return MdqaorderDetailResp{
		ID:        item.ID,
		Name:      item.Name,
		Status:    item.Status,
		CreatedAt: item.CreatedAt.Format(time.RFC3339),
		UpdatedAt: item.UpdatedAt.Format(time.RFC3339),
	}
}

func (s *MdqaorderService) fromCreateReq(req *MdqaorderCreateReq) Mdqaorder {
	return Mdqaorder{
		Name:   req.Name,
		Status: req.Status,
	}
}
