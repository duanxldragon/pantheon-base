package mdqaorderitem

import (
	"errors"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/database"
	"strings"
	"time"
	"gorm.io/gorm"
)

type MdqaorderitemService struct {
	db *gorm.DB
}

// NewMdqaorderitemService 构造函数
func NewMdqaorderitemService(db *gorm.DB) *MdqaorderitemService {
	return &MdqaorderitemService{db: db}
}

// Migrate 数据库迁移
func (s *MdqaorderitemService) Migrate() error {
	if s.db == nil {
		return errors.New("database.not_initialized")
	}
	return s.db.AutoMigrate(&Mdqaorderitem{})
}

// ListMdqaorderitems 分页列表查询
func (s *MdqaorderitemService) ListMdqaorderitems(query *MdqaorderitemListQuery, dataScope *common.DataScopeReq) (*MdqaorderitemListPageResp, error) {
	if query == nil {
		query = &MdqaorderitemListQuery{}
	}
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 10
	}
	var items []Mdqaorderitem
	var total int64

	db := s.db.Model(&Mdqaorderitem{}).Scopes(database.WithDataScope(dataScope))
	if query.ItemName != "" {
		db = db.Where("item_name LIKE ?", "%"+query.ItemName+"%")
	}
	if query.OrderId != nil {
		db = db.Where("order_id = ?", query.OrderId)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	// 分页和排序
	offset := (query.Page - 1) * query.PageSize
	orderBy := "id desc"
	sortFieldMap := map[string]string{
		"itemName": "item_name",
		"quantity": "quantity",
		"orderId": "order_id",
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
	listResp := make([]MdqaorderitemListResp, len(items))
	for i, item := range items {
		listResp[i] = s.toListResp(item)
	}

	return &MdqaorderitemListPageResp{
		Items:    listResp,
		Total:    total,
		Page:     query.Page,
		PageSize: query.PageSize,
	}, nil
}

// GetMdqaorderitemDetail 详情查询
func (s *MdqaorderitemService) GetMdqaorderitemDetail(id uint64) (*MdqaorderitemDetailResp, error) {
	var item Mdqaorderitem
	if err := s.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("mdqaorderitem.not_found")
		}
		return nil, err
	}
	detail := s.toDetailResp(item)
	return &detail, nil
}

// CreateMdqaorderitem 创建
func (s *MdqaorderitemService) CreateMdqaorderitem(req *MdqaorderitemCreateReq) (*MdqaorderitemListResp, error) {
	item := s.fromCreateReq(req)
	if err := s.db.Create(&item).Error; err != nil {
		return nil, err
	}
	resp := s.toListResp(item)
	return &resp, nil
}

// UpdateMdqaorderitem 更新
func (s *MdqaorderitemService) UpdateMdqaorderitem(id uint64, req *MdqaorderitemUpdateReq) (*MdqaorderitemListResp, error) {
	var item Mdqaorderitem
	if err := s.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("mdqaorderitem.not_found")
		}
		return nil, err
	}

	// 更新字段
	if req.ItemName != nil {
		item.ItemName = *req.ItemName
	}
	if req.Quantity != nil {
		item.Quantity = *req.Quantity
	}
	if req.Enabled != nil {
		item.Enabled = *req.Enabled
	}
	if req.Remark != nil {
		item.Remark = *req.Remark
	}
	if req.OrderId != nil {
		item.OrderId = *req.OrderId
	}

	if err := s.db.Save(&item).Error; err != nil {
		return nil, err
	}
	resp := s.toListResp(item)
	return &resp, nil
}

// DeleteMdqaorderitem 删除(软删除)
func (s *MdqaorderitemService) DeleteMdqaorderitem(id uint64) error {
	result := s.db.Delete(&Mdqaorderitem{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("mdqaorderitem.not_found")
	}
	return nil
}

// ========== DTO 转换方法 ==========

func (s *MdqaorderitemService) toListResp(item Mdqaorderitem) MdqaorderitemListResp {
	return MdqaorderitemListResp{
		ID: item.ID,
		ItemName: item.ItemName,
		Quantity: item.Quantity,
		Enabled: item.Enabled,
		OrderId: item.OrderId,
		CreatedAt: item.CreatedAt.Format(time.RFC3339),
	}
}

func (s *MdqaorderitemService) toDetailResp(item Mdqaorderitem) MdqaorderitemDetailResp {
	return MdqaorderitemDetailResp{
		ID: item.ID,
		ItemName: item.ItemName,
		Quantity: item.Quantity,
		Enabled: item.Enabled,
		Remark: item.Remark,
		OrderId: item.OrderId,
		CreatedAt: item.CreatedAt.Format(time.RFC3339),
		UpdatedAt: item.UpdatedAt.Format(time.RFC3339),
	}
}

func (s *MdqaorderitemService) fromCreateReq(req *MdqaorderitemCreateReq) Mdqaorderitem {
	return Mdqaorderitem{
		ItemName: req.ItemName,
		Quantity: req.Quantity,
		Enabled: req.Enabled,
		Remark: req.Remark,
		OrderId: req.OrderId,
	}
}
