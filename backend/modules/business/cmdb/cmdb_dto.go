package cmdb

import "pantheon-platform/backend/pkg/impexp"

type CMDBTypeResp struct {
	ID        uint64 `json:"id"`
	TypeCode  string `json:"typeCode"`
	TypeName  string `json:"typeName"`
	Category  string `json:"category"`
	Status    int    `json:"status"`
	Remark    string `json:"remark"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type CMDBTypeListQuery struct {
	TypeCode string `form:"typeCode" json:"typeCode"`
	TypeName string `form:"typeName" json:"typeName"`
	Category string `form:"category" json:"category"`
	Status   *int   `form:"status" json:"status"`
	Page     int    `form:"page" json:"page"`
	PageSize int    `form:"pageSize" json:"pageSize"`
}

type CMDBTypePageResp struct {
	Items    []CMDBTypeResp `json:"items"`
	Total    int64          `json:"total"`
	Page     int            `json:"page"`
	PageSize int            `json:"pageSize"`
}

type CMDBTypeCreateReq struct {
	TypeCode string `json:"typeCode" binding:"required"`
	TypeName string `json:"typeName" binding:"required"`
	Category string `json:"category"`
	Status   int    `json:"status"`
	Remark   string `json:"remark"`
}

type CMDBTypeUpdateReq struct {
	TypeCode string `json:"typeCode" binding:"required"`
	TypeName string `json:"typeName" binding:"required"`
	Category string `json:"category"`
	Status   int    `json:"status"`
	Remark   string `json:"remark"`
}

type CMDBTypeImportRow struct {
	TypeCode string
	TypeName string
	Category string
	Status   int
	Remark   string
	Existing *BizCMDBType
}

type CMDBItemResp struct {
	ID          uint64 `json:"id"`
	TypeID      uint64 `json:"typeId"`
	TypeCode    string `json:"typeCode"`
	TypeName    string `json:"typeName"`
	ItemCode    string `json:"itemCode"`
	ItemName    string `json:"itemName"`
	Environment string `json:"environment"`
	Status      string `json:"status"`
	OwnerUserID uint64 `json:"ownerUserId"`
	OwnerDeptID uint64 `json:"ownerDeptId"`
	Endpoint    string `json:"endpoint"`
	Description string `json:"description"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type CMDBRelationResp struct {
	ID             uint64 `json:"id"`
	SourceItemID   uint64 `json:"sourceItemId"`
	SourceItemCode string `json:"sourceItemCode"`
	SourceItemName string `json:"sourceItemName"`
	TargetItemID   uint64 `json:"targetItemId"`
	TargetItemCode string `json:"targetItemCode"`
	TargetItemName string `json:"targetItemName"`
	RelationType   string `json:"relationType"`
	Remark         string `json:"remark"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
}

type CMDBItemDetailResp struct {
	CMDBItemResp
	OwnerDeptName     string             `json:"ownerDeptName"`
	OutgoingRelations []CMDBRelationResp `json:"outgoingRelations"`
	IncomingRelations []CMDBRelationResp `json:"incomingRelations"`
}

type CMDBItemListQuery struct {
	TypeID      uint64 `form:"typeId" json:"typeId"`
	ItemCode    string `form:"itemCode" json:"itemCode"`
	ItemName    string `form:"itemName" json:"itemName"`
	Environment string `form:"environment" json:"environment"`
	Status      string `form:"status" json:"status"`
	Page        int    `form:"page" json:"page"`
	PageSize    int    `form:"pageSize" json:"pageSize"`
}

type CMDBItemPageResp struct {
	Items    []CMDBItemResp `json:"items"`
	Total    int64          `json:"total"`
	Page     int            `json:"page"`
	PageSize int            `json:"pageSize"`
}

type CMDBItemCreateReq struct {
	TypeID      uint64 `json:"typeId" binding:"required"`
	ItemCode    string `json:"itemCode" binding:"required"`
	ItemName    string `json:"itemName" binding:"required"`
	Environment string `json:"environment"`
	Status      string `json:"status"`
	OwnerUserID uint64 `json:"ownerUserId"`
	OwnerDeptID uint64 `json:"ownerDeptId"`
	Endpoint    string `json:"endpoint"`
	Description string `json:"description"`
}

type CMDBItemUpdateReq struct {
	TypeID      uint64 `json:"typeId" binding:"required"`
	ItemCode    string `json:"itemCode" binding:"required"`
	ItemName    string `json:"itemName" binding:"required"`
	Environment string `json:"environment"`
	Status      string `json:"status"`
	OwnerUserID uint64 `json:"ownerUserId"`
	OwnerDeptID uint64 `json:"ownerDeptId"`
	Endpoint    string `json:"endpoint"`
	Description string `json:"description"`
}

type CMDBRelationCreateReq struct {
	SourceItemID uint64 `json:"sourceItemId" binding:"required"`
	TargetItemID uint64 `json:"targetItemId" binding:"required"`
	RelationType string `json:"relationType" binding:"required"`
	Remark       string `json:"remark"`
}

type CMDBItemImportRow struct {
	TypeID      uint64
	ItemCode    string
	ItemName    string
	Environment string
	Status      string
	OwnerUserID uint64
	OwnerDeptID uint64
	Endpoint    string
	Description string
	Existing    *BizCMDBItem
}

type CMDBImportResult = impexp.ImportResult
