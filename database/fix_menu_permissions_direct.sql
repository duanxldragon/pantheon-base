-- =====================================================
-- Pantheon Base 菜单权限修复脚本
-- =====================================================
-- 用途：修复 admin 角色无法访问某些页面的问题
-- 执行方法：mysql -uroot -p pantheon < fix_menu_permissions_direct.sql
-- 或在 MySQL 客户端中 SOURCE 此文件

-- =====================================================
-- 第一部分：检查当前状态
-- =====================================================

-- 检查 admin 角色
SELECT '检查 admin 角色' AS 诊断;
SELECT id, role_name, role_key FROM system_role WHERE role_key = 'admin';

-- 检查关键菜单是否存在
SELECT '检查关键菜单' AS 诊断;
SELECT id, path, component FROM system_menu WHERE path IN (
    '/system/permission',
    '/system/operation-log',
    '/system/login-log',
    '/system/session',
    '/system/lowcode',
    '/system/modules',
    '/system/generator'
) ORDER BY path;

-- 检查 admin 当前的菜单权限
SELECT '检查 admin 菜单权限' AS 诊断;
SELECT COUNT(*) AS admin_menu_count FROM system_role_menu rm
JOIN system_role r ON rm.role_id = r.id
WHERE r.role_key = 'admin';

-- =====================================================
-- 第二部分：修复
-- =====================================================

-- 获取 admin 角色 ID
SET @admin_role_id = (SELECT id FROM system_role WHERE role_key = 'admin' LIMIT 1);

-- 1. 确保 security 父菜单存在（login-log, session 的父菜单）
INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT 
    0 AS parent_id,
    'system.menu.security' AS title_key,
    '/system/security' AS path,
    '' AS component,
    '' AS page_perm,
    '' AS perms,
    'M' AS type,
    'safe' AS icon,
    'system-security' AS route_name,
    'system.auth' AS module,
    40 AS sort,
    1 AS is_visible
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/security');

-- 2. 确保 /system/lowcode 父菜单存在（modules, generator 的父菜单）
INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT 
    0 AS parent_id,
    'system.menu.lowcode' AS title_key,
    '/system/lowcode' AS path,
    '' AS component,
    '' AS page_perm,
    '' AS perms,
    'M' AS type,
    'code' AS icon,
    'system-lowcode' AS route_name,
    'system.lowcode' AS module,
    45 AS sort,
    1 AS is_visible
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/lowcode');

-- 3. 添加 login-log 菜单
INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT 
    (SELECT id FROM system_menu WHERE path = '/system/security') AS parent_id,
    'system.menu.loginLog' AS title_key,
    '/system/login-log' AS path,
    'auth/LoginLogList' AS component,
    'system:login-log:list' AS page_perm,
    '' AS perms,
    'C' AS type,
    'clock' AS icon,
    'system-login-log' AS route_name,
    'system.auth' AS module,
    10 AS sort,
    1 AS is_visible
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/login-log');

-- 4. 添加 session 菜单
INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT 
    (SELECT id FROM system_menu WHERE path = '/system/security') AS parent_id,
    'system.menu.session' AS title_key,
    '/system/session' AS path,
    'auth/SessionList' AS component,
    'system:session:list' AS page_perm,
    '' AS perms,
    'C' AS type,
    'desktop' AS icon,
    'system-session' AS route_name,
    'system.auth' AS module,
    20 AS sort,
    1 AS is_visible
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/session');

-- 5. 添加 modules 菜单
INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT 
    (SELECT id FROM system_menu WHERE path = '/system/lowcode') AS parent_id,
    'system.menu.modules' AS title_key,
    '/system/modules' AS path,
    'lowcode/dynamicmodule/ModuleManager' AS component,
    'system:module:list' AS page_perm,
    '' AS perms,
    'C' AS type,
    'apps' AS icon,
    'system-modules' AS route_name,
    'system.lowcode' AS module,
    35 AS sort,
    1 AS is_visible
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/modules');

-- 6. 添加 generator 菜单
INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT 
    (SELECT id FROM system_menu WHERE path = '/system/lowcode') AS parent_id,
    'system.menu.generator' AS title_key,
    '/system/generator' AS path,
    'lowcode/generator/ModuleWizard' AS component,
    'system:generator:use' AS page_perm,
    '' AS perms,
    'C' AS type,
    'code' AS icon,
    'system-generator' AS route_name,
    'system.lowcode' AS module,
    40 AS sort,
    1 AS is_visible
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/generator');

-- 7. 添加 operation-log 菜单
INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT 
    (SELECT id FROM system_menu WHERE path = '/system/security') AS parent_id,
    'system.menu.operationLog' AS title_key,
    '/system/operation-log' AS path,
    'system/audit/OperationLogList' AS component,
    'system:operation-log:list' AS page_perm,
    '' AS perms,
    'C' AS type,
    'file' AS icon,
    'system-operation-log' AS route_name,
    'system.audit' AS module,
    30 AS sort,
    1 AS is_visible
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/operation-log');

