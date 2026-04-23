# 后台 UI gstack Browser 验收记录

日期：2026-04-23

## 1. 验收边界

- 层级：`platform` 聚合层、`system/auth` 登录与安全中心、`system/iam` 用户页、`system/config` 设置页。
- 不纳入：`business/*` 页面设计与整改；侧边栏可展示已注册业务菜单，但平台工作台不得硬编码业务卡片。
- 工具：gstack Browser headed 模式，真实登录 `admin / 123456` 后逐页截图验收。

## 2. 页面结论

| 页面 | 路径 | 结论 | 证据 |
| --- | --- | --- | --- |
| 登录页桌面 | `/login` | 通过，无轮播、无“记住我/忘记密码”伪能力，认证控制台风格统一 | `frontend/test-results/backoffice-ui-gstack/login-desktop.png` |
| 登录页移动端 | `/login` | 已修复，移动首屏优先展示登录表单 | `frontend/test-results/backoffice-ui-gstack/login-mobile-after.png` |
| 平台工作台 | `/dashboard` | 通过，主内容为平台聚合视图，未硬编码 CMDB/业务资产卡片 | `frontend/test-results/backoffice-ui-gstack/dashboard-after-login.png` |
| 用户管理 | `/system/user` | 通过，壳层、筛选区、表格区风格一致 | `frontend/test-results/backoffice-ui-gstack/system-user-auth.png` |
| 系统设置 | `/system/setting` | 通过，配置表单与审计记录区层级清晰 | `frontend/test-results/backoffice-ui-gstack/system-setting-auth.png` |
| 安全中心 | `/auth/security` | 已修复，活跃会话列表分页，日期统计不再大号挤压 | `frontend/test-results/backoffice-ui-gstack/auth-security-final.png` |

## 3. 本次补充整改

- 登录页移动端：小屏下调整为登录卡片优先，品牌说明下置，避免首屏只有宣传内容。
- 安全中心前端：当前账号会话表增加分页和横向滚动，避免大量会话撑爆页面。
- 安全中心后端：`GET /api/v1/auth/sessions` 收口为活跃会话语义，只返回未吊销且 refresh token 未过期的记录，并将当前会话置顶。
- 自动化资产：新增 `frontend/tests/smoke/backoffice-ui-visual.spec.ts` 与 `npm run test:smoke:backoffice-ui`，用于后续 Playwright 环境完整时复跑。

## 4. 验证命令

```bash
cd frontend
npx eslint src/modules/auth/SecurityCenter.tsx tests/smoke/backoffice-ui-visual.spec.ts
npm run build
```

```bash
cd backend
go test ./modules/auth
```

```bash
go test ./...
```

## 5. 后续建议

- 若继续使用 Playwright 自动化截图，需要先安装匹配版本 Chromium；本次按用户要求采用 gstack Browser 完成真实浏览器验收。
- 建议后续把 gstack 截图验收纳入发布前清单：登录页、工作台、用户管理、设置页、安全中心五页固定复拍。
