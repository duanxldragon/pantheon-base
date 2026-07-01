@echo off
REM Pantheon Base Menu Data Diagnostic Script
REM This script checks if menu data in database is correct

echo ========================================
echo Pantheon Base Menu Data Diagnostic
echo ========================================
echo.

REM Check MySQL connection
echo Checking MySQL connection...
mysql -u root -pdev_password_change_me -e "USE pantheon_base; SELECT VERSION();" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot connect to MySQL database!
    echo Please ensure MySQL is running and credentials are correct.
    pause
    exit /b 1
)

echo ✓ MySQL connection successful
echo.

REM Run diagnostic queries
echo Running diagnostic queries...
echo.

echo === Query 1: All menus with type='C' ===
mysql -u root -pdev_password_change_me pantheon_base -e "SELECT id, parent_id, title_key, path, component, type FROM system_menu WHERE type = 'C' ORDER BY id ASC;"

echo.
echo === Query 2: Menus with numeric or empty path ===
mysql -u root -pdev_password_change_me pantheon_base -e "SELECT id, path, component, type FROM system_menu WHERE path REGEXP '^[0-9]+$' OR path = '';"

echo.
echo === Query 3: Menu statistics ===
mysql -u root -pdev_password_change_me pantheon_base -e "SELECT type, COUNT(*) as count, SUM(CASE WHEN path = '' THEN 1 ELSE 0 END) as empty_path_count, SUM(CASE WHEN path REGEXP '^[0-9]+$' THEN 1 ELSE 0 END) as numeric_path_count FROM system_menu GROUP BY type;"

echo.
echo ========================================
echo Diagnostic Complete
echo ========================================
echo.

REM Check for issues
echo Checking for issues...
set HAS_ISSUE=0

for /f "tokens=*" %%i in ('mysql -u root -pdev_password_change_me pantheon_base -N -e "SELECT COUNT(*) FROM system_menu WHERE type = 'C' AND (path REGEXP '^[0-9]+$' OR path = '');") do set NUMERIC_PATH_COUNT=%%i

if %NUMERIC_PATH_COUNT% GTR 0 (
    echo ⚠ WARNING: Found %NUMERIC_PATH_COUNT% menus with numeric or empty path!
    echo This will cause 404 errors when clicking menu items.
    set HAS_ISSUE=1
) else (
    echo ✓ No menus with numeric or empty path found.
)

echo.

if %HAS_ISSUE% EQU 1 (
    echo ========================================
    echo RECOMMENDED ACTION
    echo ========================================
    echo.
    echo Your menu data appears to be corrupted. Recommended fix:
    echo.
    echo Option 1: Reset database completely
    echo   docker-compose down
    echo   docker volume rm pantheon-base_pantheon_mysql_data
    echo   docker-compose up -d mysql redis
    echo   timeout /t 10
    echo   cd backend
    echo   start-dev.bat
    echo.
    echo Option 2: Manually fix menu data
    echo   See MENU_404_TROUBLESHOOTING.md for details
    echo.
) else (
    echo ========================================
    echo Status: OK
    echo ========================================
    echo.
    echo Menu data looks correct. If you're still seeing 404 errors,
    echo please check:
    echo   1. Backend API response at /api/v1/system/menu/tree
    echo   2. Frontend route registration
    echo   3. Browser console for errors
    echo.
)

pause
