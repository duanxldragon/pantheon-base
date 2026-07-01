-- Pantheon Base 菜单数据诊断脚本
-- 用于检查数据库中菜单表的实际数据是否正确

USE pantheon_base;

-- 1. 查看所有菜单的基本信息
SELECT 
    id,
    parent_id,
    title_key,
    path,
    component,
    type,
    is_visible,
    route_name,
    module
FROM system_menu
ORDER BY sort ASC, id ASC;

-- 2. 检查是否有 path 为数字ID的记录（这会导致404）
SELECT 
    id,
    parent_id,
    title_key,
    path,
    component,
    type,
    'WARNING: Path appears to be numeric ID instead of route path' as issue
FROM system_menu
WHERE path REGEXP '^[0-9]+$' OR path = ''
ORDER BY id ASC;

-- 3. 检查菜单树结构
WITH RECURSIVE menu_tree AS (
    -- 根节点
    SELECT 
        id,
        parent_id,
        title_key,
        path,
        component,
        type,
        1 as level,
        CAST(id AS CHAR(1000)) as tree_path
    FROM system_menu
    WHERE parent_id = 0
    
    UNION ALL
    
    -- 子节点
    SELECT 
        m.id,
        m.parent_id,
        m.title_key,
        m.path,
        m.component,
        m.type,
        mt.level + 1,
        CONCAT(mt.tree_path, ' -> ', m.id)
    FROM system_menu m
    INNER JOIN menu_tree mt ON m.parent_id = mt.id
)
SELECT * FROM menu_tree ORDER BY tree_path;

-- 4. 检查type='C'（菜单）且path为空或为数字的记录
SELECT 
    id,
    parent_id,
    title_key,
    path,
    component,
    type,
    route_name,
    CASE 
        WHEN path = '' THEN 'ERROR: Empty path for menu type C'
        WHEN path REGEXP '^[0-9]+$' THEN 'ERROR: Path is numeric ID for menu type C'
        WHEN path NOT LIKE '/%' AND path NOT LIKE 'http%' THEN 'WARNING: Path may not start with / or http'
        ELSE 'OK'
    END as validation_status
FROM system_menu
WHERE type = 'C'
ORDER BY id ASC;

-- 5. 统计各类菜单数量
SELECT 
    type,
    COUNT(*) as count,
    SUM(CASE WHEN path = '' THEN 1 ELSE 0 END) as empty_path_count,
    SUM(CASE WHEN path REGEXP '^[0-9]+$' THEN 1 ELSE 0 END) as numeric_path_count
FROM system_menu
GROUP BY type;

-- 6. 修复脚本（仅在确认有问题后执行）
-- 如果发现问题，可以使用以下脚本修复：

/*
-- 修复示例：将错误的 path 更新为正确的值
UPDATE system_menu SET path = '/system/user', component = 'system/user/UserList' WHERE id = 10;
UPDATE system_menu SET path = '/system/role', component = 'system/role/RoleList' WHERE id = 11;
-- ... 其他需要修复的记录

-- 或者完全重置菜单数据（谨慎使用！）
TRUNCATE TABLE system_role_menu;
TRUNCATE TABLE system_menu;

-- 然后重新插入正确的初始数据（从 system_init.sql 中复制 INSERT 语句）
*/