-- 8. 为 admin 角色分配所有菜单的权限
INSERT IGNORE INTO system_role_menu (role_id, menu_id)
SELECT @admin_role_id, id FROM system_menu WHERE type != 'F';

-- 9. 为 admin 角色分配所有权限点
INSERT IGNORE INTO system_role_permission (role_id, permission_key) VALUES
(@admin_role_id, 'platform:dashboard:view'),
(@admin_role_id, 'system:user:list'),
(@admin_role_id, 'system:user:view'),
(@admin_role_id, 'system:user:create'),
(@admin_role_id, 'system:user:update'),
(@admin_role_id, 'system:user:delete'),
(@admin_role_id, 'system:user:reset'),
(@admin_role_id, 'system:user:export'),
(@admin_role_id, 'system:user:import'),
(@admin_role_id, 'system:user:batch-update'),
(@admin_role_id, 'system:role:list'),
(@admin_role_id, 'system:role:create'),
(@admin_role_id, 'system:role:update'),
(@admin_role_id, 'system:role:delete'),
(@admin_role_id, 'system:role:batch-update'),
(@admin_role_id, 'system:role:export'),
(@admin_role_id, 'system:permission:list'),
(@admin_role_id, 'system:permission:create'),
(@admin_role_id, 'system:permission:update'),
(@admin_role_id, 'system:permission:delete'),
(@admin_role_id, 'system:permission:export'),
(@admin_role_id, 'system:permission:import'),
(@admin_role_id, 'system:menu:list'),
(@admin_role_id, 'system:menu:create'),
(@admin_role_id, 'system:menu:update'),
(@admin_role_id, 'system:menu:delete'),
(@admin_role_id, 'system:dept:list'),
(@admin_role_id, 'system:dept:create'),
(@admin_role_id, 'system:dept:update'),
(@admin_role_id, 'system:dept:delete'),
(@admin_role_id, 'system:dept:export'),
(@admin_role_id, 'system:dept:import'),
(@admin_role_id, 'system:dept:batch-update'),
(@admin_role_id, 'system:post:list'),
(@admin_role_id, 'system:post:create'),
(@admin_role_id, 'system:post:update'),
(@admin_role_id, 'system:post:delete'),
(@admin_role_id, 'system:post:export'),
(@admin_role_id, 'system:post:import'),
(@admin_role_id, 'system:post:batch-update'),
(@admin_role_id, 'system:dict:list'),
(@admin_role_id, 'system:dict:create'),
(@admin_role_id, 'system:dict:update'),
(@admin_role_id, 'system:dict:delete'),
(@admin_role_id, 'system:dict:refresh'),
(@admin_role_id, 'system:dict:export'),
(@admin_role_id, 'system:dict:import'),
(@admin_role_id, 'system:setting:list'),
(@admin_role_id, 'system:setting:update'),
(@admin_role_id, 'system:setting:refresh'),
(@admin_role_id, 'system:module:list'),
(@admin_role_id, 'system:module:register'),
(@admin_role_id, 'system:module:unregister'),
(@admin_role_id, 'system:module:delete_record'),
(@admin_role_id, 'system:module:purge'),
(@admin_role_id, 'system:module:repair'),
(@admin_role_id, 'system:generator:use'),
(@admin_role_id, 'system:module:generate'),
(@admin_role_id, 'system:generator:datasource:manage'),
(@admin_role_id, 'system:login-log:list'),
(@admin_role_id, 'system:login-log:export'),
(@admin_role_id, 'system:login-log:clear'),
(@admin_role_id, 'system:login-log:delete'),
(@admin_role_id, 'system:session:list'),
(@admin_role_id, 'system:session:delete'),
(@admin_role_id, 'system:session:clear'),
(@admin_role_id, 'system:operation-log:list'),
(@admin_role_id, 'system:operation-log:export'),
(@admin_role_id, 'system:operation-log:clear'),
(@admin_role_id, 'system:operation-log:delete');

-- =====================================================
-- 第三部分：验证
-- =====================================================

SELECT '验证修复结果' AS 结果;

-- 菜单数量
SELECT 
    r.role_key,
    COUNT(rm.menu_id) AS menu_count
FROM system_role r
LEFT JOIN system_role_menu rm ON r.id = rm.role_id
WHERE r.role_key = 'admin'
GROUP BY r.role_key;

-- 权限点数量
SELECT 
    r.role_key,
    COUNT(rp.permission_key) AS permission_count
FROM system_role r
LEFT JOIN system_role_permission rp ON r.id = rp.role_id
WHERE r.role_key = 'admin'
GROUP BY r.role_key;

-- 关键菜单是否已分配
SELECT 
    m.path,
    CASE WHEN rm.menu_id IS NOT NULL THEN '已分配' ELSE '未分配' END AS status
FROM system_menu m
LEFT JOIN system_role_menu rm ON m.id = rm.menu_id AND rm.role_id = @admin_role_id
WHERE m.path IN (
    '/system/permission',
    '/system/operation-log',
    '/system/login-log',
    '/system/session',
    '/system/lowcode',
    '/system/modules',
    '/system/generator'
)
ORDER BY m.path;

SELECT '修复完成！请重新登录 admin 用户以刷新权限。' AS 提示;
