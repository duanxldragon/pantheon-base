package tenant

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for tenant management
type Handler struct {
	service *Service
}

// NewHandler creates a new tenant handler instance
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// CreateTenant godoc
// @Summary Create a new tenant
// @Description Create a new tenant (platform_ops role required)
// @Tags Tenant
// @Accept json
// @Produce json
// @Param body body CreateTenantDTO true "Tenant creation data"
// @Success 201 {object} Tenant
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Router /api/v1/tenants [post]
func (h *Handler) CreateTenant(c *gin.Context) {
	var dto CreateTenantDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenant, err := h.service.CreateTenant(dto)
	if err != nil {
		if err == ErrTenantCodeExists {
			c.JSON(http.StatusConflict, gin.H{"error": "tenant code already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tenant)
}

// GetTenant godoc
// @Summary Get tenant by ID
// @Description Get tenant details by ID
// @Tags Tenant
// @Produce json
// @Param id path int true "Tenant ID"
// @Success 200 {object} Tenant
// @Failure 404 {object} map[string]string
// @Router /api/v1/tenants/{id} [get]
func (h *Handler) GetTenant(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant id"})
		return
	}

	tenant, err := h.service.GetTenantByID(id)
	if err != nil {
		if err == ErrTenantNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "tenant not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tenant)
}

// ListTenants godoc
// @Summary List tenants
// @Description List tenants with pagination and filters
// @Tags Tenant
// @Produce json
// @Param status query string false "Filter by status (active, suspended, deleted)"
// @Param plan query string false "Filter by plan (free, basic, professional, enterprise)"
// @Param page query int false "Page number (default 1)"
// @Param size query int false "Page size (default 20, max 100)"
// @Success 200 {object} ListResponse
// @Router /api/v1/tenants [get]
func (h *Handler) ListTenants(c *gin.Context) {
	var filter Filter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.service.ListTenants(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateTenant godoc
// @Summary Update tenant
// @Description Update tenant properties (platform_ops role required)
// @Tags Tenant
// @Accept json
// @Produce json
// @Param id path int true "Tenant ID"
// @Param body body UpdateTenantDTO true "Tenant update data"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/tenants/{id} [put]
func (h *Handler) UpdateTenant(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant id"})
		return
	}

	var dto UpdateTenantDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateTenant(id, dto); err != nil {
		if err == ErrTenantNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "tenant not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "tenant updated successfully"})
}

// DeleteTenant godoc
// @Summary Delete tenant
// @Description Mark tenant as deleted (platform_ops role required)
// @Tags Tenant
// @Param id path int true "Tenant ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/tenants/{id} [delete]
func (h *Handler) DeleteTenant(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant id"})
		return
	}

	if err := h.service.DeleteTenant(id); err != nil {
		if err == ErrTenantNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "tenant not found"})
			return
		}
		if err == ErrTenantHasActiveUsers {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete tenant with active members"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "tenant deleted successfully"})
}

// AddTenantMember godoc
// @Summary Add member to tenant
// @Description Add a user as a member of a tenant
// @Tags Tenant
// @Accept json
// @Produce json
// @Param id path int true "Tenant ID"
// @Param body body AddTenantMemberDTO true "Member data"
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Router /api/v1/tenants/{id}/members [post]
func (h *Handler) AddTenantMember(c *gin.Context) {
	tenantID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant id"})
		return
	}

	var dto AddTenantMemberDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AddMember(tenantID, dto.UserID, dto.Role); err != nil {
		if err == ErrTenantNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "tenant not found"})
			return
		}
		if err == ErrMembershipExists {
			c.JSON(http.StatusConflict, gin.H{"error": "user is already a member"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "member added successfully"})
}

// RemoveTenantMember godoc
// @Summary Remove member from tenant
// @Description Remove a user from a tenant
// @Tags Tenant
// @Param id path int true "Tenant ID"
// @Param user_id path int true "User ID"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/tenants/{id}/members/{user_id} [delete]
func (h *Handler) RemoveTenantMember(c *gin.Context) {
	tenantID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant id"})
		return
	}

	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	if err := h.service.RemoveMember(tenantID, userID); err != nil {
		if err == ErrMembershipNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "membership not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "member removed successfully"})
}

// ListTenantMembers godoc
// @Summary List tenant members
// @Description List all members of a tenant
// @Tags Tenant
// @Produce json
// @Param id path int true "Tenant ID"
// @Success 200 {array} Membership
// @Router /api/v1/tenants/{id}/members [get]
func (h *Handler) ListTenantMembers(c *gin.Context) {
	tenantID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant id"})
		return
	}

	members, err := h.service.ListTenantMembers(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, members)
}

// GetMyTenants godoc
// @Summary Get current user's tenants
// @Description Get all tenants the current user belongs to
// @Tags Tenant
// @Produce json
// @Success 200 {array} Tenant
// @Router /api/v1/tenants/my [get]
func (h *Handler) GetMyTenants(c *gin.Context) {
	// Extract user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	uid, ok := userID.(uint64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user id type"})
		return
	}

	tenants, err := h.service.GetUserTenants(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tenants)
}
