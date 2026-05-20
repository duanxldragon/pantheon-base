package mdqaorderitem



// MdqaorderitemListResp 列表页返回 DTO
type MdqaorderitemListResp struct {
	ID uint64 `json:"id"`
	ItemName string `json:"itemName"`
	Quantity int64 `json:"quantity"`
	Enabled bool `json:"enabled"`
	OrderId int64 `json:"orderId"`
	CreatedAt string `json:"createdAt"`
}

// MdqaorderitemListPageResp 分页响应
type MdqaorderitemListPageResp struct {
	Items    []MdqaorderitemListResp `json:"items"`
	Total    int64                   `json:"total"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"pageSize"`
}

// MdqaorderitemDetailResp 详情返回 DTO
type MdqaorderitemDetailResp struct {
	ID uint64 `json:"id"`
	ItemName string `json:"itemName"`
	Quantity int64 `json:"quantity"`
	Enabled bool `json:"enabled"`
	Remark string `json:"remark"`
	OrderId int64 `json:"orderId"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// MdqaorderitemListQuery 查询参数
type MdqaorderitemListQuery struct {
	ItemName string `form:"itemName" json:"itemName"`
	OrderId *int64 `form:"orderId" json:"orderId"`
	Page int `form:"page" json:"page"`
	PageSize int `form:"pageSize" json:"pageSize"`
	SortField string `form:"sortField" json:"sortField"`
	SortOrder string `form:"sortOrder" json:"sortOrder"`
}

// MdqaorderitemCreateReq 创建请求
type MdqaorderitemCreateReq struct {
	ItemName string `json:"itemName" binding:"required"`
	Quantity int64 `json:"quantity" binding:"required"`
	Enabled bool `json:"enabled"`
	Remark string `json:"remark"`
	OrderId int64 `json:"orderId" binding:"required"`
}

// MdqaorderitemUpdateReq 更新请求
type MdqaorderitemUpdateReq struct {
	ItemName *string `json:"itemName"`
	Quantity *int64 `json:"quantity"`
	Enabled *bool `json:"enabled"`
	Remark *string `json:"remark"`
	OrderId *int64 `json:"orderId"`
}
