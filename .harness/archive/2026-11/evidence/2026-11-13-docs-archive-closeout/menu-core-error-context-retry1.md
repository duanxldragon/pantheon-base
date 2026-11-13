# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke-core/system-menu-permission.spec.ts >> System Menu Permission @priority:high @smoke:core >> can create a menu item
- Location: tests/smoke-core/system-menu-permission.spec.ts:151:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.arco-table-tr').filter({ hasText: 'smoke_core' }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.arco-table-tr').filter({ hasText: 'smoke_core' }).first() with timeout 15000ms
  - waiting for locator('.arco-table-tr').filter({ hasText: 'smoke_core' }).first()

```

```yaml
- complementary:
    - text: P Pantheon Base
    - menu:
        - menuitem "system.menu.smoke_core_3q5gb":
            - button "system.menu.smoke_core_3q5gb"
        - menuitem "工作台":
            - button "工作台"
        - button "访问控制"
        - menuitem "用户管理":
            - button "用户管理"
        - menuitem "角色管理":
            - button "角色管理"
        - menuitem "权限管理":
            - button "权限管理"
        - menuitem "菜单管理":
            - button "菜单管理"
        - button "组织架构"
        - button "安全审计"
        - button "低代码平台"
        - button "平台配置"
- button "切换导航"
- list:
    - listitem: 首页
    - listitem: 访问控制
    - listitem: 菜单管理
- button "平台功能台": 搜索菜单、页面、功能… Ctrl K
- button "通知中心"
- button "平台偏好"
- 'button "用户: Administrator"': A Administrator admin
- tablist "已打开页面":
    - tab "工作台"
    - tab "菜单管理" [selected]
- main:
    - text: 系统域 / IAM 菜单治理 统一维护导航结构、路由元数据与可见性边界 总数
    - strong: "1"
    - text: 可见导航
    - strong: "1"
    - text: 按钮节点
    - strong: "0"
    - button "元数据摘要"
    - search "筛选":
        - textbox "按菜单标题键或路径搜索…": system.menu.smoke_core_3q5gb
        - combobox:
            - textbox "可见"
            - text: 可见
        - button "清空筛选"
    - button "表格"
    - button "列表"
    - button "卡片"
    - button "新增"
    - table:
        - rowgroup:
            - row "标题 路径 类型 可见 操作":
                - columnheader "标题"
                - columnheader "路径"
                - columnheader "类型"
                - columnheader "可见"
                - columnheader "操作"
        - rowgroup:
            - row "system.menu.smoke_cor... - 菜单 是 新增子菜单 编辑 删除":
                - cell "system.menu.smoke_cor..."
                - cell "-"
                - cell "菜单"
                - cell "是"
                - cell "新增子菜单 编辑 删除":
                    - button "新增子菜单"
                    - button "编辑"
                    - button "删除"
    - text: 总数
    - strong: "1"
    - list:
        - listitem "上一页": .
        - listitem "第 1 页": "1"
        - listitem "下一页": .
    - combobox: 10 条/页
- text: Pantheon Platform · Enterprise Admin Foundation
```
