package mdqaorder



// MdqaorderListResp 列表页返回 DTO
type MdqaorderListResp struct {
	ID uint64 `json:"id"`
	Name string `json:"name"`
	Status string `json:"status"`
	CreatedAt string `json:"createdAt"`
}

// MdqaorderListPageResp 分页响应
type MdqaorderListPageResp struct {
	Items    []MdqaorderListResp `json:"items"`
	Total    int64                   `json:"total"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"pageSize"`
}

// MdqaorderDetailResp 详情返回 DTO
type MdqaorderDetailResp struct {
	ID uint64 `json:"id"`
	Name string `json:"name"`
	Status string `json:"status"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// MdqaorderListQuery 查询参数
type MdqaorderListQuery struct {
	Name string `form:"name" json:"name"`
	Status string `form:"status" json:"status"`
	Page int `form:"page" json:"page"`
	PageSize int `form:"pageSize" json:"pageSize"`
	SortField string `form:"sortField" json:"sortField"`
	SortOrder string `form:"sortOrder" json:"sortOrder"`
}

// MdqaorderCreateReq 创建请求
type MdqaorderCreateReq struct {
	Name string `json:"name" binding:"required"`
	Status string `json:"status" binding:"required"`
}

// MdqaorderUpdateReq 更新请求
type MdqaorderUpdateReq struct {
	Name *string `json:"name"`
	Status *string `json:"status"`
}
