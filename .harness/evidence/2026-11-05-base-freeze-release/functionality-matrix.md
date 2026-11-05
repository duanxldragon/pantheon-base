# Base 现有功能验收矩阵（2026-11-05）

父任务：2026-11-05-base-freeze-release。本表区分已有实现、当前候选证据与未关闭条件，不能将源代码存在或历史测试替代本轮验收。现有实现和 11 月 3/4 日修复纳入交付；历史未启动方案保持原生命周期，不通过删除/隐藏功能完成冻结。

| 阶段 | 当前功能（全部保留） | 实现与权威边界 | 本轮验收 | 当前状态 |
| --- | --- | --- | --- | --- |
| F1 | 登录、刷新、退出、改密、设备/会话撤销 | backend/modules/auth/login、session；SYSTEM_AUTH_CONTRACT | 全量真实 DB/Redis race + auth-login-logout core smoke；刷新同 token 至多成功一次，不能恢复撤销/覆盖租户 | 本地与代码候选CI通过；独立评审未关闭 |
| F1 | MFA/TOTP、高敏二次验证、安全事件 | backend/modules/auth/mfa、security | Go race 含 TOTP、安全中心、隔离与会话测试 | 本地与代码候选CI通过；独立评审未关闭 |
| F1 | tenant compat/multi、默认初始化、单向升级 | backend/pkg/tenant；TENANT_CONTRACT_V1；TENANT_INITIALIZATION_GUIDE | 真实 DB/race 含初始化、上下文 fail-closed、默认 tenant；tenant hostile/browser suite | 本地与代码候选CI通过；独立评审未关闭 |
| F1 | 租户 CRUD/成员、角色可登录租户、切换 | backend/modules/system/iam/tenant；login_tenant_switch；tenant role contract | 无角色 membership 不授权；拒绝不允许的 tenant；切换与撤销并发；picker/tenant browser smoke | 本地与代码候选CI通过；独立评审未关闭 |
| F1 | 系统域行隔离、tenant domain、平台运维能力 | backend/pkg/contracts/route_groups.go；system_modules；TENANT_CONTRACT_V1 | 双模式 wiring、tenant hostile/protected resources、跨租户拒绝 | 本地与代码候选CI通过；独立评审未关闭 |
| F1 | 租户运营、套餐配置和配额度量展示 | backend/modules/system/iam/tenant；tenant-ops；合同 §2.4/§2.5 | plan/quota 测试与 console smoke；V1 不承诺写路径强制配额 | 本地与代码候选CI通过；独立评审未关闭 |
| F2 | 用户/角色/菜单/权限点、接口/按钮授权 | system/iam；SYSTEM_IAM_CONTRACT | Go race + system user/role/menu core smoke；分页候选取全；无权入口与越权请求拒绝 | 本地与代码候选CI通过；独立评审未关闭 |
| F2 | 部门/岗位/树和角色数据范围 | system/org；data_scope_middleware；SYSTEM_ORG_CONTRACT | Go race + dept core smoke；不存在表/策略错误 fail-closed；超过单页候选仍完整 | 本地与代码候选CI通过；独立评审未关闭 |
| F2 | 字典、系统设置、安全与上传配置 | system/config；SYSTEM_CONFIG_CONTRACT | 真实 DB/Redis、dict/setting/cache/upload 授权回归；系统配置 smoke | 本地与代码候选CI通过；独立评审未关闭 |
| F2 | i18n 五语言、增量/fallback 与菜单声明 | system/i18n；frontend/src/i18n | FE prebuild 的 hardcode/generated checks 与类型构建，i18n Go/race | 静态/系统i18n套件与代码候选CI通过；独立评审未关闭 |
| F2 | 登录日志、操作日志、安全审计 | system/audit；auth/security | Go race 含 tenant attribution、安全事件/审计；API 写入 smoke 产生真实日志 | 本地与代码候选CI通过；独立评审未关闭 |
| F2 | CSV 导入导出、模板、容量和 CSV 注入防护 | backend/pkg/impexp；各系统 handler | Go race + core import/export；数据下载及失败语义 | 本地与代码候选CI通过；独立评审未关闭 |
| F2 | 本地/S3 上传、对象授权/容量/类型 | backend/pkg/upload；system/config/setting | 本地对象/权限 Go 回归；S3 集成依赖 provider 配置，最终 skip 必须明示 | 本地上传回归通过；真实S3 provider gap |
| F3 | lowcode basic/enterprise/many-to-many、生成格式/构建 | frontend/src/modules/lowcode/generator；LOWCODE_GENERATOR_GUIDE | generator dashboard/quality/lowcode 三种 shape smoke；生成物 gofmt/TS；后端 build preflight | 生成器shape/格式检查通过；五套业务生成 smoke 全部 exit 0（generated/database-import/master-detail/many-to-many/auto-recycle） |
| F3 | 动态模块注册、生成模块生命周期/数据表 | backend/modules/lowcode；MODULE_CONTRACT | Go race 构建/注册与 registry 测试；真实注册/清理与关系模板浏览器验证；重启后CRUD仍独立，不能把core3skip视为通过 | 已闭合并发：生成→注册→重启后真实 API CRUD（父/子、布尔更新、软删列表）通过；真实浏览器 CRUD 通过（校验/创建/编辑失败恢复/删除/390px）；模块在 smoke 清理时 purge |
| F3 | 平台工作台/壳层、导航、主题/暗色/响应式 | platform；DESIGN.md | FE static/unit、platform core/surfaces；真实渲染桌面/窄屏/暗色；关键状态 | 静态/部分渲染通过；platform-smoke 97 passed 与 77 passed 两次 exit 0（桌面/窄屏页面矩阵） |
| F4–F7 | 安全 SSRF 出站、依赖/CI、治理与正式发行 | pkg/security/ssrf；security workflow；foundation-release scripts | DNS 绑定拨号/race、npm exit regression、治理、官方 remote CI/release assets | 本地脚本与57b42ace远端CI通过；独立评审503，发行未完成 |
| F8 | Base -> Ops 唯一正式消费路径 | Ops foundation-release.lock.json + rebuild overlay | 官方 release checksum、lock、迁移 chain、全量消费者 race/CI | 必须在 F7 后执行，未完成 |

