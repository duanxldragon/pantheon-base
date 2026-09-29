package tenant

import (
	"errors"
	"fmt"

	"gorm.io/gorm"
)

var (
	ErrTenantNotFound       = errors.New("tenant not found")
	ErrTenantCodeExists     = errors.New("tenant code already exists")
	ErrTenantHasActiveUsers = errors.New("tenant has active users, cannot delete")
	ErrMembershipExists     = errors.New("user is already a member of this tenant")
	ErrMembershipNotFound   = errors.New("tenant membership not found")
)

// TenantService handles tenant CRUD and lifecycle operations
type TenantService struct {
	db *gorm.DB
}

// NewTenantService creates a new tenant service instance
func NewTenantService(db *gorm.DB) *TenantService {
	return &TenantService{db: db}
}

// CreateTenant creates a new tenant with default settings
func (s *TenantService) CreateTenant(dto CreateTenantDTO) (*Tenant, error) {
	// Check if code already exists
	var exists int64
	if err := s.db.Model(&Tenant{}).Where("code = ?", dto.Code).Count(&exists).Error; err != nil {
		return nil, fmt.Errorf("check tenant code uniqueness: %w", err)
	}
	if exists > 0 {
		return nil, ErrTenantCodeExists
	}

	tenant := &Tenant{
		Code:     dto.Code,
		Name:     dto.Name,
		Status:   "active",
		Plan:     dto.Plan,
		Metadata: dto.Metadata,
	}

	if tenant.Plan == "" {
		tenant.Plan = "free"
	}

	if err := s.db.Create(tenant).Error; err != nil {
		return nil, fmt.Errorf("create tenant: %w", err)
	}

	return tenant, nil
}

// GetTenantByID retrieves a tenant by its ID
func (s *TenantService) GetTenantByID(id uint64) (*Tenant, error) {
	var tenant Tenant
	if err := s.db.First(&tenant, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTenantNotFound
		}
		return nil, fmt.Errorf("get tenant by id: %w", err)
	}
	return &tenant, nil
}

// GetTenantByCode retrieves a tenant by its code
func (s *TenantService) GetTenantByCode(code string) (*Tenant, error) {
	var tenant Tenant
	if err := s.db.Where("code = ?", code).First(&tenant).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTenantNotFound
		}
		return nil, fmt.Errorf("get tenant by code: %w", err)
	}
	return &tenant, nil
}

// ListTenants returns a paginated list of tenants
func (s *TenantService) ListTenants(filter TenantFilter) (*TenantListResponse, error) {
	// Set defaults
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Size < 1 {
		filter.Size = 20
	}

	query := s.db.Model(&Tenant{})

	// Apply filters
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.Plan != "" {
		query = query.Where("plan = ?", filter.Plan)
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("count tenants: %w", err)
	}

	// Fetch page
	var tenants []Tenant
	offset := (filter.Page - 1) * filter.Size
	if err := query.Order("id DESC").Limit(filter.Size).Offset(offset).Find(&tenants).Error; err != nil {
		return nil, fmt.Errorf("list tenants: %w", err)
	}

	return &TenantListResponse{
		Items: tenants,
		Total: total,
		Page:  filter.Page,
		Size:  filter.Size,
	}, nil
}

// UpdateTenant updates tenant fields
func (s *TenantService) UpdateTenant(id uint64, dto UpdateTenantDTO) error {
	tenant, err := s.GetTenantByID(id)
	if err != nil {
		return err
	}

	updates := make(map[string]interface{})
	if dto.Name != nil {
		updates["name"] = *dto.Name
	}
	if dto.Status != nil {
		updates["status"] = *dto.Status
	}
	if dto.Plan != nil {
		updates["plan"] = *dto.Plan
	}
	if dto.Metadata != nil {
		updates["metadata"] = *dto.Metadata
	}

	if len(updates) == 0 {
		return nil // No updates
	}

	if err := s.db.Model(tenant).Updates(updates).Error; err != nil {
		return fmt.Errorf("update tenant: %w", err)
	}

	return nil
}

// DeleteTenant soft-deletes a tenant (marks as deleted status)
func (s *TenantService) DeleteTenant(id uint64) error {
	// Check if tenant has active members
	var memberCount int64
	if err := s.db.Model(&TenantMembership{}).
		Where("tenant_id = ? AND status = ?", id, "active").
		Count(&memberCount).Error; err != nil {
		return fmt.Errorf("check tenant members: %w", err)
	}

	if memberCount > 0 {
		return ErrTenantHasActiveUsers
	}

	// Mark tenant as deleted
	if err := s.db.Model(&Tenant{}).Where("id = ?", id).Update("status", "deleted").Error; err != nil {
		return fmt.Errorf("delete tenant: %w", err)
	}

	return nil
}

// AddMember adds a user to a tenant with specified role
func (s *TenantService) AddMember(tenantID, userID uint64, role string) error {
	// Verify tenant exists
	if _, err := s.GetTenantByID(tenantID); err != nil {
		return err
	}

	// Check if membership already exists
	var exists int64
	if err := s.db.Model(&TenantMembership{}).
		Where("tenant_id = ? AND user_id = ?", tenantID, userID).
		Count(&exists).Error; err != nil {
		return fmt.Errorf("check membership existence: %w", err)
	}
	if exists > 0 {
		return ErrMembershipExists
	}

	membership := &TenantMembership{
		TenantID: tenantID,
		UserID:   userID,
		Role:     role,
		Status:   "active",
	}

	if err := s.db.Create(membership).Error; err != nil {
		return fmt.Errorf("create membership: %w", err)
	}

	return nil
}

// RemoveMember removes a user from a tenant
func (s *TenantService) RemoveMember(tenantID, userID uint64) error {
	result := s.db.Where("tenant_id = ? AND user_id = ?", tenantID, userID).
		Delete(&TenantMembership{})

	if result.Error != nil {
		return fmt.Errorf("remove membership: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return ErrMembershipNotFound
	}

	return nil
}

// ListTenantMembers returns all members of a tenant
func (s *TenantService) ListTenantMembers(tenantID uint64) ([]TenantMembership, error) {
	var memberships []TenantMembership
	if err := s.db.Where("tenant_id = ? AND status = ?", tenantID, "active").
		Order("created_at ASC").
		Find(&memberships).Error; err != nil {
		return nil, fmt.Errorf("list tenant members: %w", err)
	}
	return memberships, nil
}

// GetUserTenants returns all tenants a user belongs to
func (s *TenantService) GetUserTenants(userID uint64) ([]Tenant, error) {
	var tenants []Tenant
	if err := s.db.Table("tenants").
		Joins("INNER JOIN tenant_memberships ON tenant_memberships.tenant_id = tenants.id").
		Where("tenant_memberships.user_id = ? AND tenant_memberships.status = ?", userID, "active").
		Where("tenants.status = ?", "active").
		Order("tenants.id ASC").
		Find(&tenants).Error; err != nil {
		return nil, fmt.Errorf("get user tenants: %w", err)
	}
	return tenants, nil
}

// InitializeTenantDefaults creates default resources for a new tenant
// (roles, menus, settings, etc.)
func (s *TenantService) InitializeTenantDefaults(tenantID uint64) error {
	// TODO: Phase 2.2 - Implement default resource creation
	// This should create:
	// - Default roles (admin, user)
	// - Default menus
	// - Default settings
	// - Default permissions
	// For now, this is a placeholder
	return nil
}
