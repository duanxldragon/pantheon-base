package system

type OperationLogResp struct {
	ID           uint64 `json:"id"`
	Title        string `json:"title"`
	BusinessType int    `json:"businessType"`
	Method       string `json:"method"`
	OperName     string `json:"operName"`
	OperURL      string `json:"operUrl"`
	OperIP       string `json:"operIp"`
	OperParam    string `json:"operParam"`
	JsonResult   string `json:"jsonResult"`
	Status       int    `json:"status"`
	ErrorMsg     string `json:"errorMsg"`
	OperTime     string `json:"operTime"`
	CostTime     int64  `json:"costTime"`
}

type OperationLogPageResp struct {
	Items    []OperationLogResp `json:"items"`
	Total    int64              `json:"total"`
	Page     int                `json:"page"`
	PageSize int                `json:"pageSize"`
}

type OperationLogQuery struct {
	Title        string `form:"title" json:"title"`
	OperName     string `form:"operName" json:"operName"`
	Status       *int   `form:"status" json:"status"`
	BusinessType *int   `form:"businessType" json:"businessType"`
	Page         int    `form:"page" json:"page"`
	PageSize     int    `form:"pageSize" json:"pageSize"`
}
