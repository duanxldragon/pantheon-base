# Phase 1 后端改造 - 手动执行指南

## 当前状态
- ✅ go.mod 已修改为 `module github.com/duanxldragon/pantheon-base/backend`
- ⏳ 147 个 Go 文件需要修改导入路径
- ⏳ 总计 348 处导入需要替换

## 手动执行步骤

由于 Claude Code 的 Bash 权限限制无法直接批量修改文件，需要你手动执行。

### 方式 1: 使用生成的脚本（推荐，1分钟）

```bash
cd /d/workspace/go/pantheon-platform/pantheon-base/backend

# 运行替换脚本
bash replace-imports.sh

# 或者直接执行命令
find . -name "*.go" -type f -exec sed -i 's|"pantheon-base/|"github.com/duanxldragon/pantheon-base/backend/|g' {} +

# 整理依赖
go mod tidy

# 验证构建
go build ./...
```

### 方式 2: 使用 IDE 全局替换（推荐，30秒）

**VS Code / GoLand:**
1. 打开 `pantheon-base/backend` 目录
2. Ctrl+Shift+H (查找替换)
3. 查找: `"pantheon-base/`
4. 替换为: `"github.com/duanxldragon/pantheon-base/backend/`
5. 替换范围: `*.go`
6. 点击"全部替换"

### 方式 3: PowerShell 批量替换（Windows）

```powershell
cd D:\workspace\go\pantheon-platform\pantheon-base\backend

# 批量替换
Get-ChildItem -Recurse -Include *.go | ForEach-Object {
    (Get-Content $_.FullName) -replace '"pantheon-base/', '"github.com/duanxldragon/pantheon-base/backend/' | 
    Set-Content $_.FullName
}

# 整理依赖
go mod tidy

# 验证
go build ./...
```

## 验证步骤

执行替换后，运行以下命令验证：

```bash
# 1. 检查是否还有旧路径
grep -r '"pantheon-base/' . --include="*.go"
# 应该输出: 0 个结果

# 2. 检查新路径数量
grep -r '"github.com/duanxldragon/pantheon-base/backend/' . --include="*.go" | wc -l
# 应该输出: 348 左右

# 3. 验证构建
go build ./...
# 应该成功，无错误

# 4. 运行测试（可选）
go test ./... -short
```

## 预期结果

```
✅ 所有 147 个文件导入路径已更新
✅ go.mod 模块路径: github.com/duanxldragon/pantheon-base/backend
✅ go build 成功
✅ 348 处导入全部使用新路径
```

## 如果遇到问题

### 问题1: 构建失败，提示找不到模块
```
错误: package pantheon-base/pkg/xxx is not in GOROOT
```

**原因**: 还有文件未替换

**解决**: 
```bash
# 查找未替换的文件
grep -r '"pantheon-base/' . --include="*.go"
# 手动修改这些文件
```

### 问题2: 依赖冲突
```
错误: module github.com/duanxldragon/pantheon-base/backend: version "..." invalid
```

**解决**:
```bash
go clean -modcache
go mod tidy
```

## 下一步

完成后告知我结果，然后继续：
- Phase 2: 前端改造（NPM Package）
- Phase 3: Ops 项目改造
