-- =====================================================
-- Pantheon Base 菜单权限诊断和修复脚本
-- =====================================================
-- 用途：诊断并修复 admin 角色无法访问某些页面的问题
-- 执行前请备份数据库！

-- =====================================================
-- 第一部分：诊断
-- =====================================================

-- 1. 检查 admin 角色是否存在
SELECT '1. 检查 admin 角色' AS 诊断项;
SELECT id, role_name, role_key, status FROM system_role WHERE role_key = 'admin';

-- 2. 检查 admin 用户关联的角色（检查user_id=1是否为admin）
SELECT '2. 检查 admin 用户关联的角色' AS 诊断项;
SELECT ur.*, r.role_key, r.role_name
FROM system_user_role ur
JOIN system_role r ON ur.role_id = r.id
JOIN system_user u ON ur.user_id = u.id
WHERE u.username = 'admin' OR u.id = 1;

-- 3. 检查 admin 角色拥有的菜单权限
SELECT '3. 检查 admin 角色的菜单权限' AS 诊断项;
SELECT m.id, m.name, m.path, m.component, m.type
FROM system_menu m
JOIN system_role_menu rm ON m.id = rm.menu_id
JOIN system_role r ON rm.role_id = r.id
WHERE r.role_key = 'admin'
ORDER BY m.id;

-- 4. 检查缺失的菜单项
SELECT '4. 检查关键菜单是否存在' AS 诊断项;
SELECT
    m.id,
    m.name,
    m.path,
    m.component,
    CASE
        WHEN rm.menu_id IS NOT NULL THEN '已有权限'
        ELSE '缺少权限'
    END AS 权限状态
FROM system_menu m
LEFT JOIN system_role_menu rm ON m.id = rm.menu_id AND rm.role_id = (
    SELECT id FROM system_role WHERE role_key = 'admin' LIMIT 1
)
WHERE m.path IN (
    '/system/permission',
    '/system/operation-log',
    '/system/login-log',
    '/system/session',
    '/system/modules',
    '/system/generator',
    '/system/lowcode'
)
ORDER BY m.path;

-- 5. 检查 admin 用户的权限点
SELECT '5. 检查 admin 用户的权限点' AS 诊断项;
SELECT rp.permission_key
FROM system_role_permission rp
JOIN system_role r ON rp.role_id = r.id
WHERE r.role_key = 'admin'
AND rp.permission_key IN (
    'system:module:list',
    'system:module:register',
    'system:module:unregister',
    'system:generator:use',
    'system:login-log:list',
    'system:session:list',
    'system:operation-log:list',
    'system:permission:list'
)
ORDER BY rp.permission_key;

-- =====================================================
-- 第二部分：修复
-- =====================================================

-- 6. 为 admin 角色添加缺失的菜单权限
-- 执行此语句前请确保上面的诊断结果已确认菜单ID正确

-- 添加缺失的菜单权限
INSERT IGNORE INTO system_role_menu (role_id, menu_id)
SELECT
    (SELECT id FROM system_role WHERE role_key = 'admin' LIMIT 1) AS role_id,
    m.id AS menu_id
FROM system_menu m
WHERE m.path IN (
    '/system/lowcode',
    '/system/modules',
    '/system/generator',
    '/system/operation-log',
    '/system/login-log',
    '/system/session',
    '/system/permission'
)
AND NOT EXISTS (
    SELECT 1 FROM system_role_menu rm
    WHERE rm.role_id = (SELECT id FROM system_role WHERE role_key = 'admin' LIMIT 1)
    AND rm.menu_id = m.id
);

-- 7. 为 admin 角色添加缺失的权限点
INSERT IGNORE INTO system_role_permission (role_id, permission_key)
SELECT
    (SELECT id FROM system_role WHERE role_key = 'admin' LIMIT 1) AS role_id,
    perm_key AS permission_key
FROM (
    SELECT 'system:module:list' AS perm_key UNION ALL
    SELECT 'system:module:register' UNION ALL
    SELECT 'system:module:unregister' UNION ALL
    SELECT 'system:module:delete_record' UNION ALL
    SELECT 'system:module:purge' UNION ALL
    SELECT 'system:module:repair' UNION ALL
    SELECT 'system:generator:use' UNION ALL
    SELECT 'system:module:generate' UNION ALL
    SELECT 'system:generator:datasource:manage' UNION ALL
    SELECT 'system:login-log:list' UNION ALL
    SELECT 'system:login-log:export' UNION ALL
    SELECT 'system:login-log:clear' UNION ALL
    SELECT 'system:login-log:delete' UNION ALL
    SELECT 'system:session:list' UNION ALL
    SELECT 'system:session:delete' UNION ALL
    SELECT 'system:session:clear' UNION ALL
    SELECT 'system:operation-log:list' UNION ALL
    SELECT 'system:operation-log:export' UNION ALL
    SELECT 'system:operation-log:clear' UNION ALL
    SELECT 'system:operation-log:delete' UNION ALL
    SELECT 'system:permission:list' UNION ALL
    SELECT 'system:permission:create' UNION ALL
    SELECT 'system:permission:update' UNION ALL
    SELECT 'system:permission:delete' UNION ALL
    SELECT 'system:permission:export' UNION ALL
    SELECT 'system:permission:import'
) AS perms
WHERE NOT EXISTS (
    SELECT 1 FROM system_role_permission rp
    WHERE rp.role_id = (SELECT id FROM system_role WHERE role_key = 'admin' LIMIT 1)
    AND rp.permission_key = perms.perm_key
);

-- =====================================================
-- 第三部分：验证
-- =====================================================

-- 8. 验证修复结果 - 菜单权限数量
SELECT '8. 验证修复结果 - 菜单权限总数' AS 操作;
SELECT
    r.role_key,
    COUNT(rm.menu_id) AS menu_count
FROM system_role r
LEFT JOIN system_role_menu rm ON r.id = rm.role_id
WHERE r.role_key = 'admin'
GROUP BY r.role_key;

-- 9. 验证修复结果 - 权限点数量
SELECT '9. 验证修复结果 - 权限点总数' AS 操作;
SELECT
    r.role_key,
    COUNT(rp.permission_key) AS permission_count
FROM system_role r
LEFT JOIN system_role_permission rp ON r.id = rp.role_id
WHERE r.role_key = 'admin'
GROUP BY r.role_key;

-- =====================================================
-- 注意事项
-- =====================================================
-- 如果上面的 INSERT 语句报错，可能是因为：
-- 1. admin 角色不存在
-- 2. 菜单项不存在
-- 3. 已经有对应的记录（INSERT IGNORE 会忽略）
--
-- 执行完成后，请重新登录 admin 用户以刷新权限信息。
