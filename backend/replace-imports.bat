@echo off
REM 批量替换 Go 导入路径的 Windows 批处理脚本
echo 开始批量替换 pantheon-base 导入路径...

REM 使用 PowerShell 执行替换
powershell -Command "Get-ChildItem -Recurse -Include *.go | ForEach-Object { $content = Get-Content $_.FullName -Raw; $content = $content -replace '\"pantheon-base/', '\"github.com/duanxldragon/pantheon-base/backend/'; Set-Content $_.FullName -Value $content -NoNewline }"

echo 替换完成！

REM 整理依赖
echo 正在整理 go.mod...
go mod tidy

echo 完成！验证构建中...
go build ./...

if %ERRORLEVEL% EQU 0 (
    echo [成功] 构建通过
) else (
    echo [失败] 构建出错，请检查
)
