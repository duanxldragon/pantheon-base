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

type GroupMemberListResponse struct {
	GroupID   uint64         `json:"groupId"`
	GroupName string         `json:"groupName"`
	Members   []HostResponse `json:"members"`
}

type HostResponse struct {
	ID          uint64       `json:"id"`
	Hostname    string       `json:"hostname"`
	IP          string       `json:"ip"`
	Status      string       `json:"status"`
	OS          string       `json:"os"`
	OSVersion   string       `json:"osVersion"`
	CPUCores    int          `json:"cpuCores"`
	MemoryGB    float64      `json:"memoryGb"`
	DiskGB      float64      `json:"diskGb"`
	DeptID      uint64       `json:"deptId"`
	LabelValues []LabelEntry `json:"labelValues"`
}

type LabelEntry struct {
	Key string `json:"key"`
	Val string `json:"val"`
}
