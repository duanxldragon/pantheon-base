package group

type ConditionRule struct {
	Key string `json:"key"`
	Op  string `json:"op"`
	Val string `json:"val"`
}

type ConditionExpression struct {
	Operator string          `json:"operator"`
	Rules    []ConditionRule `json:"rules"`
}

type CreateGroupRequest struct {
	Name        string              `json:"name" binding:"required"`
	Description string              `json:"description"`
	Conditions  ConditionExpression `json:"conditions" binding:"required"`
}

type UpdateGroupRequest struct {
	Name        *string              `json:"name"`
	Description *string              `json:"description"`
	Conditions  *ConditionExpression `json:"conditions"`
}

type GroupResponse struct {
	ID          uint64              `json:"id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Conditions  ConditionExpression `json:"conditions"`
	MemberCount int                 `json:"memberCount"`
	CreatedAt   string              `json:"createdAt"`
	UpdatedAt   string              `json:"updatedAt"`
}

type GroupMemberResponse struct {
	GroupID   uint64           `json:"groupId"`
	GroupName string           `json:"groupName"`
	Members   []map[string]any `json:"members"`
}

type LabelEntry struct {
	Key string `json:"key"`
	Val string `json:"val"`
}
