# Pantheon Base - 菜单权限修复脚本
# 用途：修复 admin 角色无法访问某些页面的问题
# 使用方法：powershell -File fix_menu_permissions.ps1

$ErrorActionPreference = "Stop"

# 获取脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SqlFile = Join-Path $ScriptDir "database" "fix_menu_permissions_direct.sql"

# 数据库配置
$DB_HOST = if ($env:PANTHEON_DB_HOST) { $env:PANTHEON_DB_HOST } else { "127.0.0.1" }
$DB_PORT = if ($env:PANTHEON_DB_PORT) { $env:PANTHEON_DB_PORT } else { "3306" }
$DB_NAME = if ($env:PANTHEON_DB_NAME) { $env:PANTHEON_DB_NAME } else { "pantheon" }
$DB_USER = if ($env:PANTHEON_DB_USER) { $env:PANTHEON_DB_USER } else { "root" }

Write-Host "=== Pantheon Base 菜单权限修复 ===" -ForegroundColor Cyan
Write-Host ""

# 提示输入密码
Write-Host "请输入 MySQL $DB_USER 用户的密码：" -NoNewline
$Password = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$DB_PASS = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

# 检查 SQL 文件是否存在
if (-not (Test-Path $SqlFile)) {
    Write-Host "[错误] SQL 文件不存在: $SqlFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "正在连接数据库: $DB_USER@$DB_HOST/$DB_NAME" -ForegroundColor Yellow
Write-Host ""

# 执行 SQL
try {
    $Output = & mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASS" $DB_NAME 2>&1 <<< "SOURCE $SqlFile;"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[成功] SQL 执行完成" -ForegroundColor Green
        Write-Host ""
        Write-Host $Output
    } else {
        Write-Host "[失败] SQL 执行失败" -ForegroundColor Red
        Write-Host $Output
        exit 1
    }
} catch {
    Write-Host "[错误] $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 修复完成 ===" -ForegroundColor Cyan
Write-Host "请重新登录 admin 用户以刷新权限。" -ForegroundColor Yellow
