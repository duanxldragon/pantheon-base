package system

type DeptTreeResp struct {
	ID        uint64          `json:"id"`
	ParentID  uint64          `json:"parentId"`
	Ancestors string          `json:"ancestors"`
	IsRoot    bool            `json:"isRoot"`
	DeptName  string          `json:"deptName"`
	Sort      int             `json:"sort"`
	Leader    string          `json:"leader"`
	Phone     string          `json:"phone"`
	Email     string          `json:"email"`
	Status    int             `json:"status"`
	Children  []*DeptTreeResp `json:"children,omitempty"`
}

type DeptListQuery struct {
	DeptName  string `form:"deptName" json:"deptName"`
	Status    *int   `form:"status" json:"status"`
	SortField string `form:"sortField" json:"sortField"`
	SortOrder string `form:"sortOrder" json:"sortOrder"`
}

type DeptCreateReq struct {
	ParentID uint64 `json:"parentId"`
	DeptName string `json:"deptName" binding:"required"`
	Sort     int    `json:"sort"`
	Leader   string `json:"leader"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Status   int    `json:"status"`
}

type DeptUpdateReq struct {
	ParentID uint64 `json:"parentId"`
	DeptName string `json:"deptName" binding:"required"`
	Sort     int    `json:"sort"`
	Leader   string `json:"leader"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Status   int    `json:"status"`
}

type DeptBatchStatusReq struct {
	DeptIDs []uint64 `json:"deptIds"`
	Status  int      `json:"status"`
}