## 已批准未完成项与补丁归属

- Nov 3：系统路由统一保护、数据范围 schema 探测、超单页候选分页、生成器结构与格式、checker 接线/结构审计，已纳入候选57b42ace，本地完整验证与远端CI通过。
- Nov 4 PB-001/PB-002/PB-003：SSRF verified DNS address dial、npm audit exit propagation、refresh GETDEL + session 条件更新，代码与行为回归已完成，全量race1880通过/1真实S3 skip，远端CI通过。
- 原整改 programme 的收尾由本任务接管；runtime smoke、代码候选与GitHub CI证据已收集，独立review、正式release和Ops lock仍未关闭。
- Ops 专用 worktree 中 host state_version 与旧测试 fixture 修复待正式消费整合。Base migration 000031 与 Ops 旧分支 000031 存在编号冲突，消费前必须按真实 migration 来源重建并验证，不能直接手抄 SQL。
- 仅文字搜索未发现正在产品代码中明确标记的额外未完成实现；location 第三方 IP 地理库是原预留集成，不等同已批准开发事项。此观察不能替代上面的行为验收。

## 固定范围

租户 V1 保留；业务域 V1 不承诺 tenant isolation、配额不强制、自定义品牌/域名与商业计费不在当前合同。SSO/OIDC、独立告警/通知/报表/审批/任务/调度中心的历史未启动草案不自动纳入本次开发。对当前承诺功能出现的真实失败，先定位并修复，不能改成 Draft、去掉菜单或豁免测试。

## 停止条件

本地与 hosted 证据、独立 review、正式发行/消费均满足才能完成整个任务。外部S3配置、独立模型服务503仍是明确缺口；GitHub已恢复访问，57b42ace远端CI结果见hosted-validation.json。本表不签署维护冻结。
