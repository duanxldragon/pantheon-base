ALTER TABLE system_role_menu
    DROP INDEX idx_system_role_menu_menu;

ALTER TABLE system_dept
    DROP INDEX idx_system_dept_parent_id;

ALTER TABLE system_menu
    DROP INDEX idx_system_menu_parent_id;
