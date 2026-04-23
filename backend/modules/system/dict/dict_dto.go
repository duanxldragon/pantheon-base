package system

type DictTypeResp struct {
	ID        uint64 `json:"id"`
	DictCode  string `json:"dictCode"`
	DictName  string `json:"dictName"`
	Module    string `json:"module"`
	Status    int    `json:"status"`
	Remark    string `json:"remark"`
	CreatedAt string `json:"createdAt"`
}

type DictTypeListQuery struct {
	DictCode string `form:"dictCode" json:"dictCode"`
	DictName string `form:"dictName" json:"dictName"`
	Status   *int   `form:"status" json:"status"`
}

type DictTypeCreateReq struct {
	DictCode string `json:"dictCode" binding:"required"`
	DictName string `json:"dictName" binding:"required"`
	Module   string `json:"module"`
	Status   int    `json:"status"`
	Remark   string `json:"remark"`
}

type DictTypeUpdateReq struct {
	DictCode string `json:"dictCode" binding:"required"`
	DictName string `json:"dictName" binding:"required"`
	Module   string `json:"module"`
	Status   int    `json:"status"`
	Remark   string `json:"remark"`
}

type DictItemResp struct {
	ID           uint64 `json:"id"`
	DictCode     string `json:"dictCode"`
	ItemLabelKey string `json:"itemLabelKey"`
	ItemValue    string `json:"itemValue"`
	ItemColor    string `json:"itemColor"`
	Sort         int    `json:"sort"`
	Status       int    `json:"status"`
	Remark       string `json:"remark"`
	CreatedAt    string `json:"createdAt"`
}

type DictItemListQuery struct {
	DictCode string `form:"dictCode" json:"dictCode"`
	Status   *int   `form:"status" json:"status"`
}

type DictItemCreateReq struct {
	DictCode     string `json:"dictCode" binding:"required"`
	ItemLabelKey string `json:"itemLabelKey" binding:"required"`
	ItemValue    string `json:"itemValue" binding:"required"`
	ItemColor    string `json:"itemColor"`
	Sort         int    `json:"sort"`
	Status       int    `json:"status"`
	Remark       string `json:"remark"`
}

type DictItemUpdateReq struct {
	DictCode     string `json:"dictCode" binding:"required"`
	ItemLabelKey string `json:"itemLabelKey" binding:"required"`
	ItemValue    string `json:"itemValue" binding:"required"`
	ItemColor    string `json:"itemColor"`
	Sort         int    `json:"sort"`
	Status       int    `json:"status"`
	Remark       string `json:"remark"`
}

type DictOptionResp struct {
	LabelKey string `json:"labelKey"`
	Value    string `json:"value"`
	Color    string `json:"color"`
	Sort     int    `json:"sort"`
}

type DictOptionMapResp map[string][]DictOptionResp

type DictCacheRefreshReq struct {
	Codes []string `json:"codes"`
}

type DictCacheRefreshResp struct {
	RefreshedCodes []string `json:"refreshedCodes"`
	ClearedAll     int      `json:"clearedAll"`
}
