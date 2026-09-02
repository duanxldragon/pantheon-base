#!/bin/bash
# 批量替换 Go 导入路径的脚本
# 用法: ./replace-imports.sh

echo "开始批量替换 pantheon-base 导入路径..."

# 统计需要修改的文件数
total=$(find . -name "*.go" -type f -exec grep -l '"pantheon-base/' {} \; | wc -l)
echo "共找到 $total 个需要修改的文件"

# 批量替换
find . -name "*.go" -type f -exec sed -i 's|"pantheon-base/|"github.com/duanxldragon/pantheon-base/backend/|g' {} +

# 验证结果
remaining=$(grep -r '"pantheon-base/' . --include="*.go" | wc -l)
echo "替换完成，剩余旧路径: $remaining 处"

# 整理依赖
echo "正在整理 go.mod..."
go mod tidy

# 验证新路径
new_imports=$(grep -r '"github.com/duanxldragon/pantheon-base/backend/' . --include="*.go" | wc -l)
echo "新路径导入数: $new_imports 处"

echo "完成！请运行 'go build ./...' 验证"
