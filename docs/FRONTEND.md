# 前端架构设计与 UI 规范

> 本文偏“架构总览”。更细的页面骨架、导航、状态、表单、表格、响应式和权限态规范，见 `docs/FRONTEND_UI_SPEC.md`；后台 UI 专项整改见 `docs/BACKOFFICE_UI_REMEDIATION_PLAN_20260423.md`。

## 1. 架构目标：模块化、声明式、解耦
前端底座是一个“壳”，业务模块通过配置化的形式向壳注册自己。

## 1.1 当前阶段原则

- **先补设计，再补实现**
- **先锁边界，再写页面**
- **先沉淀通用骨架，再做业务模块**

尤其是认证、安全、权限、配置类页面，必须先在文档中明确页面类型、交互状态和模块边界，再进入编码阶段。

## 2. 视觉规范 (The Indigo Identity)
- **色调**: 核心 Indigo Blue (#165DFF)，辅助色 Neutral Gray (#F2F3F5)。
- **风格参考**: 参考 `awesome-design-md` 的 Markdown 设计系统方法，审美方向偏 Figma：界面骨架克制、内容区可有少量多彩点缀、pill/circle 几何、精确 focus 反馈。
- **去 AI 味**: 禁止默认紫蓝渐变、通用三栏卡片、彩色圆形 icon 堆叠、无信息架构的卡片墙。
- **后台整改基线**: 登录页、应用壳层、工作台和系统页必须统一为“冷静、可信、工具化”的企业后台质感，不做营销页式 hero。
- **层级架构 (Layering Strategy)**:
  - **Base (底板)**: `#F7F8FA`，用于全局背景。
  - **Surface (表面)**: `#FFFFFF`，用于卡片、侧边栏。带有极细边框 `1px solid rgba(0,0,0,0.04)`。
  - **Overlay (悬浮)**: 纯白，带有弥散投影，用于下拉菜单、弹窗。
- **排版 (Typography)**:
  - 严格遵循 1.25 倍缩放比例 (12, 14, 18, 24, 32px)。
  - 字重分层：标题 (600), 重点正文 (500), 普通正文 (400)。
- **阴影与深度 (Shadow & Depth)**:
  - **Subtle**: `0 1px 2px rgba(0,0,0,0.05)` (静态卡片)。
  - **Elevated**: `0 12px 32px rgba(22, 93, 255, 0.08)` (悬浮/活动组件)。

## 3. 核心交互细节 (Awesome Design Details)
- **去线化布局 (Lineless Layout)**: 减少物理分割线，通过 24px/32px 的 **负空间 (Negative Space)** 产生视觉切片。
- **状态表现 (Status Semantic)**:
  - **Success**: 背景 `#E8FFFB`, 文字 `#00B42A` (青色系)。
  - **Warning**: 背景 `#FFF7E8`, 文字 `#FF7D00` (琥珀色系)。
  - **Danger**: 背景 `#FFE8E8`, 文字 `#F53F3F` (红色系)。
- **交互回馈 (Micro-interactions)**:
  - **Buttons**: Hover 时背景加深 10%，Active 时轻微缩小 (98%)。
  - **Inputs**: 聚焦时边框色改为 Indigo，并增加 `2px` 的外发光扩散。
- **动效 (Motion)**: 统一使用短时长 `ease-out` 或 Arco 默认动效，不使用带明显回弹的娱乐化转场。


## 4. 模块解耦注册 (Module Registration)
业务模块存放在 `src/modules/business/`，系统模块存放在 `src/modules/system/`；页面模块通过 `index.ts` 导出 `ModuleConfig`，由 `src/core/router/modules.ts` **显式注册**。

### 4.1 注册配置示例
```typescript
export const OrderModule = {
  name: 'order',
  routes: [
    { path: 'order/list', titleKey: 'biz.order.menu.list', component: React.lazy(() => import('./pages/list')) }
  ]
};
```

> 注意：当前真实类型以 `frontend/src/core/router/types.ts` 为准，`ModuleConfig` 已升级为包含 `scope / menus / permissions / i18nNamespaces / pagePermission` 的模块 manifest。

## 5. 多语言方案 (Dynamic I18n)
- **i18next**: 核心引擎。
- **Backend Sync**: 应用启动时调用 `/api/v1/system/i18n/pack` 接口，拉取数据库中的全量翻译并注入资源池。
- **Fallback Resources**: 前端内置 `zh-CN` 与 `en-US` 最小语言包，保证后端未启动时登录页仍可展示。
- **UI 绑定**: 使用 `t('key')` 或 `<Trans />` 组件进行文本翻译。

## 6. 组件开发标准 (Arco Design)
- **严禁大量手写 CSS**: 优先使用 Arco Design 的属性（如 `Grid`, `Space`）进行布局。
- **Form 封装**: 统一使用表单校验，并配合后端返回的业务错误码显示 Tip。
- **Fetch 封装**: 统一处理 Token 注入、401/403 异常拦截及 RequestID 日志跟踪。

## 7. 当前页面闭环
- **登录页**: `src/modules/auth/Login.tsx`，已从 `system/user` 迁出，完成 access/refresh token 持久化与用户信息写入；后续按专项整改方案收敛为专业认证控制台，避免轮播、虚假指标和营销 hero，并保留语言/主题入口。
- **认证 API**: `src/modules/auth/api.ts`，统一承接 login / refresh / logout / getMe / updatePassword。
- **安全中心**: `src/modules/auth/SecurityCenter.tsx`，通过 `/api/v1/auth/security` 承接安全概览，并组合当前用户在线会话管理、登录日志与密码修改。
- **安全审计页**: `src/modules/auth/LoginLogList.tsx`、`src/modules/auth/SessionList.tsx`，已承接管理员登录日志与全局会话管理；其中登录日志页已支持按筛选条件导出 CSV。
- **请求封装**: `src/api/request.ts` 自动注入 access token；业务码 `401` 时使用 `auth/refresh` 轮换并重放原请求。
- **模块 Manifest**: `src/core/router/types.ts` 已将 `ModuleConfig` 升级为包含 `scope / menus / permissions / i18nNamespaces / pagePermission` 的模块契约。
- **权限钩子**: `src/hooks/usePermission.ts` 统一处理 `admin` 角色和权限标识判断。
- **页面权限**: `src/core/router/RoutePermissionGuard.tsx` 根据路由 `pagePermission` 做页面级拦截，并统一展示 403。
- **用户页**: `src/modules/system/user/UserList.tsx`，支持筛选、分页、排序、读取、新增、编辑、删除用户，并维护用户角色绑定；同时支持按部门/岗位筛选、CSV 模板下载、导出、导入摘要反馈与批量启用/禁用。
- **用户详情页**: `src/modules/system/user/UserDetail.tsx` 走独立 `system:user:view` 页面权限，展示用户基础资料、组织归属、角色摘要，并通过详情路由 `activeMenu` 保持菜单高亮。
- **用户密码重置**: `src/modules/system/user/UserList.tsx` 已把管理员重置密码从编辑弹窗中拆出，独立弹窗走 `system:user:reset` 权限点，并提示会话强制下线影响。
- **角色页**: `src/modules/system/role/RoleList.tsx`，支持筛选、分页、排序、读取、新增、编辑、删除角色，并把授权表单拆成“导航授权 / 页面授权 / 操作授权”三段，接口策略仍在权限页独立维护；列表页额外支持角色基础信息导出与批量启用/禁用。
- **菜单页**: `src/modules/system/menu/MenuList.tsx`，支持筛选、排序、读取菜单树、新增、编辑、删除菜单，并把 `pagePerm` 与动作 `perms` 分开维护；页面支持表格、列表、卡片三种浏览方式。
- **部门页**: `src/modules/system/dept/DeptList.tsx`，支持树形读取、新增、编辑、删除部门，并维护上下级组织结构；页面会显示真实组织根节点，普通部门默认挂载在根节点之下，并支持 CSV 模板下载、导出、导入与批量启用/禁用；同时新增“组织架构”视图，以部门树为主干展示岗位和成员归属。
- **岗位页**: `src/modules/system/post/PostList.tsx`，支持分页读取、新增、编辑、删除岗位，并维护岗位所属部门；同时支持 CSV 模板下载、导出、导入与批量启用/禁用。
- **权限页**: `src/modules/system/permission/PermissionList.tsx`，已升级为“权限工作台 + Casbin 路由策略”双视图，统一展示角色的导航、页面/按钮权限与接口策略；接口策略页支持 CSV 模板下载、导出与导入。
- **个人中心**: `src/modules/system/profile/ProfileCenter.tsx`，支持查看当前账号信息、维护昵称/邮箱/手机号/头像；密码修改请求已切到 `system/auth` API。
- **安全入口**: 顶部用户区和个人中心页均已提供“安全中心”入口，安全能力不再继续堆叠在 `ProfileCenter` 内。
- **审计入口**: 管理员可通过动态菜单进入“登录日志”“会话管理”页面。
- **基础布局**: `src/core/layout/index.tsx`，支持动态菜单、语言切换、登出，并按当前用户权限渲染侧边导航。
- **页面骨架第一批组件**: 已新增 `src/components/` 下的 `PageContainer`、`PageHeader`、`FilterPanel`、`PageLoading`、`PageEmpty`、`PageError`、`PageForbidden`，并优先接入 `auth` 相关页面。
- **页面骨架第二批组件**: 已新增 `AppTable`、`PageActions`、`FormSection`、`SubmitBar`，并开始接入 `UserList`、`RoleList`、`PermissionList`、`ProfileCenter`。
- **第二批覆盖扩展**: `DeptList`、`MenuList`、`PostList` 已接入统一页面头部、筛选区、表格封装与提交栏。
- **异常态补强**: 已补 `PageServerError`、`PageNetworkError`，请求层也已能区分 `network / timeout / server / business` 基础错误类型。
- **仪表盘真实数据化**: `src/modules/dashboard/` 已接入平台层汇总接口，不再使用硬编码统计数字。
- **首页归属澄清**: dashboard 在模块 manifest 中按 `platform` scope 理解，语义上属于跨域聚合页；物理目录已从 `platform/dashboard` 扁平化到顶层 `dashboard`。
- **系统设置页**: 已新增 `src/modules/system/setting/SettingPage.tsx`，按 `basic/security/login/upload/i18n/ui` 分组维护系统设置，并对敏感配置提供“已加密/留空不变”交互表达。
- **平台公开设置消费**: `site.name / site.logo / i18n.default_language / ui.default_theme / ui.enable_tab_bar` 已接入登录页与应用壳层；其中默认语言仅在“用户未显式切换语言”时生效，标签栏可由 `ui.enable_tab_bar` 控制显隐。
- **设置审计详情**: 系统设置页底部已补最近配置变更审计表，支持查看操作人、操作 IP、变更字段、状态与操作时间，敏感字段只展示“已变更”而不回显明文。
- **设置缓存刷新**: 系统设置页已补“刷新设置缓存”入口，允许管理员按当前分组手动预热缓存。
- **字典管理页**: 已新增 `src/modules/system/dict/DictPage.tsx`，采用左侧字典类型 + 右侧字典项的主从布局，支持类型筛选、字典项排序、状态和颜色维护；类型与字典项都支持各自的 CSV 模板下载、导出与导入。
- **字典缓存刷新**: 字典页右侧卡片已补“刷新缓存”入口，管理员可按当前选中字典手动刷新 options 缓存。
- **菜单元数据页增强**: `src/modules/system/menu/MenuList.tsx` 已支持维护 `routeName / module / isCache / isExternal / activeMenu`，图标输入已收敛为枚举选择器。
- **操作日志页**: `src/modules/system/audit/OperationLogList.tsx` 已支持按筛选条件导出 CSV；删除、清空仍保持独立权限点控制。

## 8. 交互补充
- **列表筛选**: 用户页支持用户名、昵称、部门、岗位、状态筛选，并与分页、排序联动；角色页支持角色名称、角色标识、状态筛选，并与分页、排序联动；菜单页支持标题键、路径、显示状态筛选，并与排序联动；岗位页支持所属部门、岗位编码、岗位名称、状态筛选，并与分页、排序联动；部门页支持部门名称、状态筛选，并与树排序联动；字典页支持按 `dictCode / dictName / status` 筛选字典类型，并与右侧字典项主从联动。
- **按钮权限**: 增删改、批量状态更新与敏感动作按钮通过 `usePermission` 按细粒度权限点控制，例如 `system:user:create`、`system:user:reset`、`system:user:batch-update`、`system:dept:batch-update`、`system:role:update`、`system:permission:delete`、`system:dict:update`；`admin` 角色默认拥有全部操作能力。
- **表单校验**: 用户页对密码长度、邮箱格式、角色必选以及部门/岗位选择做前端约束；角色页对角色名称、角色标识必填做前端校验；菜单页对标题键必填做前端校验；部门/岗位页分别对名称、编码等关键字段做必填校验。
- **表格交互**: 用户、角色、部门、岗位在存在批量状态操作时均在表格最左侧展示选择框；用户、角色、岗位表格使用服务端分页与排序，切换页码、每页条数、列排序时统一回写 query 状态。
- **角色授权**: 角色页通过统一树形面板维护 `menuIds` 导航授权、`pagePerm` 页面权限和 `perms` 操作权限，三类授权均支持搜索、全展开/全收起和父级批量勾选，并保留未知历史权限键避免误删授权。
- **树表交互**: 菜单页树表使用服务端排序，列头排序会回写 `sortField/sortOrder` 并保留当前筛选条件。
- **菜单元数据行为**: 菜单导航已支持外链菜单新窗口打开，并支持基于 `activeMenu` 的菜单高亮兜底；图标渲染已统一收口到共享 icon 映射。
- **敏感配置交互**: 系统设置页已识别 `isEncrypted` 元数据；敏感项不回显明文，只显示“已配置/留空不变”提示，并使用密码型输入控件提交新值。
- **设置审计交互**: 切换设置分组时同步刷新该分组最近审计记录；保存成功后自动回到最新第一页，便于管理员确认配置变更已落库。
- **字典缓存交互**: 字典类型/字典项保存后，后端会自动失效对应字典缓存；页面额外提供手动刷新入口，方便联调业务下拉取值。
- **导入导出交互**: 系统域导入统一采用隐藏文件选择 + `ImportCsvButton` 模式，导出统一走 blob 下载；导入结果通过摘要弹窗展示 `created / updated / failed / row errors`，不直接依赖错误 toast 承载结构化详情。
- **组织字段接入**: 用户页已支持选择部门和岗位，并在列表中直接展示 `deptName/postName`；用户表单中的部门选项会排除组织根节点，岗位下拉按所选部门过滤，避免用户岗位与部门不一致。
- **组织架构视图**: 部门页中的“组织架构”页签采用 `system/org` 语义，部门节点下直接展示岗位卡片与成员摘要，选中节点后右侧展示直属岗位、直属成员和当前组织规则说明；管理员可在选中部门下直接新增岗位，并从直属成员列表查看用户详情。
- **权限三轨**: 导航授权通过 `system_role_menu`，页面/按钮权限通过 `system_role_permission`，接口访问权限通过 `casbin_rule` 在权限页单独维护。
- **菜单作用域**: 侧边栏通过 `getMenuTree({ scope: 'nav' })` 只拉取当前用户可见导航；菜单页与角色页通过 `scope: 'manage'` 拉取完整授权树。
- **菜单权限边界**: 菜单元数据中的 `pagePerm` 用于页面进入权限，`perms` 用于按钮/动作权限，前端路由守卫与按钮显隐共享统一权限源但不再复用导航关系。
- **国际化约束**: 布局、按钮、页签等展示文本统一通过 `t()` 输出，避免系统页出现硬编码文案。
- **个人入口**: 顶部用户区提供“个人中心”入口；该页面不依赖左侧菜单树，而通过模块路由注册进入。
- **状态基建起步**: 登录日志页、会话管理页、安全中心页已开始统一接入页面级 `empty / error / loading` 组件，作为后续系统页改造基线。
- **表单与列表收口**: 用户、角色、权限、个人中心页面已开始统一使用表格封装、操作区和提交栏，减少系统页继续各写各的风险。
- **基础异常页**: 全局兜底路由已切到 `PageNotFound`，不再直接渲染裸文本 404。
- **细分异常态起步**: dashboard 已作为首个页面接入 `network / timeout / server` 区分展示，为后续系统页收口异常体验打样。

## 9. 缺口与后续文档约束

当前 `FRONTEND.md` 只解决了“架构方向”和“已有能力概览”，还不够支撑后续大规模页面建设。

后续以前端实现为准时，必须同时参考：

- `docs/FRONTEND_UI_SPEC.md`：UI 详细规范
- `docs/BACKOFFICE_UI_REMEDIATION_PLAN_20260423.md`：后台 UI 专项整改方案
- `docs/AUTH_MODULE_DESIGN.md`：认证与安全中心边界
- `DESIGN.md`：顶层架构与能力域设计
