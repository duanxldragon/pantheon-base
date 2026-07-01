-- Get admin role ID
SET @admin_role_id = (SELECT id FROM system_role WHERE role_key = 'admin' LIMIT 1);

-- Show current status
SELECT 'Before fix:' AS status;
SELECT COUNT(*) AS menu_count FROM system_role_menu WHERE role_id = @admin_role_id;
SELECT COUNT(*) AS perm_count FROM system_role_permission WHERE role_id = @admin_role_id;

-- Insert missing menus (if not exists)
INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT 0, 'system.menu.security', '/system/security', '', '', '', 'M', 'safe', 'system-security', 'system.auth', 40, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/security');

INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT 0, 'system.menu.lowcode', '/system/lowcode', '', '', '', 'M', 'code', 'system-lowcode', 'system.lowcode', 45, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/lowcode');

-- Insert missing child menus
INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT (SELECT id FROM system_menu WHERE path = '/system/security'), 'system.menu.loginLog', '/system/login-log', 'auth/LoginLogList', 'system:login-log:list', '', 'C', 'clock', 'system-login-log', 'system.auth', 10, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/login-log');

INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT (SELECT id FROM system_menu WHERE path = '/system/security'), 'system.menu.session', '/system/session', 'auth/SessionList', 'system:session:list', '', 'C', 'desktop', 'system-session', 'system.auth', 20, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/session');

INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT (SELECT id FROM system_menu WHERE path = '/system/security'), 'system.menu.operationLog', '/system/operation-log', 'system/audit/OperationLogList', 'system:operation-log:list', '', 'C', 'file', 'system-operation-log', 'system.audit', 30, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/operation-log');

INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT (SELECT id FROM system_menu WHERE path = '/system/lowcode'), 'system.menu.modules', '/system/modules', 'lowcode/dynamicmodule/ModuleManager', 'system:module:list', '', 'C', 'apps', 'system-modules', 'system.lowcode', 35, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/modules');

INSERT IGNORE INTO system_menu (parent_id, title_key, path, component, page_perm, perms, type, icon, route_name, module, sort, is_visible)
SELECT (SELECT id FROM system_menu WHERE path = '/system/lowcode'), 'system.menu.generator', '/system/generator', 'lowcode/generator/ModuleWizard', 'system:generator:use', '', 'C', 'code', 'system-generator', 'system.lowcode', 40, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_menu WHERE path = '/system/generator');

-- Grant ALL menus to admin (except F-type action buttons)
INSERT IGNORE INTO system_role_menu (role_id, menu_id)
SELECT @admin_role_id, id FROM system_menu WHERE type != 'F';

-- Grant all permission keys to admin
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

-- Show after fix
SELECT 'After fix:' AS status;
SELECT COUNT(*) AS menu_count FROM system_role_menu WHERE role_id = @admin_role_id;
SELECT COUNT(*) AS perm_count FROM system_role_permission WHERE role_id = @admin_role_id;

-- Verify key menus
SELECT m.path, CASE WHEN rm.menu_id IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
FROM system_menu m
LEFT JOIN system_role_menu rm ON m.id = rm.menu_id AND rm.role_id = @admin_role_id
WHERE m.path IN ('/system/permission', '/system/operation-log', '/system/login-log', '/system/session', '/system/lowcode', '/system/modules', '/system/generator')
ORDER BY m.path;
