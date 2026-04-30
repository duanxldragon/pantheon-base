# 数据权限架构钩子 (Data Permission Hook)

更新时间：2026-04-17

类型：Design
归属层：system/iam
状态：Active

本文定义 Pantheon 平台的数据权限（行级过滤）架构占位规范，用于支持未来“部门级”、“本人级”或“自定义维度”的数据隔离需求。

## 1. 核心契约

### 1.1 数据结构 (`backend/pkg/common/data_scope.go`)
- `DataScopeReq`: 封装了当前用户的身份标识（UserID, DeptID, RoleKeys）以及资源标识。

### 1.2 GORM 钩子 (`backend/pkg/database/scope.go`)
- `WithDataScope(req *common.DataScopeReq)`: 这是一个标准的 GORM Scope。
- **规范**：所有涉及“多行数据读取”的业务方法（如 `ListXXX`, `ExportXXX`）**必须**接受该参数并在查询时注入。

## 2. 使用范例

### 后端 Service 层
```go
func (s *OrderService) ListOrders(query *OrderQuery, dataScope *common.DataScopeReq) (*OrderPageResp, error) {
    db := s.db.Model(&Order{}).Scopes(database.WithDataScope(dataScope))
    // ... 其他查询逻辑
}
```

### 后端 Handler 层
```go
func (h *OrderHandler) List(c *gin.Context) {
    dataScope := common.GetDataScope(c)
    resp, err := h.svc.ListOrders(&query, dataScope)
    // ... 
}
```

## 3. 未来扩展路径 (Roadmap)

目前 `WithDataScope` 仅作为占位符。未来我们将按以下步骤补全逻辑：

1. **中间件注入**：在 `JWTAuthMiddleware` 之后增加 `DataScopeMiddleware`，根据用户角色配置（如：角色 A 拥有“本部门数据权限”），构造好 `DataScopeReq` 并存入 Context。
2. **多租户支持**：在 `WithDataScope` 中自动注入 `tenant_id = ?` 条件。
3. **Casbin 集成**：利用 Casbin 的逻辑表达式（如 `r.obj.owner == r.sub.id`）动态生成 SQL 过滤片段。
4. **脚手架集成**：已同步更新业务模块脚手架，新生成的模块将默认包含数据权限注入点。

## 4. 为什么现在做占位？

- **预防大规模重构**：如果在系统上线后再加数据权限，需要修改成百上千个 Service 方法签名。
- **确立开发文化**：让业务开发者从第一天起就意识到“数据是有归属和边界的”。
